import * as postgres from "https://deno.land/x/postgres@v0.14.0/mod.ts";
import { config } from "https://deno.land/x/dotenv@v3.1.0/mod.ts";
import { Buffer, StringReader } from "https://deno.land/std@0.119.0/io/mod.ts";
import * as binary from "https://deno.land/std@0.119.0/encoding/binary.ts";
import * as hex from "https://deno.land/std@0.119.0/encoding/hex.ts";

config({ safe: true, export: true });

const textDecoder = new TextDecoder();

const databaseUrl = Deno.env.get("POSTGRES_SECRET_URL")!;
const sessionSalt = Deno.env.get("POSTGRES_SECRET_SESSION_SALT")!;

const pool = new postgres.Pool(databaseUrl, 3, true);

export async function createSession(discordId: string): Promise<string> {
  return withConnection(async (connection) => {
    const transaction = connection.createTransaction("session_create");
    let id;
    try {
      await transaction.begin();
      await transaction.queryObject<{ id: number }>`
        UPDATE current_session_integer SET current_session_integer = current_session_integer + 1;
      `;
      const { rows } = await transaction.queryObject<{ id: bigint }>`
        SELECT id FROM current_session_integer;
      `;
      await transaction.commit();
      id = rows[0].id;
    } catch (err) {
      transaction.rollback();
      throw err;
    }

    const buf = new Buffer(new ArrayBuffer(sessionSalt.length + 8));
    await buf.readFrom(new StringReader(sessionSalt));
    await binary.writeVarbig(buf, id, { dataType: 'uint64', endian: "big" });

    const crypto = new Crypto();
    const hash = await crypto.subtle.digest("SHA-256", buf.bytes());
    const session = textDecoder.decode(hex.encode(new Uint8Array(hash)));

    await connection.queryObject`
      INSERT INTO sessions (id, discord_id)
      VALUES (${session}, ${discordId})
    `;

    return session;
  });
}

export async function createPost(
  session: string,
  postId: string,
): Promise<void> {
  withConnection(async (connection) => {
    await connection.queryObject`
      INSERT INTO hiring_posts (author, post_id)
      VALUES (
        (SELECT discord_id FROM sessions WHERE session_id=${session}),
        ${postId}
      );
    `;
  });
}

export async function getPostsFromSessionId(
  session: string,
): Promise<string[]> {
  return withConnection(async (connection) => {
    const { rows } = await connection.queryObject<{ post_id: string }>`
      SELECT post_id
      FROM (sessions JOIN hiring_posts ON sessions.discord_id=hiring_posts.author)
      WHERE sessions.session_id=${session} AND expires
    `;

    return rows.map((row) => row.post_id);
  });
}

export async function getDiscordId(session: string): Promise<string> {
  return withConnection(async (connection) => {
    const { rows } = await connection.queryObject<{ post_id: string }>`
      SELECT post_id FROM sessions WHERE session_id=${session}
    `;

    return rows[0].post_id;
  });
}

async function withConnection<T>(fn: (connection: postgres.PoolClient) => T) {
  const connection = await pool.connect();
  try {
    return await fn(connection);
  } finally {
    connection.release();
  }
}

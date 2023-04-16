import { Client } from "https://deno.land/x/harmony@v2.4.0/mod.ts";
import { config } from "https://deno.land/x/dotenv@v3.1.0/mod.ts";

config({ safe: true, export: true });

// put bot in server: https://discord.com/api/oauth2/authorize?client_id=927296528001937549&permissions=309237647360&scope=bot
// identify user: https://discord.com/api/oauth2/authorize?client_id=927296528001937549&redirect_uri=https%3A%2F%2Fmoolah.deno.dev%2Fdiscord-auth&response_type=code&scope=identify
const TOKEN = Deno.env.get("DISCORD_BOT_TOKEN")!;
const CHANNEL = Deno.env.get("DISCORD_BOT_CHANNEL")!;

const clientInfo = new Client({
  token: TOKEN,
  intents: [],
});

export const client = await clientInfo.connect();

/**
 * Creates a hiring post, returns the message id
 */
export async function createHiringPost(
  author: string,
  title: string,
  description: string,
  requirements: string[],
  estimatedPay: string,
): Promise<string> {
  const user = await client.users.get(author);
  if (!user) {
    throw new Error("user not found");
  }

  const message = await client.channels.sendMessage(CHANNEL, {
    embeds: [{
      type: "rich",
      title,
      description,
      author: {
        name: `${user?.username}#${user.discriminator}`,
        url: `https://discord.com/channels/@me/${user.id}`,
        icon_url: user.avatarURL(),
      },
      fields: [
        {
          name: "Requirements",
          value: requirements.map((str) => " - " + str).join("\n"),
        },
        {
          name: "Estimated Pay",
          value: estimatedPay,
        },
      ],
    }],
  });
  return message.id;
}

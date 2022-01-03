import { Client } from "https://deno.land/x/harmony@v2.4.0/mod.ts";

const TOKEN = Deno.env.get("DISCORD_BOT_TOKEN")!;

const clientInfo = new Client({
  token: TOKEN,
  intents: [],
});

export const client = await clientInfo.connect();
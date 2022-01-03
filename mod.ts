import {
  Client
} from 'https://deno.land/x/harmony@v2.4.0/mod.ts';

const clientInfo = new Client({
  token: Deno.env.get('DISCORD_BOT_TOKEN')!,
});

const client = await clientInfo.connect();
client.channels.sendMessage(Deno.env.get('DISCORD_BOT_CHANNEL')!, 'lmao');

await new Promise(() => {});

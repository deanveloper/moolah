import {
  Client
} from 'https://deno.land/x/harmony@v2.4.0/mod.ts';
import { serve, PathParams } from "https://deno.land/x/sift@0.4.2/mod.ts";

const clientInfo = new Client({
  token: Deno.env.get('DISCORD_BOT_TOKEN')!,
});

const client = await clientInfo.connect();

serve({
  "/": main,
});

function main(request: Request, _params: PathParams): Response {
  client.channels.sendMessage(Deno.env.get('DISCORD_BOT_CHANNEL')!, 'lmao');
  return new Response('', { status: 200 });
}
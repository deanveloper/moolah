import {
  Client
} from 'https://deno.land/x/harmony@v2.4.0/mod.ts';
import { serve, PathParams } from "https://deno.land/x/sift@0.4.2/mod.ts";

const TOKEN = Deno.env.get('DISCORD_BOT_TOKEN')!;
const CHANNEL = Deno.env.get('DISCORD_BOT_CHANNEL')!;


const clientInfo = new Client({
  token: TOKEN,
  intents: [],
});

const client = await clientInfo.connect();

serve({
  "/": main,
});

function main(_request: Request, _params: PathParams): Response {
  client.channels.sendMessage(CHANNEL, '927352929239834714');
  return new Response('', { status: 200 });
}

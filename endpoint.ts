import { PathParams, serve } from "https://deno.land/x/sift@0.4.2/mod.ts";
import { client } from "./discord.ts";

const CHANNEL = Deno.env.get("DISCORD_BOT_CHANNEL")!;

serve({
  "/": main,
});

function main(_request: Request, _params: PathParams): Response {
  client.channels.sendMessage(CHANNEL, "test message");
  return new Response("", { status: 200 });
}

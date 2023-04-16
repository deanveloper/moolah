import { json, PathParams, serve } from "https://deno.land/x/sift@0.4.2/mod.ts";
import { createHiringPost } from "./discord.ts";
import * as dbController from "./supabase.ts";

class FieldError extends Error {
  field: string;

  constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }

  asResponse(): Response {
    return json({ success: false, error: this.message, field: this.field }, {
      status: 400,
    });
  }
}

serve({
  "/api/discord-auth": discordOauthRedirectEndpoint,
  "/api/posts/dates": getHiringPostDates,
  "/api/post": postHiringEndpoint,
});

async function discordOauthRedirectEndpoint(
  request: Request,
  params: PathParams,
): Promise<Response> {
  return json(request);
}

async function getHiringPostDates(
  request: Request,
  _params: PathParams,
): Promise<Response> {
  if (request.method !== "GET") {
    return json({ success: false, error: "must be GET" }, { status: 400 });
  }

  const params = new URL(request.url).searchParams;
  const session = params.get("session");
  if (session === null) {
    throw new FieldError("session", "This field is required");
  }

  const posts = await dbController.getPostsFromSessionId(session);

  return json({ success: true });
}

async function postHiringEndpoint(
  request: Request,
  _params: PathParams,
): Promise<Response> {
  if (request.method !== "POST") {
    return json({ success: false, error: "must be POST" }, { status: 400 });
  }

  const {
    session,
    title,
    description,
    requirementsb64,
    estimatedPay,
  } = await request.json();

  // perform validation

  if (session === null) {
    throw new FieldError("session", `This field is required`);
  }
  if (requirementsb64 === null) {
    throw new FieldError("requirementsb64", `This field is required`);
  }

  const requirements = atob(requirementsb64).split("\n");

  validateStringLength(title, 50, "title");
  validateStringLength(estimatedPay, 50, "estimatedPay");
  for (const [i, req] of requirements.entries()) {
    validateStringLength(req, 50, `requirementsb64[${i}]`);
  }

  validateStringLength(description, 500, "description");

  const author = await dbController.getDiscordId(session);

  // post in discord
  const messageId = await createHiringPost(
    author,
    title!,
    description!,
    requirements,
    estimatedPay!,
  );

  // put messageid in database
  await dbController.createPost(
    author,
    messageId,
  );

  // success
  return json({ success: true });
}

function validateStringLength(
  str: string | null,
  maxLength: number,
  fieldName: string,
) {
  if (str === null) {
    throw new FieldError(fieldName, `This field is required`);
  }
  if (str.length > maxLength) {
    throw new FieldError(
      fieldName,
      `Must be shorter than ${maxLength} characters`,
    );
  }
  return true;
}

/**
 * Converts Discord snowflake to a Date object
 *
 * from https://gist.github.com/foobball/f29ba5ddc0fd872d4311bed8fd306f39
 *
 * @param {String} snowflake
 * @returns {Date}
 */
function snowflakeToDate(snowflake: bigint) {
  const dateBits = Number(BigInt.asUintN(64, snowflake) >> 22n);
  return new Date(dateBits + 1420070400000);
}

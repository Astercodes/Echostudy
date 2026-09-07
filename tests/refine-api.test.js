import test from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "../api/refine-stretch.js";
const draft = {
  title: "Communicate better",
  objective: "",
  success: "",
  goal: "Improve teamwork",
  area: "Career",
  subArea: "",
  capacities: "Communication",
  planned: "15",
};
const suggestion = {
  title: "Lead a short check-in",
  objective: "Practise active listening",
  success: "Summarize each viewpoint and confirm one action",
  rationale: "A small observable practice",
};
function response() {
  return {
    statusCode: 0,
    headers: {},
    setHeader(k, v) {
      this.headers[k] = v;
    },
    status(n) {
      this.statusCode = n;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
const request = (body = draft) => ({
  method: "POST",
  headers: { authorization: "Bearer valid-test-token" },
  body,
});
test("unauthenticated, invalid and unconfigured requests never reach OpenAI", async () => {
  let calls = [];
  const fetcher = async (url) => {
    calls.push(url);
    return { ok: true, json: async () => ({ id: "user" }) };
  };
  const handler = createHandler({ fetcher, env: {}, limits: new Map() });
  let res = response();
  await handler({ ...request(), headers: {} }, res);
  assert.equal(res.statusCode, 401);
  assert.equal(calls.length, 0);
  res = response();
  await handler(request({ ...draft, title: "x".repeat(3001) }), res);
  assert.equal(res.statusCode, 400);
  assert.equal(calls.length, 0);
  res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 503);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].endsWith("/auth/v1/user"));
});
test("verified users receive bounded structured suggestions without exposing credentials", async () => {
  const calls = [];
  const handler = createHandler({
    env: { OPENAI_API_KEY: "server-only-test" },
    limits: new Map(),
    fetcher: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () =>
          url.endsWith("/user")
            ? { id: "user" }
            : {
                status: "completed",
                output: [
                  {
                    content: [
                      { type: "output_text", text: JSON.stringify(suggestion) },
                    ],
                  },
                ],
              },
      };
    },
  });
  const res = response();
  await handler(request(), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.suggestion, suggestion);
  const sent = JSON.parse(calls[1].options.body);
  assert.equal(sent.store, false);
  assert.equal(sent.text.format.strict, true);
  assert.equal(sent.max_output_tokens, 1200);
  assert.equal(JSON.stringify(res.body).includes("server-only-test"), false);
  assert.equal(res.headers["Cache-Control"], "no-store");
});
test("expired sessions and model refusals do not produce usable suggestions", async () => {
  let res = response();
  await createHandler({
    env: { OPENAI_API_KEY: "test" },
    fetcher: async () => ({ ok: false }),
    limits: new Map(),
  })(request(), res);
  assert.equal(res.statusCode, 401);
  res = response();
  await createHandler({
    env: { OPENAI_API_KEY: "test" },
    limits: new Map(),
    fetcher: async (url) => ({
      ok: true,
      json: async () =>
        url.endsWith("/user")
          ? { id: "user" }
          : {
              status: "completed",
              output: [
                { content: [{ type: "refusal", refusal: "Cannot help" }] },
              ],
            },
    }),
  })(request(), res);
  assert.equal(res.statusCode, 502);
});
test("short-window throttling stops repeated provider calls", async () => {
  let providerCalls = 0;
  const handler = createHandler({
    env: { OPENAI_API_KEY: "test" },
    limits: new Map(),
    now: () => 1000,
    fetcher: async (url) => {
      if (!url.endsWith("/user")) providerCalls++;
      return {
        ok: true,
        json: async () =>
          url.endsWith("/user")
            ? { id: "user" }
            : {
                status: "completed",
                output: [
                  {
                    content: [
                      { type: "output_text", text: JSON.stringify(suggestion) },
                    ],
                  },
                ],
              },
      };
    },
  });
  for (let i = 0; i < 11; i++) {
    const res = response();
    await handler(request(), res);
    assert.equal(res.statusCode, i === 10 ? 429 : 200);
  }
  assert.equal(providerCalls, 10);
});

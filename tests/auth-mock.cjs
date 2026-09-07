const USER_ONE = "11111111-1111-4111-8111-111111111111";
const USER_TWO = "22222222-2222-4222-8222-222222222222";
function user(email = "learner@example.test") {
  return {
    id: email.startsWith("second") ? USER_TWO : USER_ONE,
    aud: "authenticated",
    role: "authenticated",
    email,
    email_confirmed_at: "2026-09-06T12:00:00Z",
    created_at: "2026-09-06T12:00:00Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {
      full_name: email.startsWith("second") ? "Second Learner" : "Test Learner",
    },
    identities: [],
  };
}
function session(u) {
  const enc = (v) => Buffer.from(JSON.stringify(v)).toString("base64url");
  return {
    access_token:
      enc({ alg: "HS256", typ: "JWT" }) +
      "." +
      enc({
        sub: u.id,
        email: u.email,
        exp: Math.floor(Date.now() / 1000) + 3600,
        role: "authenticated",
        aud: "authenticated",
      }) +
      ".test-signature",
    refresh_token: "test-refresh",
    token_type: "bearer",
    expires_in: 3600,
    user: u,
  };
}
async function installAuthMock(page) {
  const calls = [];
  // Browser checks must not wait on external font services.
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) =>
    route.abort(),
  );
  await page.route("https://auth.echostudy.test/auth/v1/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      body = req.postDataJSON() || {};
    calls.push({ path: url.pathname, method: req.method() });
    const response = (status, json) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(json),
      });
    if (req.method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
      });
    if (url.pathname.endsWith("/settings"))
      return response(200, {
        external: {},
        disable_signup: false,
        mailer_autoconfirm: true,
        phone_autoconfirm: false,
        sms_provider: "twilio",
        jwt_exp: 3600,
      });
    if (url.pathname.endsWith("/token")) {
      if (body.password !== "Study123!")
        return response(400, {
          msg: "Invalid login credentials",
          code: "invalid_credentials",
        });
      return response(200, session(user(body.email)));
    }
    if (url.pathname.endsWith("/signup"))
      return response(200, user(body.email));
    if (url.pathname.endsWith("/user")) {
      const token = req.headers().authorization?.split(" ")[1];
      if (!token) return response(401, { msg: "Invalid JWT" });
      let payload;
      try {
        payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64url").toString(),
        );
      } catch {
        return response(401, { msg: "Invalid JWT" });
      }
      return response(200, user(payload.email));
    }
    if (url.pathname.endsWith("/recover")) return response(200, {});
    if (url.pathname.endsWith("/logout")) return route.fulfill({ status: 204 });
    return response(404, { msg: "Unexpected test request" });
  });
  return calls;
}
async function enterWorkspace(page, email = "learner@example.test") {
  await page
    .getByRole("button", { name: "Log in", exact: false })
    .first()
    .click();
  await page.getByLabel("Email address", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Study123!");
  await page
    .getByRole("button", { name: "Sign in to my workspace", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Make room for becoming." })
    .waitFor();
}
module.exports = {
  installAuthMock,
  enterWorkspace,
  USER_ONE,
  USER_TWO,
  session,
  user,
};

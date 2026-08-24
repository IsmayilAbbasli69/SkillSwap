const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/app");
const { reset } = require("../src/data/local-store");

let server;
let base;
test.before(() => { reset(); server = app.listen(0); base = `http://127.0.0.1:${server.address().port}/api`; });
test.after(() => new Promise(resolve => server.close(resolve)));

const request = async (path, { token, body, method = "GET" } = {}) => {
  const response = await fetch(`${base}${path}`, { method, headers: { ...(body && { "content-type": "application/json" }), ...(token && { authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
  const json = response.status === 204 ? null : await response.json();
  return { response, json };
};
const login = async email => (await request("/auth/login", { method: "POST", body: { email, password: "Password123!" } })).json.data.session.accessToken;

test("auth, authorization, signup and shared request lifecycle", async () => {
  const invalid = await request("/auth/login", { method: "POST", body: { email: "student@skillswap.test", password: "wrong" } });
  assert.equal(invalid.response.status, 401);
  assert.equal(invalid.json.error.code, "UNAUTHORIZED");

  const john = await login("student@skillswap.test");
  const maya = await login("maya@skillswap.test");
  const admin = await login("admin@skillswap.test");
  assert.equal((await request("/profile/me", { token: john })).json.data.role, "STUDENT");
  assert.equal((await request("/profile/me", { token: admin })).json.data.role, "ADMIN");
  assert.equal((await request("/admin/stats", { token: john })).response.status, 403);
  assert.equal((await request("/admin/stats", { token: admin })).response.status, 200);

  const browse = await request("/search?page=1&limit=9", { token: john });
  assert.equal(browse.response.status, 200);
  assert.equal(browse.json.meta.limit, 9);
  assert.ok(browse.json.data.length > 0);
  assert.equal(browse.json.data[0].offeredSkill, null);
  assert.ok(Array.isArray(browse.json.data[0].match.reasons));
  assert.ok(browse.json.data.every(result => result.profile.id !== "90000000-0000-4000-8000-000000000004"));
  const filtered = await request("/search?skillId=70000000-0000-4000-8000-000000000001&page=1&limit=9", { token: john });
  assert.equal(filtered.response.status, 200);
  assert.ok(filtered.json.data.every(result => result.offeredSkill?.id === "70000000-0000-4000-8000-000000000001"));

  const signup = await request("/auth/signup", { method: "POST", body: { email: "new.user@skillswap.test", password: "Password123!", firstName: "New", lastName: "User" } });
  assert.equal(signup.response.status, 201);
  assert.equal((await request("/profile/me", { token: signup.json.data.session.accessToken })).response.status, 200);
  assert.ok(await login("new.user@skillswap.test"));

  const created = await request("/requests", { method: "POST", token: john, body: { receiverId: "90000000-0000-4000-8000-000000000002", requestedSkillId: "70000000-0000-4000-8000-000000000001", offeredSkillId: "70000000-0000-4000-8000-000000000002" } });
  assert.equal(created.response.status, 201);
  const id = created.json.data.id;
  assert.equal((await request("/requests?type=incoming", { token: maya })).json.data[0].id, id);
  assert.equal((await request(`/requests/${id}`, { method: "PATCH", token: maya, body: { status: "ACCEPTED" } })).json.data.status, "ACCEPTED");
  assert.equal((await request("/requests?type=outgoing", { token: john })).json.data[0].status, "ACCEPTED");
});

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

  const scheduled = await request(`/requests/${id}/session`, { method: "POST", token: john, body: { scheduledAt: "2026-08-24T12:00:00.000Z", duration: 60, meetingType: "ONLINE", meetingUrl: "https://meet.example.test/session" } });
  assert.equal(scheduled.response.status, 201);
  const sessionId = scheduled.json.data.id;
  await request(`/sessions/${sessionId}`, { method: "PATCH", token: john, body: { status: "COMPLETED" } });

  const johnSession = (await request("/sessions?status=COMPLETED", { token: john })).json.data.find(session => session.id === sessionId);
  const mayaSession = (await request("/sessions?status=COMPLETED", { token: maya })).json.data.find(session => session.id === sessionId);
  assert.deepEqual(johnSession.peer, { id: "90000000-0000-4000-8000-000000000002", name: "Maya Johnson" });
  assert.deepEqual(mayaSession.peer, { id: "90000000-0000-4000-8000-000000000001", name: "John Smith" });
  assert.equal(johnSession.requestedSkill.name, "English");
  assert.equal(johnSession.offeredSkill.name, "Mathematics");
  assert.equal(johnSession.reviewSubmitted, false);

  const submitted = await request(`/sessions/${sessionId}/review`, { method: "POST", token: john, body: { revieweeId: johnSession.peer.id, rating: 5, comment: "Great" } });
  assert.equal(submitted.response.status, 201);
  const refreshedJohnSession = (await request("/sessions?status=COMPLETED", { token: john })).json.data.find(session => session.id === sessionId);
  assert.equal(refreshedJohnSession.reviewSubmitted, true);

  const mayaProfile = await request("/users/90000000-0000-4000-8000-000000000002", { token: john });
  const publicReview = mayaProfile.json.data.recentReviews.find(review => review.comment === "Great");
  assert.deepEqual(publicReview.reviewer, { id: "90000000-0000-4000-8000-000000000001", name: "John Smith" });
  assert.equal(publicReview.reviewer.email, undefined);
});

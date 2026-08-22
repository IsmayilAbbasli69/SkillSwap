const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "SkillSwap MVP API",
    version: "1.0.0",
    description: "Backend-only MVP API based on the SkillSwap PRD/TDD"
  },
  servers: [{ url: "http://localhost:4000/api" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer"
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    "/auth/signup": {
      post: {
        summary: "Signup with Supabase and create profile",
        security: [],
        responses: { "201": { description: "Created" } }
      }
    },
    "/auth/login": {
      post: {
        summary: "Login with Supabase email/password",
        security: [],
        responses: { "200": { description: "OK" } }
      }
    },
    "/profile/me": {
      get: { summary: "Get current profile", responses: { "200": { description: "OK" } } },
      patch: { summary: "Update current profile", responses: { "200": { description: "OK" } } }
    },
    "/skills": {
      get: { summary: "List skills", responses: { "200": { description: "OK" } } }
    },
    "/profile/me/skills": {
      post: { summary: "Add user skill", responses: { "201": { description: "Created" } } }
    },
    "/profile/me/skills/{userSkillId}": {
      delete: {
        summary: "Delete user skill",
        parameters: [{ name: "userSkillId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "No Content" } }
      }
    },
    "/search": {
      get: { summary: "Search and rank candidates", responses: { "200": { description: "OK" } } }
    },
    "/requests": {
      get: { summary: "List requests", responses: { "200": { description: "OK" } } },
      post: { summary: "Create request", responses: { "201": { description: "Created" } } }
    },
    "/requests/{id}": {
      patch: {
        summary: "Accept/decline request",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/requests/{requestId}/session": {
      post: {
        summary: "Create session",
        parameters: [{ name: "requestId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Created" } }
      }
    },
    "/sessions": {
      get: { summary: "List sessions", responses: { "200": { description: "OK" } } }
    },
    "/sessions/{id}": {
      patch: {
        summary: "Update session status",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/sessions/{sessionId}/review": {
      post: {
        summary: "Create review",
        parameters: [{ name: "sessionId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Created" } }
      }
    },
    "/admin/students": {
      get: { summary: "List students (admin)", responses: { "200": { description: "OK" } } }
    },
    "/admin/students/{id}/status": {
      patch: {
        summary: "Update student status (admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/admin/skills": {
      post: { summary: "Create admin skill", responses: { "201": { description: "Created" } } }
    },
    "/admin/skills/{id}": {
      patch: {
        summary: "Update admin skill",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } }
      },
      delete: {
        summary: "Disable admin skill",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" } }
      }
    },
    "/admin/stats": {
      get: { summary: "Admin stats", responses: { "200": { description: "OK" } } }
    }
  }
};

module.exports = swaggerSpec;

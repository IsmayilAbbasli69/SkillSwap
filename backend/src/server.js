const app = require("./app");
const env = require("./config/env");

app.listen(env.port, () => {
  // Keep startup logging small and clear for student project demos.
  console.log(`SkillSwap backend running on http://localhost:${env.port}`);
  console.log(`Swagger docs at http://localhost:${env.port}/docs`);
});

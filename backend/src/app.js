const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const env = require("./config/env");
const swaggerSpec = require("./config/swagger");
const authMiddleware = require("./middleware/auth");
const errorMiddleware = require("./middleware/error");
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const skillRoutes = require("./routes/skill.routes");
const searchRoutes = require("./routes/search.routes");
const requestRoutes = require("./routes/request.routes");
const sessionRoutes = require("./routes/session.routes");
const adminRoutes = require("./routes/admin.routes");
const userRoutes = require("./routes/user.routes");

const app = express();

// CORS — allow all origins and methods (for development/testing)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(`${env.apiPrefix}/auth`, authRoutes);

app.use(env.apiPrefix, authMiddleware);
app.use(`${env.apiPrefix}/profile`, profileRoutes);
app.use(`${env.apiPrefix}/users`, userRoutes);
app.use(`${env.apiPrefix}/skills`, skillRoutes);
app.use(`${env.apiPrefix}/search`, searchRoutes);
app.use(`${env.apiPrefix}/requests`, requestRoutes);
app.use(`${env.apiPrefix}/sessions`, sessionRoutes);
app.use(`${env.apiPrefix}/admin`, adminRoutes);

app.use(errorMiddleware);

module.exports = app;


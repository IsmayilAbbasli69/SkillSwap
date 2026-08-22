const errorMiddleware = (err, _req, res, _next) => {
  const status = err.status || 500;
  const message =
    status === 500 ? "Internal server error" : err.message || "Unexpected error";

  res.status(status).json({
    error: {
      code: err.code || "INTERNAL_ERROR",
      message
    }
  });
};

module.exports = errorMiddleware;

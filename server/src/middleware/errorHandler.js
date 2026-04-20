export const notFoundHandler = (_req, res) => {
  res.status(404).json({ message: "Resource not found." });
};

export const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Unexpected server error.";
  res.status(statusCode).json({ message });
};

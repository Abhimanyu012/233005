export const errorHandler = (err, req, res, next) => {
  console.error("ERROR", err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Internal serve error",
  });
};

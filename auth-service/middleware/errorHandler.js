const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.name === "ValidationError") {
    return res.status(400).json({ message: "validation failed", details: err.message });
  }

  if (err?.code === 11000) {
    return res.status(409).json({ message: "user already exists with this email" });
  }

  return res.status(500).json({ message: "internal server error" });
};

module.exports = errorHandler;

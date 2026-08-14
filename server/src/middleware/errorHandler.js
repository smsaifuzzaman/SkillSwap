export function notFound(req, res) {
  res.status(404).json({ message: "Route not found." });
}

export function errorHandler(error, req, res, next) {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({ message: messages[0] || "Validation failed." });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: "That email is already registered." });
  }

  console.error(error);
  return res.status(500).json({ message: "Something went wrong on the server." });
}

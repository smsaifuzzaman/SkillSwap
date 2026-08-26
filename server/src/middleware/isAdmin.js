// Route guard for System Admin-only endpoints (dispute moderation, etc).
// Confirmed against your User.js: role enum is exactly
// ["learner", "team-admin", "system-admin"].

export default function isAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }

  if (req.user.role !== "system-admin") {
    return res.status(403).json({
      success: false,
      message: "This action requires System Admin privileges",
    });
  }

  next();
}

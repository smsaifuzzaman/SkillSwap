export function getApiInfo(req, res) {
  res.json({
    service: "SkillSwap API",
    status: "running",
    health: "/api/health"
  });
}

export function getHealth(req, res) {
  res.json({ status: "ok", service: "skillswap-api" });
}

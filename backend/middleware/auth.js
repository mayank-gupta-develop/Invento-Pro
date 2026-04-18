export function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (req.session.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admins only" });
  }
  next();
}

export function blockAdmin(req, res, next) {
  if (req.session.user?.role === "admin") {
    return res.status(403).json({ error: "Forbidden for admin users" });
  }
  next();
}

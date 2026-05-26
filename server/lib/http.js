export function badRequest(res, message) {
  return res.status(400).json({ error: message || "Bad Request" });
}

export function unauthorized(res, message) {
  return res.status(401).json({ error: message || "Unauthorized" });
}

export function forbidden(res, message) {
  return res.status(403).json({ error: message || "Forbidden" });
}

export function notFound(res, message) {
  return res.status(404).json({ error: message || "Not Found" });
}


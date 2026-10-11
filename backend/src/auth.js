import jwt from "jsonwebtoken";
import { query } from "./db.js";

const SECRET = process.env.JWT_SECRET || "webgateway-dev-secret-change-me";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name, email: user.email },
    SECRET,
    { expiresIn: "12h" }
  );
}

export async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Login required" });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Session expired" });
  }
}

export function allow(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed for this role" });
    }
    next();
  };
}

export async function findUserByEmail(email) {
  const rows = await query("SELECT * FROM users WHERE email = ? AND active = 1", [email]);
  return rows[0];
}

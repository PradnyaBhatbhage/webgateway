import { Router } from "express";
import bcrypt from "bcryptjs";
import { findUserByEmail, signToken, auth } from "../auth.js";
import { query } from "../db.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = await findUserByEmail(String(email || "").trim().toLowerCase());
  if (!user) return res.status(401).json({ error: "Invalid email or password" });
  const ok = await bcrypt.compare(password || "", user.password_hash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });
  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

authRouter.get("/me", auth, async (req, res) => {
  const rows = await query(
    "SELECT id, name, email, role, phone FROM users WHERE id = ?",
    [req.user.id]
  );
  res.json(rows[0] || req.user);
});

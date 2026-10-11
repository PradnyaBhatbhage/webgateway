import { Router } from "express";
import { execute, nextNumber, query } from "../db.js";
import { money, sumLines, today } from "../util.js";

export const quotesRouter = Router();

quotesRouter.get("/", async (_req, res) => {
  res.json(
    await query(
      `SELECT q.*, c.name AS customer_name FROM quotations q
       JOIN customers c ON c.id = q.customer_id ORDER BY q.id DESC`
    )
  );
});

quotesRouter.get("/:id", async (req, res) => {
  const [q] = await query(
    `SELECT q.*, c.name AS customer_name, c.mobile, c.gstin, c.address
     FROM quotations q JOIN customers c ON c.id = q.customer_id WHERE q.id = ?`,
    [req.params.id]
  );
  if (!q) return res.status(404).json({ error: "Not found" });
  const items = await query("SELECT * FROM quotation_items WHERE quotation_id = ?", [req.params.id]);
  res.json({ ...q, items });
});

quotesRouter.post("/", async (req, res) => {
  const b = req.body || {};
  if (!b.customer_id || !b.items?.length) {
    return res.status(400).json({ error: "Customer and items required" });
  }
  const totals = sumLines(b.items);
  const quoteNo = await nextNumber("WG-QT-", "quotations", "quote_no");
  const r = await execute(
    `INSERT INTO quotations (quote_no, customer_id, site_id, quote_date, status, subtotal, tax, total, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      quoteNo,
      b.customer_id,
      b.site_id || null,
      b.quote_date || today(),
      b.status || "draft",
      money(totals.subtotal),
      money(totals.tax),
      money(totals.total),
      b.notes || null,
    ]
  );
  for (const it of b.items) {
    await execute(
      `INSERT INTO quotation_items (quotation_id, product_id, description, qty, rate, tax_pct)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [r.insertId, it.product_id || null, it.description, it.qty, it.rate, it.tax_pct ?? 18]
    );
  }
  const [row] = await query("SELECT * FROM quotations WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

quotesRouter.patch("/:id/status", async (req, res) => {
  await execute("UPDATE quotations SET status = ? WHERE id = ?", [
    req.body.status,
    req.params.id,
  ]);
  const [row] = await query("SELECT * FROM quotations WHERE id = ?", [req.params.id]);
  res.json(row);
});

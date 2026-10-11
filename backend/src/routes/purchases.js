import { Router } from "express";
import { execute, query } from "../db.js";
import { money, sumLines } from "../util.js";

export const purchasesRouter = Router();

purchasesRouter.get("/suppliers", async (_req, res) => {
  res.json(await query("SELECT * FROM suppliers ORDER BY name"));
});

purchasesRouter.post("/suppliers", async (req, res) => {
  const b = req.body || {};
  const r = await execute(
    "INSERT INTO suppliers (name, phone, email, gstin, address) VALUES (?, ?, ?, ?, ?)",
    [b.name, b.phone || null, b.email || null, b.gstin || null, b.address || null]
  );
  const [row] = await query("SELECT * FROM suppliers WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

purchasesRouter.get("/", async (_req, res) => {
  res.json(
    await query(
      `SELECT p.*, s.name AS supplier_name FROM purchases p
       JOIN suppliers s ON s.id = p.supplier_id ORDER BY p.id DESC`
    )
  );
});

purchasesRouter.get("/:id", async (req, res) => {
  const [bill] = await query(
    `SELECT p.*, s.name AS supplier_name FROM purchases p
     JOIN suppliers s ON s.id = p.supplier_id WHERE p.id = ?`,
    [req.params.id]
  );
  if (!bill) return res.status(404).json({ error: "Not found" });
  const items = await query(
    `SELECT pi.*, pr.name AS product_name FROM purchase_items pi
     JOIN products pr ON pr.id = pi.product_id WHERE pi.purchase_id = ?`,
    [req.params.id]
  );
  res.json({ ...bill, items });
});

purchasesRouter.post("/", async (req, res) => {
  const b = req.body || {};
  if (!b.supplier_id || !b.items?.length) {
    return res.status(400).json({ error: "Supplier and items required" });
  }
  const totals = sumLines(b.items);
  const r = await execute(
    `INSERT INTO purchases (supplier_id, bill_no, bill_date, subtotal, tax, total, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      b.supplier_id,
      b.bill_no || `PUR-${Date.now()}`,
      b.bill_date,
      money(totals.subtotal),
      money(totals.tax),
      money(totals.total),
      b.notes || null,
    ]
  );
  for (const it of b.items) {
    await execute(
      `INSERT INTO purchase_items (purchase_id, product_id, qty, rate, tax_pct, serials_text)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [r.insertId, it.product_id, it.qty, it.rate, it.tax_pct ?? 18, it.serials_text || null]
    );
    await execute("UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?", [
      Number(it.qty),
      it.product_id,
    ]);
    const serials = String(it.serials_text || "")
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const sn of serials) {
      await execute("INSERT INTO serials (product_id, serial_no, status) VALUES (?, ?, 'in_stock')", [
        it.product_id,
        sn,
      ]);
    }
  }
  const [row] = await query("SELECT * FROM purchases WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

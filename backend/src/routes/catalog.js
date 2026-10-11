import { Router } from "express";
import { execute, query } from "../db.js";

export const catalogRouter = Router();

catalogRouter.get("/categories", async (_req, res) => {
  res.json(await query("SELECT * FROM categories ORDER BY name"));
});

catalogRouter.post("/categories", async (req, res) => {
  const r = await execute("INSERT INTO categories (name, parent_id) VALUES (?, ?)", [
    req.body.name,
    req.body.parent_id || null,
  ]);
  const [row] = await query("SELECT * FROM categories WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

catalogRouter.get("/products", async (_req, res) => {
  const rows = await query(
    `SELECT p.*, c.name AS category_name,
      (SELECT COUNT(*) FROM serials s WHERE s.product_id = p.id AND s.status = 'in_stock') AS serials_in_stock
     FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.name`
  );
  res.json(rows);
});

catalogRouter.post("/products", async (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: "Product name required" });
  const r = await execute(
    `INSERT INTO products (category_id, name, sku, hsn, unit, sale_price, purchase_price, tax_pct, track_serial, min_stock, stock_qty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      b.category_id || null,
      b.name,
      b.sku || null,
      b.hsn || null,
      b.unit || "pcs",
      b.sale_price || 0,
      b.purchase_price || 0,
      b.tax_pct ?? 18,
      b.track_serial ? 1 : 0,
      b.min_stock ?? 2,
      b.stock_qty || 0,
    ]
  );
  const [row] = await query("SELECT * FROM products WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

catalogRouter.put("/products/:id", async (req, res) => {
  const b = req.body || {};
  await execute(
    `UPDATE products SET category_id=?, name=?, sku=?, hsn=?, unit=?, sale_price=?, purchase_price=?, tax_pct=?, track_serial=?, min_stock=?
     WHERE id=?`,
    [
      b.category_id || null,
      b.name,
      b.sku || null,
      b.hsn || null,
      b.unit || "pcs",
      b.sale_price || 0,
      b.purchase_price || 0,
      b.tax_pct ?? 18,
      b.track_serial ? 1 : 0,
      b.min_stock ?? 2,
      req.params.id,
    ]
  );
  const [row] = await query("SELECT * FROM products WHERE id = ?", [req.params.id]);
  res.json(row);
});

catalogRouter.get("/serials", async (req, res) => {
  const q = `%${req.query.q || ""}%`;
  const rows = await query(
    `SELECT s.*, p.name AS product_name, c.name AS customer_name
     FROM serials s
     JOIN products p ON p.id = s.product_id
     LEFT JOIN customers c ON c.id = s.customer_id
     WHERE s.serial_no LIKE ? OR p.name LIKE ?
     ORDER BY s.id DESC LIMIT 50`,
    [q, q]
  );
  res.json(rows);
});

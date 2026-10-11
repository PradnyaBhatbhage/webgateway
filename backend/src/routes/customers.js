import { Router } from "express";
import { execute, query } from "../db.js";

export const customersRouter = Router();

customersRouter.get("/", async (_req, res) => {
  const rows = await query(
    `SELECT c.*,
      (SELECT COUNT(*) FROM invoices i WHERE i.customer_id = c.id) AS invoice_count,
      (SELECT COALESCE(SUM(i.total - i.paid),0) FROM invoices i WHERE i.customer_id = c.id) AS outstanding
     FROM customers c ORDER BY c.id DESC`
  );
  res.json(rows);
});

customersRouter.get("/:id", async (req, res) => {
  const [customer] = await query("SELECT * FROM customers WHERE id = ?", [req.params.id]);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  const sites = await query("SELECT * FROM customer_sites WHERE customer_id = ?", [req.params.id]);
  const invoices = await query(
    "SELECT * FROM invoices WHERE customer_id = ? ORDER BY id DESC LIMIT 20",
    [req.params.id]
  );
  const jobs = await query(
    "SELECT * FROM jobs WHERE customer_id = ? ORDER BY id DESC LIMIT 20",
    [req.params.id]
  );
  const amc = await query("SELECT * FROM amc_contracts WHERE customer_id = ?", [req.params.id]);
  const rentals = await query("SELECT * FROM rentals WHERE customer_id = ?", [req.params.id]);
  res.json({ ...customer, sites, invoices, jobs, amc, rentals });
});

customersRouter.post("/", async (req, res) => {
  const b = req.body || {};
  if (!b.name || !b.mobile) return res.status(400).json({ error: "Name and mobile required" });
  const r = await execute(
    `INSERT INTO customers (name, company, mobile, alt_mobile, email, address, gstin, customer_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      b.name,
      b.company || null,
      b.mobile,
      b.alt_mobile || null,
      b.email || null,
      b.address || null,
      b.gstin || null,
      b.customer_type || "business",
    ]
  );
  if (b.site_name) {
    await execute(
      "INSERT INTO customer_sites (customer_id, name, address, contact_name, contact_phone) VALUES (?, ?, ?, ?, ?)",
      [r.insertId, b.site_name, b.address || null, b.name, b.mobile]
    );
  }
  const [row] = await query("SELECT * FROM customers WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

customersRouter.put("/:id", async (req, res) => {
  const b = req.body || {};
  await execute(
    `UPDATE customers SET name=?, company=?, mobile=?, alt_mobile=?, email=?, address=?, gstin=?, customer_type=?
     WHERE id=?`,
    [
      b.name,
      b.company || null,
      b.mobile,
      b.alt_mobile || null,
      b.email || null,
      b.address || null,
      b.gstin || null,
      b.customer_type || "business",
      req.params.id,
    ]
  );
  const [row] = await query("SELECT * FROM customers WHERE id = ?", [req.params.id]);
  res.json(row);
});

customersRouter.post("/:id/sites", async (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: "Site name required" });
  const r = await execute(
    "INSERT INTO customer_sites (customer_id, name, address, contact_name, contact_phone) VALUES (?, ?, ?, ?, ?)",
    [req.params.id, b.name, b.address || null, b.contact_name || null, b.contact_phone || null]
  );
  const [row] = await query("SELECT * FROM customer_sites WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

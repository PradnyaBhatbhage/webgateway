import { Router } from "express";
import { execute, nextNumber, query } from "../db.js";
import { today } from "../util.js";

const TYPES = ["repair", "cctv", "network", "biometric", "visit"];

export const jobsRouter = Router();

jobsRouter.get("/", async (req, res) => {
  const params = [];
  let sql = `SELECT j.*, c.name AS customer_name, u.name AS technician_name
     FROM jobs j
     JOIN customers c ON c.id = j.customer_id
     LEFT JOIN users u ON u.id = j.assigned_to`;
  if (req.user.role === "technician") {
    sql += " WHERE j.assigned_to = ?";
    params.push(req.user.id);
  }
  sql += " ORDER BY j.id DESC";
  res.json(await query(sql, params));
});

jobsRouter.get("/technicians", async (_req, res) => {
  res.json(
    await query(
      "SELECT id, name, phone FROM users WHERE role IN ('technician','owner') AND active = 1"
    )
  );
});

jobsRouter.get("/:id", async (req, res) => {
  const [job] = await query(
    `SELECT j.*, c.name AS customer_name, c.mobile, c.address, s.name AS site_name, u.name AS technician_name
     FROM jobs j
     JOIN customers c ON c.id = j.customer_id
     LEFT JOIN customer_sites s ON s.id = j.site_id
     LEFT JOIN users u ON u.id = j.assigned_to
     WHERE j.id = ?`,
    [req.params.id]
  );
  if (!job) return res.status(404).json({ error: "Not found" });
  if (req.user.role === "technician" && job.assigned_to !== req.user.id) {
    return res.status(403).json({ error: "Not your job" });
  }
  const parts = await query("SELECT * FROM job_parts WHERE job_id = ?", [req.params.id]);
  const notes = await query(
    `SELECT n.*, u.name AS user_name FROM job_notes n
     LEFT JOIN users u ON u.id = n.user_id WHERE n.job_id = ? ORDER BY n.id`,
    [req.params.id]
  );
  res.json({ ...job, parts, notes });
});

jobsRouter.post("/", async (req, res) => {
  const b = req.body || {};
  if (!b.customer_id || !b.title) return res.status(400).json({ error: "Customer and title required" });
  if (!TYPES.includes(b.job_type)) {
    return res.status(400).json({ error: "Invalid job type (GPS is not in this version)" });
  }
  const jobNo = await nextNumber("WG-JOB-", "jobs", "job_no");
  const status = b.assigned_to ? "assigned" : "new";
  const r = await execute(
    `INSERT INTO jobs (job_no, customer_id, site_id, quotation_id, assigned_to, job_type, status, title, description, extra_json, scheduled_on)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      jobNo,
      b.customer_id,
      b.site_id || null,
      b.quotation_id || null,
      b.assigned_to || null,
      b.job_type,
      status,
      b.title,
      b.description || null,
      JSON.stringify(b.extra || {}),
      b.scheduled_on || null,
    ]
  );
  const [row] = await query("SELECT * FROM jobs WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

jobsRouter.patch("/:id", async (req, res) => {
  const b = req.body || {};
  const [job] = await query("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
  if (!job) return res.status(404).json({ error: "Not found" });
  const next = {
    status: b.status || job.status,
    assigned_to: b.assigned_to === undefined ? job.assigned_to : b.assigned_to,
    title: b.title || job.title,
    description: b.description === undefined ? job.description : b.description,
    extra_json: b.extra ? JSON.stringify(b.extra) : job.extra_json,
    scheduled_on: b.scheduled_on === undefined ? job.scheduled_on : b.scheduled_on,
    closed_at: b.status === "done" ? new Date() : job.closed_at,
  };
  if (next.assigned_to && next.status === "new") next.status = "assigned";
  await execute(
    `UPDATE jobs SET status=?, assigned_to=?, title=?, description=?, extra_json=?, scheduled_on=?, closed_at=?
     WHERE id=?`,
    [
      next.status,
      next.assigned_to,
      next.title,
      next.description,
      next.extra_json,
      next.scheduled_on,
      next.closed_at,
      req.params.id,
    ]
  );
  const [row] = await query("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
  res.json(row);
});

jobsRouter.post("/:id/parts", async (req, res) => {
  const b = req.body || {};
  await execute(
    "INSERT INTO job_parts (job_id, product_id, description, qty, rate) VALUES (?, ?, ?, ?, ?)",
    [req.params.id, b.product_id || null, b.description, b.qty || 1, b.rate || 0]
  );
  if (b.product_id) {
    await execute("UPDATE products SET stock_qty = GREATEST(stock_qty - ?, 0) WHERE id = ?", [
      Number(b.qty || 1),
      b.product_id,
    ]);
  }
  res.status(201).json({ ok: true });
});

jobsRouter.post("/:id/notes", async (req, res) => {
  await execute("INSERT INTO job_notes (job_id, user_id, note) VALUES (?, ?, ?)", [
    req.params.id,
    req.user.id,
    req.body.note,
  ]);
  res.status(201).json({ ok: true });
});

jobsRouter.post("/:id/invoice", async (req, res) => {
  const [job] = await query("SELECT * FROM jobs WHERE id = ?", [req.params.id]);
  if (!job) return res.status(404).json({ error: "Not found" });
  const parts = await query("SELECT * FROM job_parts WHERE job_id = ?", [req.params.id]);
  const labour = Number(req.body.labour || 0);
  const items = parts.map((p) => ({
    product_id: p.product_id,
    description: p.description,
    qty: p.qty,
    rate: p.rate,
    tax_pct: 18,
  }));
  if (labour) {
    items.push({
      product_id: null,
      description: "Labour / visit charges",
      qty: 1,
      rate: labour,
      tax_pct: 18,
    });
  }
  if (!items.length) return res.status(400).json({ error: "Add parts or labour first" });
  const { money, sumLines } = await import("../util.js");
  const totals = sumLines(items);
  const invoiceNo = await nextNumber("WG-INV-", "invoices", "invoice_no");
  const r = await execute(
    `INSERT INTO invoices (invoice_no, customer_id, job_id, invoice_date, kind, subtotal, tax, total, paid, notes)
     VALUES (?, ?, ?, ?, 'job', ?, ?, ?, 0, ?)`,
    [
      invoiceNo,
      job.customer_id,
      job.id,
      today(),
      money(totals.subtotal),
      money(totals.tax),
      money(totals.total),
      `From ${job.job_no}`,
    ]
  );
  for (const it of items) {
    await execute(
      `INSERT INTO invoice_items (invoice_id, product_id, description, qty, rate, tax_pct)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [r.insertId, it.product_id, it.description, it.qty, it.rate, it.tax_pct]
    );
  }
  await execute("UPDATE jobs SET status = 'invoiced' WHERE id = ?", [job.id]);
  const [row] = await query("SELECT * FROM invoices WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

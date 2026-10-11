import { Router } from "express";
import { execute, nextNumber, query } from "../db.js";

export const amcRouter = Router();

amcRouter.get("/", async (_req, res) => {
  res.json(
    await query(
      `SELECT a.*, c.name AS customer_name, s.name AS site_name,
        DATEDIFF(a.end_date, CURDATE()) AS days_left
       FROM amc_contracts a
       JOIN customers c ON c.id = a.customer_id
       LEFT JOIN customer_sites s ON s.id = a.site_id
       ORDER BY a.end_date`
    )
  );
});

amcRouter.post("/", async (req, res) => {
  const b = req.body || {};
  if (!b.customer_id || !b.title || !b.start_date || !b.end_date) {
    return res.status(400).json({ error: "Customer, title and dates required" });
  }
  const amcNo = await nextNumber("WG-AMC-", "amc_contracts", "amc_no");
  const r = await execute(
    `INSERT INTO amc_contracts (amc_no, customer_id, site_id, title, start_date, end_date, amount, visit_frequency, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      amcNo,
      b.customer_id,
      b.site_id || null,
      b.title,
      b.start_date,
      b.end_date,
      b.amount || 0,
      b.visit_frequency || "quarterly",
      b.notes || null,
    ]
  );
  const [row] = await query("SELECT * FROM amc_contracts WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

amcRouter.post("/:id/visit", async (req, res) => {
  const [amc] = await query("SELECT * FROM amc_contracts WHERE id = ?", [req.params.id]);
  if (!amc) return res.status(404).json({ error: "Not found" });
  const jobNo = await nextNumber("WG-JOB-", "jobs", "job_no");
  const r = await execute(
    `INSERT INTO jobs (job_no, customer_id, site_id, assigned_to, job_type, status, title, description, extra_json, scheduled_on)
     VALUES (?, ?, ?, ?, 'visit', 'new', ?, ?, ?, ?)`,
    [
      jobNo,
      amc.customer_id,
      amc.site_id,
      req.body.assigned_to || null,
      `AMC visit — ${amc.title}`,
      `Auto from ${amc.amc_no}`,
      JSON.stringify({ amc_id: amc.id }),
      req.body.scheduled_on || null,
    ]
  );
  const [row] = await query("SELECT * FROM jobs WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

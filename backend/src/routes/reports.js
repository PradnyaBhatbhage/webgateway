import { Router } from "express";
import { execute, query } from "../db.js";
import { today } from "../util.js";

export const reportsRouter = Router();

reportsRouter.get("/dashboard", async (_req, res) => {
  const [salesToday] = await query(
    "SELECT COALESCE(SUM(total),0) AS v FROM invoices WHERE invoice_date = CURDATE()"
  );
  const [salesMonth] = await query(
    "SELECT COALESCE(SUM(total),0) AS v FROM invoices WHERE YEAR(invoice_date)=YEAR(CURDATE()) AND MONTH(invoice_date)=MONTH(CURDATE())"
  );
  const [outstanding] = await query(
    "SELECT COALESCE(SUM(total - paid),0) AS v FROM invoices WHERE status <> 'paid'"
  );
  const [pendingJobs] = await query(
    "SELECT COUNT(*) AS v FROM jobs WHERE status NOT IN ('done','invoiced','cancelled')"
  );
  const [amcSoon] = await query(
    "SELECT COUNT(*) AS v FROM amc_contracts WHERE status='active' AND end_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)"
  );
  const [lowStock] = await query("SELECT COUNT(*) AS v FROM products WHERE stock_qty <= min_stock");
  const [customers] = await query("SELECT COUNT(*) AS v FROM customers");
  const [rentals] = await query(
    "SELECT COUNT(*) AS v FROM rentals WHERE status IN ('rented','overdue')"
  );

  const recentInvoices = await query(
    `SELECT i.invoice_no, i.total, i.status, i.invoice_date, c.name AS customer_name
     FROM invoices i JOIN customers c ON c.id = i.customer_id ORDER BY i.id DESC LIMIT 8`
  );
  const openJobs = await query(
    `SELECT j.job_no, j.title, j.status, j.job_type, c.name AS customer_name
     FROM jobs j JOIN customers c ON c.id = j.customer_id
     WHERE j.status NOT IN ('done','invoiced','cancelled') ORDER BY j.id DESC LIMIT 8`
  );
  const low = await query(
    "SELECT name, sku, stock_qty, min_stock FROM products WHERE stock_qty <= min_stock ORDER BY stock_qty LIMIT 8"
  );

  res.json({
    cards: {
      salesToday: salesToday.v,
      salesMonth: salesMonth.v,
      outstanding: outstanding.v,
      pendingJobs: pendingJobs.v,
      amcSoon: amcSoon.v,
      lowStock: lowStock.v,
      customers: customers.v,
      rentals: rentals.v,
    },
    recentInvoices,
    openJobs,
    lowStockItems: low,
  });
});

reportsRouter.get("/outstanding", async (_req, res) => {
  res.json(
    await query(
      `SELECT i.*, c.name AS customer_name, c.mobile
       FROM invoices i JOIN customers c ON c.id = i.customer_id
       WHERE i.status <> 'paid' ORDER BY i.invoice_date`
    )
  );
});

reportsRouter.get("/expenses", async (_req, res) => {
  res.json(await query("SELECT * FROM expenses ORDER BY expense_date DESC, id DESC"));
});

reportsRouter.post("/expenses", async (req, res) => {
  const b = req.body || {};
  const r = await execute(
    "INSERT INTO expenses (expense_date, category, amount, notes) VALUES (?, ?, ?, ?)",
    [b.expense_date || today(), b.category, b.amount, b.notes || null]
  );
  const [row] = await query("SELECT * FROM expenses WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

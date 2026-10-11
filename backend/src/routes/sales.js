import { Router } from "express";
import { execute, nextNumber, query } from "../db.js";
import { money, sumLines, today } from "../util.js";

export const salesRouter = Router();

async function refreshInvoiceStatus(invoiceId) {
  const [inv] = await query("SELECT total, paid FROM invoices WHERE id = ?", [invoiceId]);
  const paid = Number(inv.paid);
  const total = Number(inv.total);
  const status = paid <= 0 ? "unpaid" : paid + 0.01 >= total ? "paid" : "partial";
  await execute("UPDATE invoices SET status = ? WHERE id = ?", [status, invoiceId]);
}

salesRouter.get("/", async (_req, res) => {
  res.json(
    await query(
      `SELECT i.*, c.name AS customer_name FROM invoices i
       JOIN customers c ON c.id = i.customer_id ORDER BY i.id DESC`
    )
  );
});

salesRouter.get("/:id", async (req, res) => {
  const [inv] = await query(
    `SELECT i.*, c.name AS customer_name, c.mobile, c.gstin, c.address, c.company
     FROM invoices i JOIN customers c ON c.id = i.customer_id WHERE i.id = ?`,
    [req.params.id]
  );
  if (!inv) return res.status(404).json({ error: "Not found" });
  const items = await query("SELECT * FROM invoice_items WHERE invoice_id = ?", [req.params.id]);
  const payments = await query("SELECT * FROM payments WHERE invoice_id = ? ORDER BY id", [
    req.params.id,
  ]);
  res.json({ ...inv, items, payments });
});

salesRouter.post("/", async (req, res) => {
  const b = req.body || {};
  if (!b.customer_id || !b.items?.length) {
    return res.status(400).json({ error: "Customer and items required" });
  }
  const totals = sumLines(b.items);
  const invoiceNo = await nextNumber("WG-INV-", "invoices", "invoice_no");
  const r = await execute(
    `INSERT INTO invoices (invoice_no, customer_id, job_id, quotation_id, invoice_date, kind, subtotal, tax, total, paid, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      invoiceNo,
      b.customer_id,
      b.job_id || null,
      b.quotation_id || null,
      b.invoice_date || today(),
      b.kind || "sale",
      money(totals.subtotal),
      money(totals.tax),
      money(totals.total),
      b.notes || null,
    ]
  );
  for (const it of b.items) {
    await execute(
      `INSERT INTO invoice_items (invoice_id, product_id, description, qty, rate, tax_pct, serials_text)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        r.insertId,
        it.product_id || null,
        it.description,
        it.qty,
        it.rate,
        it.tax_pct ?? 18,
        it.serials_text || null,
      ]
    );
    if (it.product_id) {
      await execute("UPDATE products SET stock_qty = GREATEST(stock_qty - ?, 0) WHERE id = ?", [
        Number(it.qty),
        it.product_id,
      ]);
    }
    const serials = String(it.serials_text || "")
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const sn of serials) {
      await execute(
        "UPDATE serials SET status = 'sold', customer_id = ? WHERE serial_no = ?",
        [b.customer_id, sn]
      );
    }
  }
  if (b.quotation_id) {
    await execute("UPDATE quotations SET status = 'converted' WHERE id = ?", [b.quotation_id]);
  }
  if (b.job_id) {
    await execute("UPDATE jobs SET status = 'invoiced' WHERE id = ?", [b.job_id]);
  }
  if (b.payment_amount) {
    await execute(
      "INSERT INTO payments (invoice_id, amount, mode, paid_on, reference_no) VALUES (?, ?, ?, ?, ?)",
      [
        r.insertId,
        money(b.payment_amount),
        b.payment_mode || "cash",
        b.invoice_date || today(),
        b.payment_ref || null,
      ]
    );
    await execute("UPDATE invoices SET paid = paid + ? WHERE id = ?", [
      money(b.payment_amount),
      r.insertId,
    ]);
    await refreshInvoiceStatus(r.insertId);
  }
  const [row] = await query("SELECT * FROM invoices WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

salesRouter.post("/:id/payments", async (req, res) => {
  const b = req.body || {};
  await execute(
    "INSERT INTO payments (invoice_id, amount, mode, paid_on, reference_no) VALUES (?, ?, ?, ?, ?)",
    [req.params.id, money(b.amount), b.mode || "cash", b.paid_on || today(), b.reference_no || null]
  );
  await execute("UPDATE invoices SET paid = paid + ? WHERE id = ?", [
    money(b.amount),
    req.params.id,
  ]);
  await refreshInvoiceStatus(req.params.id);
  const [row] = await query("SELECT * FROM invoices WHERE id = ?", [req.params.id]);
  res.status(201).json(row);
});

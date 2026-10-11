import { Router } from "express";
import { execute, nextNumber, query } from "../db.js";
import { today } from "../util.js";

export const rentalsRouter = Router();

rentalsRouter.get("/", async (_req, res) => {
  const rows = await query(
    `SELECT r.*, c.name AS customer_name, p.name AS product_name, s.serial_no,
      DATEDIFF(r.due_date, CURDATE()) AS days_left
     FROM rentals r
     JOIN customers c ON c.id = r.customer_id
     JOIN products p ON p.id = r.product_id
     LEFT JOIN serials s ON s.id = r.serial_id
     ORDER BY r.id DESC`
  );
  res.json(
    rows.map((r) => ({
      ...r,
      status: r.status === "rented" && r.days_left < 0 ? "overdue" : r.status,
    }))
  );
});

rentalsRouter.post("/", async (req, res) => {
  const b = req.body || {};
  if (!b.customer_id || !b.product_id || !b.start_date || !b.due_date) {
    return res.status(400).json({ error: "Customer, product and dates required" });
  }
  const rentalNo = await nextNumber("WG-RNT-", "rentals", "rental_no");
  const r = await execute(
    `INSERT INTO rentals (rental_no, customer_id, product_id, serial_id, start_date, due_date, deposit, rent_amount, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'rented', ?)`,
    [
      rentalNo,
      b.customer_id,
      b.product_id,
      b.serial_id || null,
      b.start_date,
      b.due_date,
      b.deposit || 0,
      b.rent_amount || 0,
      b.notes || null,
    ]
  );
  if (b.serial_id) {
    await execute("UPDATE serials SET status = 'rented', customer_id = ? WHERE id = ?", [
      b.customer_id,
      b.serial_id,
    ]);
  }
  await execute("UPDATE products SET stock_qty = GREATEST(stock_qty - 1, 0) WHERE id = ?", [
    b.product_id,
  ]);
  const [row] = await query("SELECT * FROM rentals WHERE id = ?", [r.insertId]);
  res.status(201).json(row);
});

rentalsRouter.post("/:id/return", async (req, res) => {
  const [rental] = await query("SELECT * FROM rentals WHERE id = ?", [req.params.id]);
  if (!rental) return res.status(404).json({ error: "Not found" });
  await execute("UPDATE rentals SET status = 'returned', return_date = ?, notes = ? WHERE id = ?", [
    today(),
    req.body.notes || rental.notes,
    req.params.id,
  ]);
  if (rental.serial_id) {
    await execute("UPDATE serials SET status = 'in_stock' WHERE id = ?", [rental.serial_id]);
  }
  await execute("UPDATE products SET stock_qty = stock_qty + 1 WHERE id = ?", [rental.product_id]);
  const [row] = await query("SELECT * FROM rentals WHERE id = ?", [req.params.id]);
  res.json(row);
});

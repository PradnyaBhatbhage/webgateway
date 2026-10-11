import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, inr } from "../api.js";

export default function Sales() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    customer_id: "",
    product_id: "",
    qty: 1,
    serials_text: "",
    payment_amount: "",
    payment_mode: "upi",
  });

  async function load() {
    setRows(await api("/api/sales"));
    setCustomers(await api("/api/customers"));
    setProducts(await api("/api/catalog/products"));
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    const p = products.find((x) => String(x.id) === String(form.product_id));
    await api("/api/sales", {
      method: "POST",
      body: {
        customer_id: form.customer_id,
        kind: "sale",
        payment_amount: form.payment_amount || 0,
        payment_mode: form.payment_mode,
        items: [
          {
            product_id: p.id,
            description: p.name,
            qty: form.qty,
            rate: p.sale_price,
            tax_pct: p.tax_pct,
            serials_text: form.serials_text,
          },
        ],
      },
    });
    setForm({ ...form, serials_text: "", payment_amount: "" });
    load();
  }

  return (
    <>
      <div className="top">
        <div>
          <h2>Sales / GST invoices</h2>
          <div className="muted">Walk-in bill, UPI/cash, serials on the invoice</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.invoice_no}
                    <div className="muted">{r.customer_name}</div>
                  </td>
                  <td>
                    {inr(r.total)}
                    <div>
                      <span className={`pill ${r.status}`}>{r.status}</span>
                    </div>
                  </td>
                  <td>
                    <Link to={`/sales/${r.id}`}>Print</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="card stack" onSubmit={save}>
          <h3>New invoice</h3>
          <label>
            Customer
            <select
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
              required
            >
              <option value="">—</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Product
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              required
            >
              <option value="">—</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Qty
            <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </label>
          <label>
            Serials
            <input
              value={form.serials_text}
              onChange={(e) => setForm({ ...form, serials_text: e.target.value })}
            />
          </label>
          <label>
            Payment now
            <input
              type="number"
              value={form.payment_amount}
              onChange={(e) => setForm({ ...form, payment_amount: e.target.value })}
            />
          </label>
          <label>
            Mode
            <select
              value={form.payment_mode}
              onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
            </select>
          </label>
          <button className="btn" type="submit">
            Create invoice
          </button>
        </form>
      </div>
    </>
  );
}

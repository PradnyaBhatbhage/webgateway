import { useEffect, useState } from "react";
import { api, inr } from "../api.js";

export default function Quotes() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    customer_id: "",
    product_id: "",
    qty: 1,
    notes: "",
  });

  async function load() {
    setRows(await api("/api/quotes"));
    setCustomers(await api("/api/customers"));
    setProducts(await api("/api/catalog/products"));
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    const p = products.find((x) => String(x.id) === String(form.product_id));
    await api("/api/quotes", {
      method: "POST",
      body: {
        customer_id: form.customer_id,
        notes: form.notes,
        items: [
          {
            product_id: p.id,
            description: p.name,
            qty: form.qty,
            rate: p.sale_price,
            tax_pct: p.tax_pct,
          },
        ],
      },
    });
    load();
  }

  async function setStatus(id, status) {
    await api(`/api/quotes/${id}/status`, { method: "PATCH", body: { status } });
    load();
  }

  return (
    <>
      <div className="top">
        <div>
          <h2>Quotations</h2>
          <div className="muted">Approve then convert from Sales</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Quote</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.quote_no}
                    <div className="muted">{r.customer_name}</div>
                  </td>
                  <td>
                    {inr(r.total)}
                    <div>
                      <span className={`pill ${r.status}`}>{r.status}</span>
                    </div>
                  </td>
                  <td>
                    {r.status !== "approved" && (
                      <button className="btn ghost" type="button" onClick={() => setStatus(r.id, "approved")}>
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="card stack" onSubmit={save}>
          <h3>New quote</h3>
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
            Item
            <select
              value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              required
            >
              <option value="">—</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({inr(p.sale_price)})
                </option>
              ))}
            </select>
          </label>
          <label>
            Qty
            <input type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} />
          </label>
          <button className="btn" type="submit">
            Save quote
          </button>
        </form>
      </div>
    </>
  );
}

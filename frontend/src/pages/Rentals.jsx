import { useEffect, useState } from "react";
import { api, inr } from "../api.js";

export default function Rentals() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    customer_id: "",
    product_id: "",
    start_date: new Date().toISOString().slice(0, 10),
    due_date: "",
    deposit: 5000,
    rent_amount: 2000,
  });

  async function load() {
    setRows(await api("/api/rentals"));
    setCustomers(await api("/api/customers"));
    setProducts(await api("/api/catalog/products"));
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    await api("/api/rentals", { method: "POST", body: form });
    load();
  }

  async function ret(id) {
    await api(`/api/rentals/${id}/return`, { method: "POST", body: {} });
    load();
  }

  return (
    <>
      <div className="top">
        <div>
          <h2>Laptop / PC rentals</h2>
          <div className="muted">Checkout, due date, return</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Rental</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.rental_no}
                    <div className="muted">
                      {r.customer_name} · {r.product_name}
                    </div>
                  </td>
                  <td>
                    {String(r.due_date).slice(0, 10)}
                    <div>
                      <span className={`pill ${r.status}`}>{r.status}</span>
                    </div>
                  </td>
                  <td>
                    {r.status !== "returned" && (
                      <button className="btn ghost" type="button" onClick={() => ret(r.id)}>
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="card stack" onSubmit={save}>
          <h3>Checkout</h3>
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
            Asset
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
            Due date
            <input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              required
            />
          </label>
          <label>
            Deposit {inr(form.deposit)}
            <input
              type="number"
              value={form.deposit}
              onChange={(e) => setForm({ ...form, deposit: e.target.value })}
            />
          </label>
          <button className="btn" type="submit">
            Checkout
          </button>
        </form>
      </div>
    </>
  );
}

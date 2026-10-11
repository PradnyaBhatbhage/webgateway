import { useEffect, useState } from "react";
import { api, inr } from "../api.js";

export default function Purchases() {
  const [rows, setRows] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    supplier_id: "",
    bill_no: "",
    bill_date: new Date().toISOString().slice(0, 10),
    product_id: "",
    qty: 1,
    rate: "",
    serials_text: "",
  });

  async function load() {
    setRows(await api("/api/purchases"));
    setSuppliers(await api("/api/purchases/suppliers"));
    setProducts(await api("/api/catalog/products"));
  }
  useEffect(() => {
    load();
  }, []);

  function pickProduct(id) {
    const p = products.find((x) => String(x.id) === String(id));
    setForm({ ...form, product_id: id, rate: p?.purchase_price || "" });
  }

  async function save(e) {
    e.preventDefault();
    await api("/api/purchases", {
      method: "POST",
      body: {
        supplier_id: form.supplier_id,
        bill_no: form.bill_no,
        bill_date: form.bill_date,
        items: [
          {
            product_id: form.product_id,
            qty: form.qty,
            rate: form.rate,
            tax_pct: 18,
            serials_text: form.serials_text,
          },
        ],
      },
    });
    setForm({ ...form, bill_no: "", serials_text: "" });
    load();
  }

  return (
    <>
      <div className="top">
        <div>
          <h2>Purchase inward</h2>
          <div className="muted">Stock and serials increase when you save a bill</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Bill</th>
                <th>Supplier</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.bill_no}
                    <div className="muted">{String(r.bill_date).slice(0, 10)}</div>
                  </td>
                  <td>{r.supplier_name}</td>
                  <td>{inr(r.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="card stack" onSubmit={save}>
          <h3>New inward</h3>
          <label>
            Supplier
            <select
              value={form.supplier_id}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
              required
            >
              <option value="">—</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Bill no
            <input value={form.bill_no} onChange={(e) => setForm({ ...form, bill_no: e.target.value })} />
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.bill_date}
              onChange={(e) => setForm({ ...form, bill_date: e.target.value })}
            />
          </label>
          <label>
            Product
            <select value={form.product_id} onChange={(e) => pickProduct(e.target.value)} required>
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
            Rate
            <input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          </label>
          <label>
            Serials (comma separated)
            <input
              value={form.serials_text}
              onChange={(e) => setForm({ ...form, serials_text: e.target.value })}
            />
          </label>
          <button className="btn" type="submit">
            Save inward
          </button>
        </form>
      </div>
    </>
  );
}

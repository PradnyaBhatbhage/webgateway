import { useEffect, useState } from "react";
import { api, inr } from "../api.js";

export default function Products() {
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [q, setQ] = useState("");
  const [serials, setSerials] = useState([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    category_id: "",
    sale_price: "",
    purchase_price: "",
    track_serial: true,
    min_stock: 2,
  });

  async function load() {
    setRows(await api("/api/catalog/products"));
    setCats(await api("/api/catalog/categories"));
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    await api("/api/catalog/products", {
      method: "POST",
      body: { ...form, category_id: form.category_id || null },
    });
    setForm({ ...form, name: "", sku: "", sale_price: "", purchase_price: "" });
    load();
  }

  async function lookup(e) {
    e.preventDefault();
    setSerials(await api(`/api/catalog/serials?q=${encodeURIComponent(q)}`));
  }

  return (
    <>
      <div className="top">
        <div>
          <h2>Stock</h2>
          <div className="muted">Search a serial to see owner and status</div>
        </div>
        <form className="row" onSubmit={lookup}>
          <input placeholder="Serial / product" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn" type="submit">
            Lookup
          </button>
        </form>
      </div>
      {serials.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Serial</th>
                <th>Product</th>
                <th>Status</th>
                <th>Customer</th>
              </tr>
            </thead>
            <tbody>
              {serials.map((s) => (
                <tr key={s.id}>
                  <td>{s.serial_no}</td>
                  <td>{s.product_name}</td>
                  <td>
                    <span className="pill">{s.status}</span>
                  </td>
                  <td>{s.customer_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="grid-2">
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Sale</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.name}
                    <div className="muted">
                      {p.sku} · {p.category_name}
                    </div>
                  </td>
                  <td>{p.stock_qty}</td>
                  <td>{inr(p.sale_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="card stack" onSubmit={save}>
          <h3>Add product</h3>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            SKU
            <input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </label>
          <label>
            Category
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">—</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sale price
            <input
              type="number"
              value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
            />
          </label>
          <label>
            Purchase price
            <input
              type="number"
              value={form.purchase_price}
              onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
            />
          </label>
          <label>
            <span className="row">
              <input
                type="checkbox"
                checked={form.track_serial}
                onChange={(e) => setForm({ ...form, track_serial: e.target.checked })}
              />
              Track serial numbers
            </span>
          </label>
          <button className="btn" type="submit">
            Save
          </button>
        </form>
      </div>
    </>
  );
}

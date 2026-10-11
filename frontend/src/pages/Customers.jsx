import { useEffect, useState } from "react";
import { api, inr } from "../api.js";

const empty = {
  name: "",
  company: "",
  mobile: "",
  email: "",
  address: "",
  gstin: "",
  customer_type: "business",
  site_name: "Main site",
};

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(empty);
  const [sel, setSel] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    setRows(await api("/api/customers"));
  }
  useEffect(() => {
    load().catch((e) => setErr(e.message));
  }, []);

  async function save(e) {
    e.preventDefault();
    setErr("");
    try {
      await api("/api/customers", { method: "POST", body: form });
      setForm(empty);
      load();
    } catch (ex) {
      setErr(ex.message);
    }
  }

  async function open(id) {
    setSel(await api(`/api/customers/${id}`));
  }

  return (
    <>
      <div className="top">
        <div>
          <h2>Customers</h2>
          <div className="muted">Party + sites. GPS vehicles are not in this version.</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Mobile</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => open(r.id)} style={{ cursor: "pointer" }}>
                  <td>
                    {r.name}
                    <div className="muted">{r.company}</div>
                  </td>
                  <td>{r.mobile}</td>
                  <td>{inr(r.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="card stack" onSubmit={save}>
          <h3>New customer</h3>
          {err && <div className="err">{err}</div>}
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Company
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          </label>
          <label>
            Mobile
            <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required />
          </label>
          <label>
            GSTIN
            <input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
          </label>
          <label>
            Address
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
          <button className="btn" type="submit">
            Save
          </button>
          {sel && (
            <div>
              <h3>{sel.name}</h3>
              <p className="muted">{sel.mobile} · {sel.gstin || "No GSTIN"}</p>
              <p className="muted">Jobs: {sel.jobs?.length || 0} · Invoices: {sel.invoices?.length || 0}</p>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

import { useEffect, useState } from "react";
import { api, inr } from "../api.js";

export default function Amc() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customer_id: "",
    title: "CCTV AMC",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: "",
    amount: 8000,
    visit_frequency: "quarterly",
  });

  async function load() {
    setRows(await api("/api/amc"));
    setCustomers(await api("/api/customers"));
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    await api("/api/amc", { method: "POST", body: form });
    load();
  }

  async function visit(id) {
    await api(`/api/amc/${id}/visit`, { method: "POST", body: {} });
    alert("AMC visit job created — open Jobs");
  }

  return (
    <>
      <div className="top">
        <div>
          <h2>AMC contracts</h2>
          <div className="muted">Expiry in 30 days shows on the dashboard</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Contract</th>
                <th>End</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.amc_no}
                    <div className="muted">
                      {r.customer_name} · {r.title}
                    </div>
                  </td>
                  <td>
                    {String(r.end_date).slice(0, 10)}
                    <div className="muted">{r.days_left} days left</div>
                  </td>
                  <td>
                    <button className="btn ghost" type="button" onClick={() => visit(r.id)}>
                      Create visit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="card stack" onSubmit={save}>
          <h3>New AMC</h3>
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
            Title
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <label>
            Start
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </label>
          <label>
            End
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              required
            />
          </label>
          <label>
            Amount {inr(form.amount)}
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </label>
          <button className="btn" type="submit">
            Save AMC
          </button>
        </form>
      </div>
    </>
  );
}

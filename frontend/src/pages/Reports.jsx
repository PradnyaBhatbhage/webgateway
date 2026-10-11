import { useEffect, useState } from "react";
import { api, inr } from "../api.js";

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [ex, setEx] = useState([]);
  const [form, setForm] = useState({
    category: "Petrol",
    amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  async function load() {
    setRows(await api("/api/reports/outstanding"));
    setEx(await api("/api/reports/expenses"));
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    await api("/api/reports/expenses", { method: "POST", body: form });
    setForm({ ...form, amount: "", notes: "" });
    load();
  }

  return (
    <>
      <div className="top">
        <div>
          <h2>Reports</h2>
          <div className="muted">Outstanding invoices and shop expenses</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <h3>Outstanding</h3>
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.invoice_no}
                    <div className="muted">
                      {r.customer_name} · {r.mobile}
                    </div>
                  </td>
                  <td>{inr(Number(r.total) - Number(r.paid))}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={2} className="muted">
                    Nothing pending
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <form className="card stack" onSubmit={save}>
          <h3>Add expense</h3>
          <label>
            Category
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </label>
          <label>
            Amount
            <input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
            />
          </label>
          <button className="btn" type="submit">
            Save expense
          </button>
          <table>
            <thead>
              <tr>
                <th>Expense</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {ex.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.category}
                    <div className="muted">{String(r.expense_date).slice(0, 10)}</div>
                  </td>
                  <td>{inr(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </form>
      </div>
    </>
  );
}

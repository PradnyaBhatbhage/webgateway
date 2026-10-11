import { useEffect, useState } from "react";
import { api, inr } from "../api.js";

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api("/api/reports/dashboard").then(setD).catch((e) => setErr(e.message));
  }, []);
  if (err) return <p className="err">{err}</p>;
  if (!d) return <p className="muted">Loading…</p>;
  const c = d.cards;
  return (
    <>
      <div className="top">
        <div>
          <h2>Dashboard</h2>
          <div className="muted">Today’s shop position</div>
        </div>
      </div>
      <div className="grid-4">
        <div className="card stat">
          <div className="v">{inr(c.salesToday)}</div>
          <div className="l">Today’s sales</div>
        </div>
        <div className="card stat">
          <div className="v">{inr(c.salesMonth)}</div>
          <div className="l">This month</div>
        </div>
        <div className="card stat">
          <div className="v">{inr(c.outstanding)}</div>
          <div className="l">Outstanding</div>
        </div>
        <div className="card stat">
          <div className="v">{c.pendingJobs}</div>
          <div className="l">Open jobs</div>
        </div>
        <div className="card stat">
          <div className="v">{c.amcSoon}</div>
          <div className="l">AMC expiring in 30 days</div>
        </div>
        <div className="card stat">
          <div className="v">{c.lowStock}</div>
          <div className="l">Low stock items</div>
        </div>
        <div className="card stat">
          <div className="v">{c.customers}</div>
          <div className="l">Customers</div>
        </div>
        <div className="card stat">
          <div className="v">{c.rentals}</div>
          <div className="l">Active rentals</div>
        </div>
      </div>
      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Recent invoices</h3>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {d.recentInvoices.map((r) => (
                <tr key={r.invoice_no}>
                  <td>{r.invoice_no}</td>
                  <td>{r.customer_name}</td>
                  <td>{inr(r.total)}</td>
                  <td>
                    <span className={`pill ${r.status}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {!d.recentInvoices.length && (
                <tr>
                  <td colSpan={4} className="muted">
                    No invoices yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Open jobs</h3>
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {d.openJobs.map((j) => (
                <tr key={j.job_no}>
                  <td>
                    {j.job_no}
                    <div className="muted">{j.customer_name}</div>
                  </td>
                  <td>{j.job_type}</td>
                  <td>
                    <span className={`pill ${j.status}`}>{j.status}</span>
                  </td>
                </tr>
              ))}
              {!d.openJobs.length && (
                <tr>
                  <td colSpan={3} className="muted">
                    No open jobs
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

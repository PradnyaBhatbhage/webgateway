import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, inr } from "../api.js";

export default function InvoicePrint() {
  const { id } = useParams();
  const [inv, setInv] = useState(null);
  useEffect(() => {
    api(`/api/sales/${id}`).then(setInv);
  }, [id]);
  if (!inv) return <p className="muted">Loading…</p>;
  return (
    <div className="card">
      <div className="top">
        <div>
          <div className="brand">
            Web<span>Gateway</span>
          </div>
          <div className="muted">Alibaug / Raigad · GST invoice</div>
        </div>
        <button className="btn" type="button" onClick={() => window.print()}>
          Print
        </button>
      </div>
      <h2>{inv.invoice_no}</h2>
      <p>
        Bill to: <strong>{inv.customer_name}</strong>
        <br />
        {inv.company}
        <br />
        {inv.address}
        <br />
        GSTIN: {inv.gstin || "—"} · {inv.mobile}
      </p>
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Tax %</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it) => (
            <tr key={it.id}>
              <td>
                {it.description}
                {it.serials_text ? <div className="muted">SN {it.serials_text}</div> : null}
              </td>
              <td>{it.qty}</td>
              <td>{inr(it.rate)}</td>
              <td>{it.tax_pct}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Subtotal {inr(inv.subtotal)} · Tax {inr(inv.tax)} · <strong>Total {inr(inv.total)}</strong>
        <br />
        Paid {inr(inv.paid)} · Status {inv.status}
      </p>
    </div>
  );
}

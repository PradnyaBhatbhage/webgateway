import { useEffect, useState } from "react";
import { api } from "../api.js";

const TYPES = [
  { id: "repair", label: "Repair" },
  { id: "cctv", label: "CCTV install" },
  { id: "network", label: "Networking" },
  { id: "biometric", label: "Biometric" },
  { id: "visit", label: "Support / AMC visit" },
];

export default function Jobs() {
  const [rows, setRows] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [techs, setTechs] = useState([]);
  const [open, setOpen] = useState(null);
  const [form, setForm] = useState({
    customer_id: "",
    job_type: "repair",
    title: "",
    description: "",
    assigned_to: "",
  });
  const [note, setNote] = useState("");
  const [part, setPart] = useState({ description: "", qty: 1, rate: 0 });

  async function load() {
    setRows(await api("/api/jobs"));
    setCustomers(await api("/api/customers"));
    setTechs(await api("/api/jobs/technicians"));
  }
  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();
    await api("/api/jobs", {
      method: "POST",
      body: { ...form, assigned_to: form.assigned_to || null },
    });
    setForm({ ...form, title: "", description: "" });
    load();
  }

  async function view(id) {
    setOpen(await api(`/api/jobs/${id}`));
  }

  async function setStatus(id, status) {
    await api(`/api/jobs/${id}`, { method: "PATCH", body: { status } });
    view(id);
    load();
  }

  async function addNote(e) {
    e.preventDefault();
    await api(`/api/jobs/${open.id}/notes`, { method: "POST", body: { note } });
    setNote("");
    view(open.id);
  }

  async function addPart(e) {
    e.preventDefault();
    await api(`/api/jobs/${open.id}/parts`, { method: "POST", body: part });
    setPart({ description: "", qty: 1, rate: 0 });
    view(open.id);
  }

  async function invoice() {
    const labour = window.prompt("Labour amount (₹)", "500");
    if (labour == null) return;
    await api(`/api/jobs/${open.id}/invoice`, { method: "POST", body: { labour } });
    view(open.id);
    load();
  }

  return (
    <>
      <div className="top">
        <div>
          <h2>Jobs</h2>
          <div className="muted">Repair, CCTV, network, biometric, visits. GPS jobs are not included.</div>
        </div>
      </div>
      <div className="grid-2">
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => (
                <tr key={j.id} onClick={() => view(j.id)} style={{ cursor: "pointer" }}>
                  <td>
                    {j.job_no}
                    <div className="muted">
                      {j.customer_name} · {j.title}
                    </div>
                  </td>
                  <td>{j.job_type}</td>
                  <td>
                    <span className={`pill ${j.status}`}>{j.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="stack">
          <form className="card stack" onSubmit={save}>
            <h3>New job</h3>
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
              Type
              <select value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}>
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Title
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </label>
            <label>
              Technician
              <select
                value={form.assigned_to}
                onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
              >
                <option value="">Unassigned</option>
                {techs.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Details
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
            <button className="btn" type="submit">
              Create job
            </button>
          </form>
          {open && (
            <div className="card stack">
              <h3>
                {open.job_no} · {open.title}
              </h3>
              <div className="row">
                {["assigned", "on_site", "waiting_parts", "done"].map((s) => (
                  <button key={s} className="btn ghost" type="button" onClick={() => setStatus(open.id, s)}>
                    {s}
                  </button>
                ))}
                <button className="btn" type="button" onClick={invoice}>
                  Make invoice
                </button>
              </div>
              <form className="row" onSubmit={addPart}>
                <input
                  placeholder="Part / labour line"
                  value={part.description}
                  onChange={(e) => setPart({ ...part, description: e.target.value })}
                />
                <input
                  type="number"
                  style={{ width: 80 }}
                  value={part.rate}
                  onChange={(e) => setPart({ ...part, rate: e.target.value })}
                />
                <button className="btn ghost" type="submit">
                  Add part
                </button>
              </form>
              <form className="row" onSubmit={addNote}>
                <input placeholder="Work note / photo ref" value={note} onChange={(e) => setNote(e.target.value)} />
                <button className="btn ghost" type="submit">
                  Add note
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

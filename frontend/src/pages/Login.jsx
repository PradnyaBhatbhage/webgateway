import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getApiBase, setApiBase, setSession } from "../api.js";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("owner@webgateway.local");
  const [password, setPassword] = useState("admin123");
  const [apiUrl, setApiUrl] = useState(getApiBase());
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      setApiBase(apiUrl);
      const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
      setSession(data.token, data.user);
      nav("/");
    } catch (ex) {
      setErr(ex.message);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card stack" onSubmit={onSubmit}>
        <div className="brand">
          Web<span>Gateway</span>
        </div>
        <h1>Sign in</h1>
        <p className="muted">Shop counter, jobs, AMC and rentals. GPS is not in this version.</p>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <label>
          API server (ngrok)
          <input
            placeholder="Leave empty for this PC · or https://xxxx.ngrok-free.app"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
        </label>
        {err && <div className="err">{err}</div>}
        <button className="btn" type="submit">
          Enter
        </button>
        <p className="muted">Demo: owner / staff / tech / accounts @webgateway.local — password admin123</p>
      </form>
    </div>
  );
}

import { NavLink, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { clearSession, currentUser } from "./api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Customers from "./pages/Customers.jsx";
import Products from "./pages/Products.jsx";
import Purchases from "./pages/Purchases.jsx";
import Quotes from "./pages/Quotes.jsx";
import Sales from "./pages/Sales.jsx";
import Jobs from "./pages/Jobs.jsx";
import Amc from "./pages/Amc.jsx";
import Rentals from "./pages/Rentals.jsx";
import Reports from "./pages/Reports.jsx";
import InvoicePrint from "./pages/InvoicePrint.jsx";

const LINKS = [
  { to: "/", label: "Dashboard", roles: ["owner", "staff", "accounts", "technician"] },
  { to: "/customers", label: "Customers", roles: ["owner", "staff", "accounts"] },
  { to: "/products", label: "Stock", roles: ["owner", "staff", "accounts"] },
  { to: "/purchases", label: "Purchase", roles: ["owner", "accounts"] },
  { to: "/quotes", label: "Quotes", roles: ["owner", "staff"] },
  { to: "/sales", label: "Sales", roles: ["owner", "staff", "accounts"] },
  { to: "/jobs", label: "Jobs", roles: ["owner", "staff", "technician"] },
  { to: "/amc", label: "AMC", roles: ["owner", "staff"] },
  { to: "/rentals", label: "Rentals", roles: ["owner", "staff"] },
  { to: "/reports", label: "Reports", roles: ["owner", "accounts"] },
];

function Shell() {
  const nav = useNavigate();
  const user = currentUser();
  if (!user) return <Navigate to="/login" replace />;
  const links = LINKS.filter((l) => l.roles.includes(user.role));
  return (
    <div className="app">
      <aside className="side">
        <div className="brand">
          Web<span>Gateway</span>
          <div className="muted" style={{ color: "#9ca3af" }}>
            Business System
          </div>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === "/"}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="who">
          {user.name}
          <br />
          {user.role}
          <br />
          <button
            className="link"
            onClick={() => {
              clearSession();
              nav("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/products" element={<Products />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/quotes" element={<Quotes />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales/:id" element={<InvoicePrint />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/amc" element={<Amc />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<Shell />} />
    </Routes>
  );
}

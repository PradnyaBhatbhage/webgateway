import bcrypt from "bcryptjs";
import { query, execute } from "./db.js";

export async function seedIfEmpty() {
  const users = await query("SELECT COUNT(*) AS c FROM users");
  if (users[0].c > 0) return;

  const hash = await bcrypt.hash("admin123", 10);
  await execute(
    "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
    ["Amey Owner", "owner@webgateway.local", hash, "owner", "9876543210"]
  );
  await execute(
    "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
    ["Counter Staff", "staff@webgateway.local", hash, "staff", "9876543211"]
  );
  await execute(
    "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
    ["Rahul Technician", "tech@webgateway.local", hash, "technician", "9876543212"]
  );
  await execute(
    "INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)",
    ["Accounts", "accounts@webgateway.local", hash, "accounts", "9876543213"]
  );

  const cats = [
    "Computers",
    "CCTV",
    "Networking",
    "Biometric",
    "Spares",
    "Rental assets",
  ];
  for (const name of cats) {
    await execute("INSERT INTO categories (name) VALUES (?)", [name]);
  }

  const products = [
    [1, "HP 15s Laptop", "HP-15S", "8471", 42000, 36000, 1, 2],
    [1, "Dell Monitor 24in", "DELL-24", "8528", 12500, 9800, 1, 3],
    [2, "Hikvision Dome 2MP", "HK-D2", "8525", 2200, 1400, 1, 10],
    [2, "Hikvision DVR 8ch", "HK-DVR8", "8521", 6500, 4800, 1, 2],
    [2, "Surveillance HDD 1TB", "HDD-1TB", "8471", 3800, 2900, 1, 4],
    [2, "RG59 Cable (m)", "CABLE-RG59", "8544", 18, 10, 0, 200],
    [3, "TP-Link Router", "TPL-R", "8517", 1800, 1200, 1, 5],
    [3, "24-port Switch", "SW-24", "8517", 4200, 3100, 1, 2],
    [4, "ESSL Biometric Attendance", "ESSL-K28", "8471", 7200, 5400, 1, 2],
    [5, "Laptop Charging IC", "SP-CHG-IC", "8542", 800, 250, 0, 10],
    [6, "Rental i5 Desktop", "RENT-I5", "8471", 0, 18000, 1, 3],
  ];
  for (const p of products) {
    await execute(
      `INSERT INTO products (category_id, name, sku, hsn, sale_price, purchase_price, tax_pct, track_serial, min_stock, stock_qty)
       VALUES (?, ?, ?, ?, ?, ?, 18, ?, ?, 0)`,
      p
    );
  }

  await execute(
    "INSERT INTO suppliers (name, phone, gstin, address) VALUES (?, ?, ?, ?)",
    ["Westage Computers Pune", "9822000001", "27AABCU9603R1ZX", "Pune"]
  );
  await execute(
    "INSERT INTO suppliers (name, phone, gstin, address) VALUES (?, ?, ?, ?)",
    ["SecureVision Distributors", "9822000002", "27AADCS1234A1Z5", "Mumbai"]
  );

  await execute(
    `INSERT INTO customers (name, company, mobile, email, address, gstin, customer_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Suresh Patil",
      "Alibaug Beach Resort",
      "9823123456",
      "suresh@resort.test",
      "Alibaug",
      "27AABCR1111A1Z1",
      "business",
    ]
  );
  await execute(
    `INSERT INTO customers (name, company, mobile, email, address, gstin, customer_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Meena Joshi",
      "Joshi Traders",
      "9823987654",
      "meena@joshi.test",
      "Pen, Raigad",
      "",
      "individual",
    ]
  );
  await execute(
    "INSERT INTO customer_sites (customer_id, name, address, contact_name, contact_phone) VALUES (1, ?, ?, ?, ?)",
    ["Main Resort", "Revdanda Road, Alibaug", "Suresh Patil", "9823123456"]
  );
  await execute(
    "INSERT INTO customer_sites (customer_id, name, address, contact_name, contact_phone) VALUES (1, ?, ?, ?, ?)",
    ["Staff quarters", "Chendhare, Alibaug", "Manager", "9823123400"]
  );

  console.log("Seeded demo users and catalogue (password for all: admin123)");
}

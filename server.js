import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, "public");
const LEADS_PATH = path.join(__dirname, "data", "leads.json");

function send(res, status, data, contentType = "application/json") {
  res.writeHead(status, { "Content-Type": contentType });
  res.end(data);
}

function safeReadLeads() {
  try {
    const raw = fs.readFileSync(LEADS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteLeads(leads) {
  fs.writeFileSync(LEADS_PATH, JSON.stringify(leads, null, 2), "utf8");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/leads") {
    let body = "";
    req.on("data", chunk => (body += chunk));
    req.on("end", () => {
      try {
        const { email } = JSON.parse(body || "{}");

        if (!email || !isValidEmail(email)) {
          return send(res, 400, JSON.stringify({ ok: false, message: "Email inválido." }));
        }

        const leads = safeReadLeads();
        const exists = leads.some(l => l.email.toLowerCase() === email.toLowerCase());

        if (exists) {
          return send(res, 200, JSON.stringify({ ok: true, message: "Ese correo ya estaba registrado." }));
        }

        leads.push({ email, createdAt: new Date().toISOString() });
        safeWriteLeads(leads);

        return send(res, 201, JSON.stringify({ ok: true, message: "Listo. Te registramos ✅" }));
      } catch {
        return send(res, 400, JSON.stringify({ ok: false, message: "No pude leer tu solicitud." }));
      }
    });
    return;
  }

  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(PUBLIC_DIR, filePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    return send(res, 403, "Forbidden", "text/plain");
  }

  fs.readFile(filePath, (err, content) => {
    if (err) return send(res, 404, "Not found", "text/plain");

    const ext = path.extname(filePath).toLowerCase();
    const types = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript"
    };
    send(res, 200, content, types[ext] || "application/octet-stream");
  });
});

server.listen(PORT, () => {
  console.log(`✅ RevenueIQ listo en: http://localhost:${PORT}`);
});
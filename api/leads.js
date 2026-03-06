import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Método no permitido" });
  }

  try {
    const { businessName, phone, email } = req.body || {};

    const bn = String(businessName || "").trim();
    const ph = String(phone || "").trim();
    const em = String(email || "").trim();

    if (!bn) {
      return res.status(400).json({ ok: false, message: "Falta el nombre del negocio." });
    }

    if (!ph) {
      return res.status(400).json({ ok: false, message: "Falta el teléfono." });
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
    if (!em || !emailOk) {
      return res.status(400).json({ ok: false, message: "Email inválido." });
    }

    const sql = neon(process.env.DATABASE_URL);

    await sql`
      INSERT INTO leads (business_name, phone, email)
      VALUES (${bn}, ${ph}, ${em})
    `;

    return res.status(201).json({ ok: true, message: "Listo. Te registramos ✅" });
  } catch (error) {
    return res.status(500).json({ ok: false, message: "Error guardando lead." });
  }
}

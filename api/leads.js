import { neon } from "@neondatabase/serverless";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({ ok:false, message:"Método no permitido" });
  }

  try {

    const { businessName, phone, email } = req.body;

    if (!businessName) {
      return res.status(400).json({ ok:false, message:"Falta el nombre del negocio" });
    }

    if (!phone) {
      return res.status(400).json({ ok:false, message:"Falta el teléfono" });
    }

    if (!email) {
      return res.status(400).json({ ok:false, message:"Falta el email" });
    }

    const sql = neon(process.env.DATABASE_URL);

    await sql`
      INSERT INTO leads (business_name, phone, email)
      VALUES (${businessName}, ${phone}, ${email})
    `;

    return res.status(200).json({
      ok:true,
      message:"Lead guardado correctamente 🚀"
    });

  } catch(err) {

    return res.status(500).json({
      ok:false,
      message:"Error guardando lead"
    });

  }
}

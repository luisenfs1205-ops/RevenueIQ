import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Método no permitido' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email requerido' });
    }

    await pool.query(
      'INSERT INTO leads (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    );

    return res.status(200).json({ ok: true, message: 'Correo guardado' });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error guardando correo' });
  }
}

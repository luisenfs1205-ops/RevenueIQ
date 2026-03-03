import pkg from 'pg';
const { Pool } = pkg;

let pool;

function getPool() {
  if (pool) return pool;

  const url = process.env.DATABASE_URL;

  pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  return pool;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, message: 'Endpoint listo. Usa POST.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false });
  }

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const email = body?.email;

    if (!email) {
      return res.status(400).json({ ok: false, message: 'Email requerido' });
    }

    const p = getPool();

    await p.query(
      'INSERT INTO leads (email) VALUES ($1) ON CONFLICT (email) DO NOTHING',
      [email]
    );

    return res.status(200).json({ ok: true, message: 'Correo guardado' });
  } catch (error) {
    return res.status(500).json({ ok: false, error: String(error) });
  }
}

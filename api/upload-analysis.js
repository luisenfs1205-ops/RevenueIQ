import { put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";

export const config = {
    api: {
        bodyParser: false,
    },
};

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on("data", (chunk) => chunks.push(chunk));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ ok: false, message: "Método no permitido" });
    }

    try {
        const contentType = req.headers["content-type"] || "";

        if (!contentType.includes("multipart/form-data")) {
            return res.status(400).json({
                ok: false,
                message: "El formulario debe enviar archivos.",
            });
        }

        const bodyBuffer = await readRequestBody(req);

        const request = new Request("http://localhost/upload", {
            method: "POST",
            headers: { "content-type": contentType },
            body: bodyBuffer,
            duplex: "half",
        });

        const formData = await request.formData();

        const businessName = String(formData.get("businessName") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const phone = String(formData.get("phone") || "").trim();
        const businessType = String(formData.get("businessType") || "").trim();
        const periodCovered = String(formData.get("periodCovered") || "").trim();
        const notes = String(formData.get("notes") || "").trim();
        const file = formData.get("mainFile");

        if (!businessName || !email || !phone) {
            return res.status(400).json({
                ok: false,
                message: "Faltan datos del negocio.",
            });
        }

        if (!file || typeof file === "string") {
            return res.status(400).json({
                ok: false,
                message: "Falta el archivo principal.",
            });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const blob = await put(`analysis-uploads/${Date.now()}-${file.name}`, buffer, {
            access: "private",
            contentType: file.type || "application/octet-stream",
        });

        const sql = neon(process.env.DATABASE_URL);

        await sql`
      INSERT INTO analysis_uploads
      (business_name, email, phone, business_type, period_covered, notes, file_name, file_url)
      VALUES
      (${businessName}, ${email}, ${phone}, ${businessType}, ${periodCovered}, ${notes}, ${file.name}, ${blob.url})
    `;

        return res.status(200).json({
            ok: true,
            message: "Archivo recibido correctamente.",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            message: "No pude guardar el archivo.",
        });
    }
}
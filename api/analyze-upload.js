import { neon } from "@neondatabase/serverless";
import * as XLSX from "xlsx";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ ok: false, message: "Método no permitido." });
    }

    try {
        const { uploadId } = req.body || {};

        if (!uploadId) {
            return res.status(400).json({ ok: false, message: "Falta uploadId." });
        }

        const sql = neon(process.env.DATABASE_URL);

        const rows = await sql`
      SELECT id, file_url, file_name, business_name
      FROM analysis_uploads
      WHERE id = ${uploadId}
      LIMIT 1
    `;

        if (!rows.length) {
            return res.status(404).json({ ok: false, message: "No encontré ese archivo." });
        }

        const upload = rows[0];

        // Descargar archivo desde Blob
        const fileRes = await fetch(upload.file_url);

        if (!fileRes.ok) {
            return res.status(500).json({
                ok: false,
                message: "No pude descargar el archivo desde Blob."
            });
        }

        const arrayBuffer = await fileRes.arrayBuffer();

        // Parsear Excel con SheetJS
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (!data.length) {
            return res.status(400).json({
                ok: false,
                message: "El archivo no tiene filas para analizar."
            });
        }

        let highRisk = 0;
        let mediumRisk = 0;
        let lowRisk = 0;
        let expiringSoon = 0;
        let inactiveCount = 0;

        const today = new Date();

        function daysBetween(dateValue) {
            if (!dateValue) return null;
            const d = new Date(dateValue);
            if (Number.isNaN(d.getTime())) return null;
            const diff = today.getTime() - d.getTime();
            return Math.floor(diff / (1000 * 60 * 60 * 24));
        }

        function daysUntil(dateValue) {
            if (!dateValue) return null;
            const d = new Date(dateValue);
            if (Number.isNaN(d.getTime())) return null;
            const diff = d.getTime() - today.getTime();
            return Math.floor(diff / (1000 * 60 * 60 * 24));
        }

        for (const row of data) {
            // Ajusta estos nombres a tus columnas reales
            const lastVisit = row.last_visit_date || row.lastVisitDate || row["Última visita"] || "";
            const membershipEnd = row.membership_end_date || row.membershipEndDate || row["Fecha de vencimiento"] || "";
            const status = String(row.membership_status || row.status || row["Estatus"] || "").toLowerCase();

            const daysSinceVisit = daysBetween(lastVisit);
            const daysToExpiry = daysUntil(membershipEnd);

            if (daysToExpiry !== null && daysToExpiry <= 7 && daysToExpiry >= 0) {
                expiringSoon++;
            }

            if (daysSinceVisit !== null && daysSinceVisit >= 15) {
                inactiveCount++;
            }

            // Reglas simples de riesgo
            if (
                (daysSinceVisit !== null && daysSinceVisit >= 15) &&
                (daysToExpiry !== null && daysToExpiry <= 7 && daysToExpiry >= 0)
            ) {
                highRisk++;
            } else if (
                (daysSinceVisit !== null && daysSinceVisit >= 10) ||
                (daysToExpiry !== null && daysToExpiry <= 7 && daysToExpiry >= 0)
            ) {
                mediumRisk++;
            } else {
                lowRisk++;
            }

            // Si ya está cancelado, lo puedes contar aparte si quieres
            if (status.includes("cancel")) {
                highRisk++;
            }
        }

        const totalMembers = data.length;

        const diagnosisText =
            `Se analizaron ${totalMembers} miembros. ` +
            `Se detectaron ${highRisk} en riesgo alto, ${mediumRisk} en riesgo medio y ${lowRisk} en riesgo bajo. ` +
            `Además, ${expiringSoon} membresías vencen pronto y ${inactiveCount} miembros muestran baja actividad reciente.`;

        await sql`
      INSERT INTO analysis_results
      (
        upload_id,
        total_members,
        high_risk_count,
        medium_risk_count,
        low_risk_count,
        expiring_soon_count,
        inactive_count,
        diagnosis_text
      )
      VALUES
      (
        ${upload.id},
        ${totalMembers},
        ${highRisk},
        ${mediumRisk},
        ${lowRisk},
        ${expiringSoon},
        ${inactiveCount},
        ${diagnosisText}
      )
    `;

        return res.status(200).json({
            ok: true,
            message: "Diagnóstico generado correctamente.",
            summary: {
                totalMembers,
                highRisk,
                mediumRisk,
                lowRisk,
                expiringSoon,
                inactiveCount,
                diagnosisText
            }
        });

    } catch (error) {
        console.error("ANALYZE_UPLOAD_ERROR:", error);
        return res.status(500).json({
            ok: false,
            message: "No pude analizar el archivo.",
            error: String(error?.message || error)
        });
    }
}
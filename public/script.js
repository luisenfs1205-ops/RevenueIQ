const form = document.getElementById("leadForm");
const businessNameInput = document.getElementById("businessName");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "Enviando...";

  const businessName = businessNameInput.value.trim();
  const phone = phoneInput.value.trim();
  const email = emailInput.value.trim();

  if (!businessName || !phone || !email) {
    msg.textContent = "Te faltan datos: negocio, teléfono y correo.";
    return;
  }

  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, phone, email })
    });

    const data = await res.json();
    msg.textContent = data.message || "Listo.";

    if (data.ok) {
      businessNameInput.value = "";
      phoneInput.value = "";
      emailInput.value = "";
    }

  } catch {
    msg.textContent = "No pude guardar los datos. Revisa que el servidor esté prendido.";
  }
});


/* -------------------------
   SIMULADOR DE RIESGO
-------------------------- */

const simulateBtn = document.getElementById("simulateBtn");

if (simulateBtn) {

  simulateBtn.addEventListener("click", () => {

    const activeMembers = Number(document.getElementById("activeMembers").value);
    const lowAttendance = Number(document.getElementById("lowAttendance").value);
    const renewalsSoon = Number(document.getElementById("renewalsSoon").value);
    const simResult = document.getElementById("simResult");

    if (!activeMembers || activeMembers <= 0) {

      simResult.innerHTML = `
        <p class="sim-error">
        Ingresa una cantidad válida de miembros activos.
        </p>
      `;

      return;
    }

    const safeLowAttendance = Math.max(0, lowAttendance || 0);
    const safeRenewalsSoon = Math.max(0, renewalsSoon || 0);

    /* fórmula simple de estimación */
    const estimatedRisk = Math.round(
      (safeLowAttendance * 0.6) +
      (safeRenewalsSoon * 0.4)
    );

    const cappedRisk = Math.min(estimatedRisk, activeMembers);

    const riskPercent = Math.round(
      (cappedRisk / activeMembers) * 100
    );

    let riskLevel = "Bajo";

    if (riskPercent >= 20 && riskPercent < 40) {
      riskLevel = "Medio";
    }

    if (riskPercent >= 40) {
      riskLevel = "Alto";
    }

    simResult.innerHTML = `
      <div class="sim-output">

        <h3>${cappedRisk} miembros estimados en riesgo</h3>

        <p><strong>Nivel de riesgo:</strong> ${riskLevel}</p>

        <p><strong>Porcentaje estimado:</strong> ${riskPercent}%</p>

        <p class="sim-note">
        Esta es una simulación inicial. El análisis completo de RevenueIQ
        incluye detección avanzada, segmentación y recomendaciones
        específicas para tu negocio.
        </p>

      </div>
    `;

  });

}
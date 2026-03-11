const form = document.getElementById("leadForm");
const businessNameInput = document.getElementById("businessName");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const msg = document.getElementById("msg");

console.log("FORM:", form);
console.log("BUSINESS INPUT:", businessNameInput);
console.log("PHONE INPUT:", phoneInput);
console.log("EMAIL INPUT:", emailInput);

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("SE DISPARÓ EL SUBMIT");

    msg.textContent = "Enviando...";

    const businessName = businessNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();

    console.log("DATOS:", { businessName, phone, email });

    if (!businessName || !phone || !email) {
      msg.textContent = "Te faltan datos: negocio, teléfono y correo.";
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ businessName, phone, email })
      });

      console.log("STATUS FETCH:", res.status);

      const data = await res.json();
      console.log("RESPUESTA API:", data);

      msg.textContent = data.message || "Datos enviados.";

      if (data.ok) {
        console.log("DATA.OK = TRUE, REDIRIGIENDO");

        localStorage.setItem("businessName", businessName);
        localStorage.setItem("phone", phone);
        localStorage.setItem("email", email);

        window.location.href = "/portal.html";
      } else {
        console.log("DATA.OK = FALSE");
      }

    } catch (error) {
      console.error("ERROR FETCH:", error);
      msg.textContent = "No pude guardar los datos. Revisa la conexión con el servidor.";
    }
  });
} else {
  console.error("NO ENCONTRÉ EL FORMULARIO leadForm");
}


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

    const estimatedRisk = Math.round(
      (safeLowAttendance * 0.6) + (safeRenewalsSoon * 0.4)
    );

    const cappedRisk = Math.min(estimatedRisk, activeMembers);
    const riskPercent = Math.round((cappedRisk / activeMembers) * 100);

    let riskLevel = "Bajo";
    if (riskPercent >= 20 && riskPercent < 40) riskLevel = "Medio";
    if (riskPercent >= 40) riskLevel = "Alto";

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
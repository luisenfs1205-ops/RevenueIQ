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

  // Mini-validación para que no manden vacío
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
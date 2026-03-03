const form = document.getElementById("leadForm");
const emailInput = document.getElementById("email");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "Enviando...";

  const email = emailInput.value.trim();

  try {
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    msg.textContent = data.message || "Listo.";

    if (data.ok) emailInput.value = "";
  } catch {
    msg.textContent = "No pude guardar el correo. Revisa que el servidor esté prendido.";
  }
});
// Envía por mail el DNI de la mascota al usuario que tiene la sesión iniciada (solo a su propio mail).
// Requiere, en Netlify → Environment variables: BREVO_API_KEY y BREVO_SENDER_EMAIL (servicio gratuito Brevo).
const SUPABASE_URL = "https://qbihkpseaxctkzsybzgn.supabase.co";
const SUPABASE_KEY = "sb_publishable_vI40ZnrcMQYV3uUhP4mCeA_mKaXmU0H";
const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export default async (request) => {
  if (request.method !== "POST") return new Response("Método no permitido", { status: 405 });
  const apiKey = Netlify.env.get("BREVO_API_KEY");
  const remitente = Netlify.env.get("BREVO_SENDER_EMAIL");
  if (!apiKey || !remitente) return new Response("Envío por mail no configurado", { status: 503 });

  const token = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return new Response("Sin sesión", { status: 401 });
  const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${token}` } });
  if (!u.ok) return new Response("Sesión inválida", { status: 401 });
  const usuario = await u.json();
  const email = usuario && usuario.email;
  if (!email) return new Response("Sin mail", { status: 400 });

  let body;
  try { body = await request.json(); } catch { return new Response("Datos inválidos", { status: 400 }); }
  const imagen = String(body.imagen || "");
  if (!imagen || imagen.length > 7_000_000 || !/^[A-Za-z0-9+/=]+$/.test(imagen)) return new Response("Imagen inválida", { status: 400 });
  const nombre = String(body.nombre || "tu mascota").slice(0, 40);
  const archivo = (String(body.archivo || "dni-mascota.jpg").replace(/[^a-z0-9.\-]/gi, "") || "dni-mascota.jpg").slice(0, 60);

  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: "Mascotas Perdidas Misiones", email: remitente },
      to: [{ email }],
      subject: `🪪 El DNI de ${nombre}`,
      htmlContent: `<div style="font-family:Arial,sans-serif;color:#12302B"><h2 style="color:#0E7C6B">¡Acá está el DNI de ${esc(nombre)}! 🐾</h2><p>Te lo dejamos adjunto para que lo guardes o lo imprimas en tamaño tarjeta.</p><p>El código QR abre la ficha de ${esc(nombre)}: si algún día se pierde, quien lo escanee te puede avisar al instante.</p><p><a href="https://mascotasperdidasmisiones.netlify.app" style="color:#0E7C6B">mascotasperdidasmisiones.netlify.app</a></p></div>`,
      attachment: [{ content: imagen, name: archivo }],
    }),
  });
  if (!r.ok) return new Response("No se pudo enviar", { status: 502 });
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
};

export const config = { path: "/api/enviar-dni" };

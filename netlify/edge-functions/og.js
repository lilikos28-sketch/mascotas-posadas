// Vista previa al compartir: cuando alguien comparte /?post=ID en Facebook o WhatsApp,
// esta función cambia el título, el texto y la imagen de la vista previa por los de esa mascota.
const SUPABASE_URL = "https://qbihkpseaxctkzsybzgn.supabase.co";
const SUPABASE_KEY = "sb_publishable_vI40ZnrcMQYV3uUhP4mCeA_mKaXmU0H";
const SITE = "https://mascotasposadas.netlify.app";

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async (request, context) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("post");
  const response = await context.next();
  if (!id || !/^[\w-]{1,64}$/.test(id)) return response;
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/publicaciones?id=eq.${encodeURIComponent(id)}&select=type,pet_name,species,zona,barrio,photo,approved`,
      { headers: { apikey: SUPABASE_KEY } }
    );
    if (!r.ok) return response;
    const rows = await r.json();
    const p = rows && rows[0];
    if (!p || p.approved === false) return response;

    const est = p.type === "lost" ? "🔴 PERDIDA" : p.type === "found" ? "🟢 ENCONTRADA" : "🟡 VISTA";
    const esp = p.species && p.species !== "otro" ? p.species : "mascota";
    const quien = p.pet_name ? `${p.pet_name} (${esp})` : esp.charAt(0).toUpperCase() + esp.slice(1);
    const zona = p.zona || "Posadas";
    const lugar = zona === "Posadas" && p.barrio ? `${p.barrio}, ${zona}` : zona;
    const title = `${est}: ${quien} en ${lugar}`;
    const desc = p.type === "lost"
      ? "Si viste a esta mascota, ayudanos a encontrarla. Tocá para ver el anuncio."
      : p.type === "found"
      ? "¿Es tuya esta mascota? Ayudala a volver a casa. Tocá para ver el anuncio."
      : "Si sabés de quién es esta mascota, avisanos. Tocá para ver el anuncio.";
    const hasPhoto = typeof p.photo === "string" && p.photo.startsWith("https://");
    const image = hasPhoto ? p.photo : `${SITE}/portada.png`;
    const link = `${SITE}/?post=${encodeURIComponent(id)}`;

    let html = await response.text();
    const set = (attr, key, val) => {
      const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, "i");
      html = html.replace(re, `$1${esc(val)}$2`);
    };
    set("property", "og:title", title);
    set("property", "og:description", desc);
    set("property", "og:image", image);
    set("property", "og:url", link);
    set("name", "twitter:title", title);
    set("name", "twitter:description", desc);
    set("name", "twitter:image", image);
    if (hasPhoto) html = html.replace(/\s*<meta\s+property="og:image:(width|height)"[^>]*>/gi, "");
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${esc(title)} · Mascotas Perdidas Misiones</title>`);

    const headers = new Headers(response.headers);
    headers.delete("content-length");
    return new Response(html, { status: response.status, headers });
  } catch {
    return response;
  }
};

export const config = { path: "/" };

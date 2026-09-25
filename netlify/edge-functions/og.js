// Vista previa al compartir: cuando alguien comparte /?post=ID en Facebook o WhatsApp,
// esta función cambia el título, el texto y la imagen de la vista previa por los de esa mascota.
const SUPABASE_URL = "https://qbihkpseaxctkzsybzgn.supabase.co";
const SUPABASE_KEY = "sb_publishable_vI40ZnrcMQYV3uUhP4mCeA_mKaXmU0H";

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async (request, context) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("post");
  const SITE = url.origin;
  const response = await context.next();
  if (!(response.headers.get("content-type") || "").includes("text/html")) return response;

  // Las direcciones de la vista previa usan siempre el nombre con el que se abrió el sitio
  const base = await response.text();
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  let html = base.replace(/https:\/\/mascotas(posadas|perdidasmisiones)\.netlify\.app/g, SITE);
  // Vista previa especial para las notas del blog y las pantallas que se comparten en redes
  const PAGINAS = {
    "nota:24horas": ["Se perdió tu mascota: qué hacer en las primeras 24 horas", "Guía paso a paso para las horas más importantes.", "/blog/nota-primeras-24-horas.jpg"],
    "nota:encontre": ["Encontraste un perro en la calle: ¿y ahora?", "Qué hacer para que vuelva con su familia.", "/blog/nota-encontre-un-perro.jpg"],
    "nota:qr": ["Por qué tu mascota necesita una chapita con QR", "Registrala gratis y generá su código.", "/blog/nota-chapita-qr.jpg"],
    "v:cuidados": ["Antes del finde: 3 cuidados para que tu mascota no se pierda", "Chapita con QR gratis en Mascotas Perdidas Misiones.", "/fb/cuidados.jpg"],
    "v:inicio": ["Mascotas Perdidas Misiones", "Publicá gratis tu mascota perdida o encontrada.", "/fb/presentacion.jpg"],
    "v:publicar": ["Publicá una mascota en 1 minuto", "Gratis, con foto, barrio y mapa.", "/fb/publicar.jpg"],
    "v:registrar": ["Registrá tu mascota y generá su QR", "Gratis. Si se pierde, te avisan al instante.", "/fb/registrar.jpg"],
  };
  const clave = url.searchParams.get("nota") ? "nota:" + url.searchParams.get("nota") : url.searchParams.get("v") ? "v:" + url.searchParams.get("v") : null;
  if (!id && clave && PAGINAS[clave]) {
    const [t, d, img] = PAGINAS[clave];
    const setP = (attr, key, val) => { const re = new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`, "i"); html = html.replace(re, `$1${esc(val)}$2`); };
    setP("property", "og:title", t); setP("property", "og:description", d); setP("property", "og:image", SITE + img); setP("property", "og:url", SITE + url.pathname + url.search);
    setP("name", "twitter:title", t); setP("name", "twitter:description", d); setP("name", "twitter:image", SITE + img);
    html = html.replace(/\s*<meta\s+property="og:image:(width|height)"[^>]*>/gi, "");
    return new Response(html, { status: response.status, headers });
  }
  if (!id || !/^[\w-]{1,64}$/.test(id)) return new Response(html, { status: response.status, headers });

  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/publicaciones?id=eq.${encodeURIComponent(id)}&select=type,pet_name,species,zona,barrio,photo,approved`,
      { headers: { apikey: SUPABASE_KEY } }
    );
    if (!r.ok) return new Response(html, { status: response.status, headers });
    const rows = await r.json();
    const p = rows && rows[0];
    if (!p || p.approved === false) return new Response(html, { status: response.status, headers });

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

    return new Response(html, { status: response.status, headers });
  } catch {
    return new Response(html, { status: response.status, headers });
  }
};

export const config = { path: "/" };

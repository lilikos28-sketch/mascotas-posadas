// Lee la vista previa pública (título, texto y foto) de un posteo de Facebook, como hacen WhatsApp o Telegram al pegar un enlace.
// Solo funciona con posteos públicos. Los de grupos privados o que piden iniciar sesión devuelven ok:false.
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const esHostFb = (h) => h === "facebook.com" || h.endsWith(".facebook.com") || h === "fb.watch" || h === "fb.me" || h === "fb.com" || h.endsWith(".fb.com");
const decodificar = (s) => (s || "")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch { return ""; } })
  .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(parseInt(d, 10)); } catch { return ""; } })
  .replace(/&(a|e|i|o|u|A|E|I|O|U)acute;/g, (_, v) => ({ a: "á", e: "é", i: "í", o: "ó", u: "ú", A: "Á", E: "É", I: "Í", O: "Ó", U: "Ú" })[v])
  .replace(/&ntilde;/g, "ñ").replace(/&Ntilde;/g, "Ñ").replace(/&uuml;/g, "ü").replace(/&iexcl;/g, "¡").replace(/&iquest;/g, "¿").replace(/&nbsp;/g, " ")
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
export function leerMeta(html, prop) {
  const p = prop.replace(/[:.]/g, "\\$&");
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]*?content=["']([^"']*)["']`, "i"));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${p}["']`, "i"));
  return decodificar((a && a[1]) || (b && b[1]) || "").trim();
}
export default async (request) => {
  const u = new URL(request.url).searchParams.get("u") || "";
  let t;
  try { t = new URL(u); } catch { return json({ ok: false, error: "URL inválida" }, 400); }
  if (t.protocol !== "https:" || !esHostFb(t.hostname)) return json({ ok: false, error: "Solo enlaces de Facebook" }, 403);
  try {
    const r = await fetch(t.toString(), { redirect: "follow", headers: { "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)", "Accept-Language": "es-AR,es;q=0.9", "Accept": "text/html" } });
    let finalHost = ""; try { finalHost = new URL(r.url).hostname; } catch {}
    if (!r.ok || !esHostFb(finalHost)) return json({ ok: false, error: "No se pudo abrir el posteo" });
    const html = (await r.text()).slice(0, 600000);
    const title = leerMeta(html, "og:title");
    const description = leerMeta(html, "og:description");
    let image = leerMeta(html, "og:image");
    try { const h = new URL(image).hostname; if (!(h.endsWith(".fbcdn.net") || h.endsWith(".facebook.com"))) image = ""; } catch { image = ""; }
    const muro = /^(facebook|iniciar sesi|log in|log into|inicia sesi|entrar)/i.test(title) && !description;
    if (muro || (!description && !image)) return json({ ok: false, error: "El posteo no es público o Facebook no dejó leerlo" });
    return json({ ok: true, title, description, image });
  } catch {
    return json({ ok: false, error: "No se pudo leer" });
  }
};
export const config = { path: "/api/fbinfo" };

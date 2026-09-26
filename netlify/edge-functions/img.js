// Trae una imagen de Facebook para poder cargarla en una publicación (solo imágenes de Facebook).
export default async (request) => {
  const u = new URL(request.url).searchParams.get("u") || "";
  let target;
  try { target = new URL(u); } catch { return new Response("URL inválida", { status: 400 }); }
  const host = target.hostname;
  const permitido = target.protocol === "https:" && (host.endsWith(".fbcdn.net") || host.endsWith(".facebook.com"));
  if (!permitido) return new Response("Solo imágenes de Facebook", { status: 403 });
  try {
    const r = await fetch(target.toString(), { headers: { "User-Agent": "Mozilla/5.0" } });
    const tipo = r.headers.get("content-type") || "";
    if (!r.ok || !tipo.startsWith("image/")) return new Response("No es una imagen", { status: 502 });
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 8 * 1024 * 1024) return new Response("Imagen muy grande", { status: 413 });
    return new Response(buf, { status: 200, headers: { "content-type": tipo, "access-control-allow-origin": "*", "cache-control": "no-store" } });
  } catch {
    return new Response("No se pudo descargar", { status: 502 });
  }
};
export const config = { path: "/api/img" };

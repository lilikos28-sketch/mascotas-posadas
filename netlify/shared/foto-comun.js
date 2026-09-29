// Funciones compartidas: buscar la foto de una publicación y leer su tamaño.
export const SUPABASE_URL = "https://qbihkpseaxctkzsybzgn.supabase.co";
export const SUPABASE_KEY = "sb_publishable_vI40ZnrcMQYV3uUhP4mCeA_mKaXmU0H";

export async function fotoDePublicacion(id) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/publicaciones?id=eq.${encodeURIComponent(id)}&select=photo,approved`, { headers: { apikey: SUPABASE_KEY } });
    if (!r.ok) return null;
    const rows = await r.json();
    const p = rows && rows[0];
    if (!p || p.approved === false || typeof p.photo !== "string") return null;
    if (p.photo.startsWith("data:")) {
      const m = p.photo.match(/^data:(image\/[\w+.-]+);base64,(.*)$/);
      if (!m) return null;
      const bin = atob(m[2]); const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return { bytes, tipo: m[1] };
    }
    if (p.photo.startsWith("https://")) {
      const f = await fetch(p.photo);
      const tipo = f.headers.get("content-type") || "image/jpeg";
      if (!f.ok || !tipo.startsWith("image/")) return null;
      return { bytes: new Uint8Array(await f.arrayBuffer()), tipo };
    }
    return null;
  } catch { return null; }
}

// Ancho y alto de una imagen JPEG o PNG (sin procesarla)
export function tamanoImagen(b) {
  try {
    if (b[0] === 0x89 && b[1] === 0x50) return { w: (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19], h: (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23] };
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const marca = b[i + 1]; const largo = (b[i + 2] << 8) | b[i + 3];
        if (marca >= 0xc0 && marca <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marca)) return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] };
        i += 2 + largo;
      }
    }
  } catch {}
  return null;
}

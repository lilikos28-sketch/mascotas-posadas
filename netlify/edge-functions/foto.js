// Entrega la foto de una publicación desde el propio dominio (para vistas previas de Facebook y WhatsApp).
// Sirve tanto fotos guardadas en el almacenamiento como fotos guardadas en formato interno (data:).
import { fotoDePublicacion } from "../shared/foto-comun.js";

export default async (request) => {
  const id = new URL(request.url).searchParams.get("post") || "";
  if (!/^[\w-]{1,64}$/.test(id)) return new Response("Pedido inválido", { status: 400 });
  const f = await fotoDePublicacion(id);
  if (!f) return new Response("Sin foto", { status: 404 });
  return new Response(f.bytes, { status: 200, headers: { "content-type": f.tipo, "cache-control": "public, max-age=86400", "access-control-allow-origin": "*" } });
};

export const config = { path: "/foto" };

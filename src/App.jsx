import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  PawPrint, MapPin, Search, Plus, Bell, User, Share2, Phone, Shield, ShieldCheck,
  Home, Check, X, Camera, ChevronLeft, ChevronRight, Sparkles, Trash2, EyeOff,
  PartyPopper, Copy, Store, Stethoscope, Settings2, Flag, Info, Navigation, Crosshair,
  Clock, Ruler, Ban, Loader2, Send, MapPinned, ListChecks, AlertTriangle, LogOut,
  LogIn, Pencil, Wallet, Cloud, CloudOff, Mail, KeyRound, CircleUserRound
} from "lucide-react";

/* =========================================================================
   MASCOTAS POSADAS — Etapa 3 (MVP multiusuario, costo $0)
   La app funciona en dos modos:
     • NUBE  → si completás SUPABASE_URL + SUPABASE_ANON_KEY (multiusuario real)
     • LOCAL → si no, guarda en este dispositivo (para probar la interfaz)
   Etiquetas:  🟢 FUNCIONAL · 🟡 PARCIAL · 🔴 PENDIENTE/REQUIERE PAGO
   ========================================================================= */

/* ============================ CONFIG (editar acá) ======================== */
const SUPABASE_URL = "https://qbihkpseaxctkzsybzgn.supabase.co";        // ← pegá tu Project URL (Supabase → Settings → API)
const SUPABASE_ANON_KEY = "sb_publishable_vI40ZnrcMQYV3uUhP4mCeA_mKaXmU0H";   // ← pegá tu anon public key
const ADMIN_EMAILS = ["lili.kos28@gmail.com"]; // ← tu email para ser admin en la nube
const CLOUD = !!(SUPABASE_URL && SUPABASE_ANON_KEY);

/* -------------------------------- Tokens --------------------------------- */
const C = {
  bg: "#F1F5F3", surface: "#FFFFFF", ink: "#12211C", muted: "#5F726B", line: "#E1E9E5",
  brand: "#0E7C6B", brandDeep: "#0A5A4E", brandSoft: "#E4F1ED",
  lost: "#E23B3B", found: "#159A5A", seen: "#E19A0C", reunited: "#B5387C",
};
const TYPE = {
  lost:  { label: "Perdida",    dot: C.lost,  soft: "#FBE7E7", ico: "🔴" },
  found: { label: "Encontrada", dot: C.found, soft: "#E3F4EA", ico: "🟢" },
  seen:  { label: "Vista",      dot: C.seen,  soft: "#FBF0DA", ico: "🟡" },
};
const STATUS = {
  lost:      { label: "Perdida",             color: C.lost },
  searching: { label: "En búsqueda",         color: C.seen },
  found:     { label: "Encontrada",          color: C.found },
  reunited:  { label: "Reunida con familia", color: C.reunited },
};
const REPORT_REASONS = ["Publicación falsa", "Información incorrecta", "Spam", "Estafa", "Contenido inapropiado", "Otro"];
const POSADAS_CENTER = [-27.3671, -55.8961];

/* ------------------------------ Barrios ---------------------------------- */
const BARRIOS = {
  "Centro":[-27.3621,-55.8981],"Bajada Vieja":[-27.3585,-55.8930],"Villa Sarita":[-27.3705,-55.9075],
  "Villa Urquiza":[-27.3760,-55.8925],"Villa Blosset":[-27.3820,-55.9010],"Villa Cabello":[-27.3925,-55.9330],
  "Miguel Lanús":[-27.3800,-55.9450],"Itaembé Miní":[-27.4050,-55.9600],"Itaembé Guazú":[-27.4250,-55.9250],
  "San Isidro":[-27.3730,-55.8760],"Chacra 32-33":[-27.3980,-55.8850],"El Palomar":[-27.3880,-55.9080],
  "Los Paraísos":[-27.4010,-55.9150],"Fátima":[-27.4090,-55.8950],"Nemesio Parma":[-27.3900,-55.8650],
  "Villa Lanús":[-27.3690,-55.9180],"San Lorenzo":[-27.3950,-55.8550],"Villa Poujade":[-27.4150,-55.9050],
};
const BARRIO_LIST = Object.keys(BARRIOS);
const BOUNDS = { minLat:-27.435, maxLat:-27.350, minLng:-55.970, maxLng:-55.848 };
const project = (lat,lng)=>({ x:((lng-BOUNDS.minLng)/(BOUNDS.maxLng-BOUNDS.minLng))*1000, y:((BOUNDS.maxLat-lat)/(BOUNDS.maxLat-BOUNDS.minLat))*700 });
const unproject = (px,py)=>({ lng:BOUNDS.minLng+(px/1000)*(BOUNDS.maxLng-BOUNDS.minLng), lat:BOUNDS.maxLat-(py/700)*(BOUNDS.maxLat-BOUNDS.minLat) });

/* ------------------------------ Utilidades ------------------------------- */
const digits = (s)=>(s||"").replace(/\D/g,"");
const maskPhone = (s)=>{const d=digits(s);return d?`+${d.slice(0,4)} ••• •• ${d.slice(-2)}`:"—";};
const clean = (s,max=400)=>(s||"").toString().replace(/[\u0000-\u001F\u007F]/g,"").trim().slice(0,max);
function haversine(a,b){const R=6371,r=(d)=>d*Math.PI/180;const dLat=r(b[0]-a[0]),dLng=r(b[1]-a[1]);const s=Math.sin(dLat/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dLng/2)**2;return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));}
function timeAgo(iso){const d=(Date.now()-new Date(iso).getTime())/1000;if(d<3600)return `hace ${Math.max(1,Math.floor(d/60))} min`;if(d<86400)return `hace ${Math.floor(d/3600)} h`;return `hace ${Math.floor(d/86400)} d`;}
const publicJitter = (lat,lng,id)=>{const n=typeof id==="number"?id:String(id).length*7;return [lat+Math.sin(n*12.9)*0.0016, lng+Math.cos(n*7.3)*0.0016];};
const jit = (p)=>{const [lat,lng]=publicJitter(p.lat,p.lng,p.id);return {lat,lng};};

/* --------------- Fotos: validación + compresión (🟢) --------------------- */
function validateImage(file){ if(!file)return "No se seleccionó archivo.";if(!file.type.startsWith("image/"))return "El archivo debe ser una imagen.";if(file.size>12*1024*1024)return "La imagen supera 12 MB.";return null; }
function compressImage(file,maxDim=1280,quality=0.72){
  return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);
    img.onload=()=>{let {width,height}=img;if(width>height&&width>maxDim){height=Math.round(height*maxDim/width);width=maxDim;}else if(height>maxDim){width=Math.round(width*maxDim/height);height=maxDim;}
      const cv=document.createElement("canvas");cv.width=width;cv.height=height;cv.getContext("2d").drawImage(img,0,0,width,height);URL.revokeObjectURL(url);resolve(cv.toDataURL("image/jpeg",quality));};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error("No se pudo leer la imagen."));};img.src=url;});
}

/* ===================== Backend: NUBE (Supabase) o LOCAL ==================== */
const KEYS = { posts:"mp:posts:v4", reports:"mp:reports:v4", session:"mp:session:v4" };
const hasStore = ()=>typeof window!=="undefined"&&window.storage;
const Local = {
  async get(k,f){ if(!hasStore())return f; try{const r=await window.storage.get(k);return r?JSON.parse(r.value):f;}catch{return f;} },
  async set(k,v){ if(!hasStore())return; try{await window.storage.set(k,JSON.stringify(v));}catch{} },
};
let _client=null;
async function getClient(){
  if(!CLOUD)return null; if(_client)return _client;
  if(!(window.supabase&&window.supabase.createClient)){
    await new Promise((res)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";s.onload=res;s.onerror=res;document.body.appendChild(s);setTimeout(res,7000);});
  }
  _client = (window.supabase&&window.supabase.createClient)?window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;
  return _client;
}
/* Mapeo fila <-> objeto de la app */
const toRow = (p)=>({ owner_id:p.owner_id??null, type:p.type, status:p.status, pet_name:p.petName, species:p.species, sex:p.sex, age_approx:p.ageApprox, color:p.color, features:p.features, date:p.date, time:p.time, place:p.place, barrio:p.barrio, description:p.description, photo:p.photo, contact_name:p.contactName, phone:p.phone, whatsapp:p.whatsapp, reward:p.reward, lat:p.lat, lng:p.lng, precise_location:p.preciseLocation, recovered_at:p.recoveredAt, approved:p.approved, reported:p.reported, city:p.city });
const fromRow = (r)=>({ id:r.id, owner_id:r.owner_id, type:r.type, status:r.status, petName:r.pet_name, species:r.species, sex:r.sex, ageApprox:r.age_approx, color:r.color, features:r.features, date:r.date, time:r.time, place:r.place, barrio:r.barrio, description:r.description, photo:r.photo, contactName:r.contact_name, phone:r.phone, whatsapp:r.whatsapp, reward:r.reward, lat:r.lat, lng:r.lng, preciseLocation:r.precise_location, recoveredAt:r.recovered_at, createdAt:r.created_at, approved:r.approved, reported:r.reported, city:r.city, demo:false, emoji:EMO[r.species]||"🐾" });
async function uploadPhoto(client, dataUrl){
  try{ const blob=await(await fetch(dataUrl)).blob(); const name=`pub/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
    const { error }=await client.storage.from("fotos").upload(name,blob,{contentType:"image/jpeg"}); if(error)throw error;
    const { data }=client.storage.from("fotos").getPublicUrl(name); return data.publicUrl;
  }catch{ return dataUrl; } // respaldo: guarda el dataURL en la columna
}
const mapUser = (u)=>u?({ id:u.id, email:u.email, name:(u.user_metadata&&u.user_metadata.name)||(u.email||"").split("@")[0] }):null;
const Auth = {
  async current(){ if(CLOUD){const c=await getClient();if(!c)return null;const {data}=await c.auth.getUser();return mapUser(data&&data.user);} return await Local.get(KEYS.session,null); },
  async signUp(email,password,name){ if(CLOUD){const c=await getClient();const {data,error}=await c.auth.signUp({email,password,options:{data:{name}}});if(error)throw error;return mapUser(data.user);} const u={id:"local-"+email,email,name:name||email.split("@")[0]};await Local.set(KEYS.session,u);return u; },
  async signIn(email,password){ if(CLOUD){const c=await getClient();const {data,error}=await c.auth.signInWithPassword({email,password});if(error)throw error;return mapUser(data.user);} const u={id:"local-"+email,email,name:email.split("@")[0]};await Local.set(KEYS.session,u);return u; },
  async signOut(){ if(CLOUD){const c=await getClient();await c.auth.signOut();} else {await Local.set(KEYS.session,null);} },
  async reset(email){ if(CLOUD){const c=await getClient();await c.auth.resetPasswordForEmail(email,{redirectTo:typeof window!=="undefined"?window.location.origin:undefined});} },
  async updateName(name){ if(CLOUD){const c=await getClient();await c.auth.updateUser({data:{name}});return await this.current();} const u=await Local.get(KEYS.session,null);if(u){u.name=name;await Local.set(KEYS.session,u);}return u; },
  async google(){ if(CLOUD){const c=await getClient();await c.auth.signInWithOAuth({provider:"google",options:{redirectTo:typeof window!=="undefined"?window.location.origin:undefined}});} },
};
const isAdmin = (user)=> CLOUD ? !!(user&&ADMIN_EMAILS.includes(user.email)) : true;

/* --------------------- Motor de coincidencia (interfaz) ------------------ */
const MatchEngine = {
  visionHook:null, // (target,candidate)=>Promise<0..100>|null  ← IA visual (🔴 requiere servicio pago)
  attributeScore(a,b){ let s=0,m=0;const add=(w,ok)=>{m+=w;if(ok)s+=w;};
    add(35,a.species===b.species);const ac=(a.color||"").toLowerCase(),bc=(b.color||"").toLowerCase();
    add(25,ac.split(/\s|y/).some(t=>t.length>2&&bc.includes(t)));add(15,a.sex&&a.sex===b.sex);add(15,a.barrio===b.barrio);
    const fa=(a.features||"").toLowerCase(),fb=(b.features||"").toLowerCase();add(10,fa&&fb&&fa.split(/\W+/).some(t=>t.length>3&&fb.includes(t)));return Math.round(s/m*100); },
  rank(target,cands){ return cands.filter(p=>(p.type==="found"||p.type==="seen")&&p.id!==target.id&&p.status!=="reunited")
    .map(p=>({post:p,score:this.attributeScore(target,p),visualScore:null,distanceKm:target.lat&&p.lat?haversine([target.lat,target.lng],[p.lat,p.lng]):null,ago:p.createdAt}))
    .filter(m=>m.score>=45).sort((a,b)=>b.score-a.score).slice(0,4); },
};

/* ----------------------------- Datos DEMO -------------------------------- */
const EMO = { perro:"🐕", gato:"🐈", otro:"🐾" };
function mk(id,type,o){const base=BARRIOS[o.barrio]||POSADAS_CENTER;const lat=base[0]+Math.sin(id*9.7)*0.0022,lng=base[1]+Math.cos(id*5.1)*0.0022;
  return { id:"demo-"+id, type, city:"posadas", status:type==="found"?"found":type==="lost"?"lost":"searching", petName:o.name||"", species:o.sp, sex:o.sex, ageApprox:o.age||"", color:o.color, features:o.feat||"", date:o.date, time:o.time||"", place:o.place||"", barrio:o.barrio, description:o.desc||"", photo:null, emoji:EMO[o.sp]||"🐾", contactName:o.who, phone:o.phone, whatsapp:o.phone, reward:o.reward||"", lat, lng, preciseLocation:false, recoveredAt:null, createdAt:new Date(Date.now()-(id%10)*5.4e6).toISOString(), approved:true, reported:false, demo:true, owner_id:null }; }
function seedPosts(){
  const L=[mk(1,"lost",{name:"Rocco",sp:"perro",sex:"Macho",age:"3 años",color:"Marrón y blanco",feat:"Collar rojo, orejas caídas",date:"2026-08-07",time:"18:30",place:"Plaza San Martín",barrio:"Centro",desc:"Se asustó y salió corriendo.",who:"Lucía",phone:"5493764111001",reward:"Recompensa"}),
    mk(2,"lost",{name:"Mia",sp:"gato",sex:"Hembra",age:"2 años",color:"Atigrada gris",feat:"Tímida, ojos verdes",date:"2026-08-06",time:"21:00",place:"Tucumán 1200",barrio:"Villa Sarita",desc:"Salió por una ventana.",who:"Diego",phone:"5493764111002"}),
    mk(3,"lost",{name:"Thor",sp:"perro",sex:"Macho",age:"5 años",color:"Negro",feat:"Grande, cicatriz en pata",date:"2026-08-05",time:"07:15",place:"Av. Uruguay",barrio:"Villa Cabello",desc:"Responde a su nombre.",who:"Marta",phone:"5493764111003"}),
    mk(4,"lost",{name:"Luna",sp:"perro",sex:"Hembra",age:"1 año",color:"Blanca",feat:"Caniche, pañuelo celeste",date:"2026-08-08",time:"12:00",place:"Feria Miguel Lanús",barrio:"Miguel Lanús",desc:"Muy mansa.",who:"Sofía",phone:"5493764111004",reward:"Recompensa"}),
    mk(5,"lost",{name:"Simón",sp:"gato",sex:"Macho",age:"4 años",color:"Naranja",feat:"Cola larga",date:"2026-08-04",time:"20:30",place:"Itaembé Miní B",barrio:"Itaembé Miní",desc:"Escapó en mudanza.",who:"Ramón",phone:"5493764111005"}),
    mk(6,"lost",{name:"Kira",sp:"perro",sex:"Hembra",age:"6 años",color:"Marrón",feat:"Ovejero, cadera",date:"2026-08-03",time:"16:40",place:"Cerca del río",barrio:"Bajada Vieja",desc:"Necesita medicación.",who:"Pablo",phone:"5493764111006"}),
    mk(7,"lost",{name:"Pelusa",sp:"gato",sex:"Hembra",age:"3 años",color:"Blanca y negra",feat:"Manchas tipo vaca",date:"2026-08-07",time:"22:10",place:"San Isidro 2",barrio:"San Isidro",desc:"Asustadiza.",who:"Elena",phone:"5493764111007"}),
    mk(8,"lost",{name:"Toby",sp:"perro",sex:"Macho",age:"2 años",color:"Beige",feat:"Cachorro, collar azul",date:"2026-08-08",time:"09:20",place:"Chacra 32",barrio:"Chacra 32-33",desc:"Juguetón.",who:"Nadia",phone:"5493764111008",reward:"Recompensa"}),
    mk(9,"lost",{name:"Frida",sp:"perro",sex:"Hembra",age:"7 años",color:"Negra y marrón",feat:"Dóberman mayor",date:"2026-08-02",time:"19:00",place:"El Palomar",barrio:"El Palomar",desc:"Sorda de un oído.",who:"Andrés",phone:"5493764111009"}),
    mk(10,"lost",{name:"Nino",sp:"otro",sex:"Macho",age:"1 año",color:"Verde",feat:"Loro hablador",date:"2026-08-06",time:"08:00",place:"Fátima mz 5",barrio:"Fátima",desc:"Dice 'hola'.",who:"Carla",phone:"5493764111010"})];
  const F=[mk(11,"found",{sp:"perro",sex:"Macho",color:"Marrón y blanco",feat:"Collar rojo gastado",date:"2026-08-08",time:"10:00",place:"Terminal",barrio:"Villa Urquiza",desc:"Apareció solo.",who:"Refugio Patitas",phone:"5493764222001"}),
    mk(12,"found",{sp:"gato",sex:"Hembra",color:"Atigrada gris",feat:"Ojos verdes",date:"2026-08-07",time:"08:30",place:"Patio",barrio:"Villa Sarita",desc:"La cuidamos.",who:"Vicky",phone:"5493764222002"}),
    mk(13,"found",{sp:"perro",sex:"Hembra",color:"Blanca",feat:"Caniche, pañuelo",date:"2026-08-08",time:"13:20",place:"Almacén",barrio:"Miguel Lanús",desc:"Mansa.",who:"Don José",phone:"5493764222003"}),
    mk(14,"found",{sp:"perro",sex:"Macho",color:"Negro",feat:"Cicatriz en pata",date:"2026-08-06",time:"17:00",place:"Cancha",barrio:"Villa Cabello",desc:"Responde a silbidos.",who:"Club Barrial",phone:"5493764222004"}),
    mk(15,"found",{sp:"gato",sex:"Macho",color:"Naranja",feat:"Cola larga",date:"2026-08-05",time:"12:00",place:"Galpón",barrio:"Itaembé Miní",desc:"Baja de noche.",who:"Sole",phone:"5493764222005"}),
    mk(16,"found",{sp:"perro",sex:"Macho",color:"Beige",feat:"Collar azul",date:"2026-08-08",time:"11:15",place:"Escuela",barrio:"Chacra 32-33",desc:"Chiquito.",who:"Maestra Ana",phone:"5493764222006"}),
    mk(17,"found",{sp:"perro",sex:"Hembra",color:"Marrón claro",feat:"Orejas paradas",date:"2026-08-04",time:"15:30",place:"Parque",barrio:"Los Paraísos",desc:"Con hambre.",who:"Marcos",phone:"5493764222007"}),
    mk(18,"found",{sp:"gato",sex:"Hembra",color:"Blanca y negra",feat:"Manchas grandes",date:"2026-08-07",time:"20:00",place:"Bajo un auto",barrio:"San Isidro",desc:"Sana.",who:"Flor",phone:"5493764222008"}),
    mk(19,"found",{sp:"perro",sex:"Macho",color:"Atigrado",feat:"Robusto",date:"2026-08-03",time:"09:45",place:"Ruta",barrio:"Nemesio Parma",desc:"Buen carácter.",who:"Vet. San Roque",phone:"5493764222009"}),
    mk(20,"found",{sp:"perro",sex:"Hembra",color:"Negra y marrón",feat:"Mayor, tranquila",date:"2026-08-02",time:"18:20",place:"Plazita",barrio:"El Palomar",desc:"Camina despacio.",who:"Vecinos",phone:"5493764222010"})];
  const S=[mk(21,"seen",{sp:"perro",sex:"Macho",color:"Marrón",feat:"Correa colgando",date:"2026-08-08",time:"07:40",place:"Av. Quaranta",barrio:"Villa Blosset",desc:"No lo pude agarrar.",who:"Anónimo",phone:"5493764333001"}),
    mk(22,"seen",{sp:"gato",sex:"Macho",color:"Naranja",feat:"Sin collar",date:"2026-08-07",time:"19:10",place:"Techo",barrio:"Itaembé Miní",desc:"Maúlla fuerte.",who:"Vecina",phone:"5493764333002"}),
    mk(23,"seen",{sp:"perro",sex:"Hembra",color:"Blanca",feat:"Chiquita",date:"2026-08-08",time:"12:30",place:"Feria",barrio:"Miguel Lanús",desc:"Escondida.",who:"Puesto 14",phone:"5493764333003"}),
    mk(24,"seen",{sp:"perro",sex:"Macho",color:"Negro",feat:"Grande",date:"2026-08-06",time:"06:50",place:"Arroyo",barrio:"Villa Cabello",desc:"Tomaba agua.",who:"Runner",phone:"5493764333004"}),
    mk(25,"seen",{sp:"otro",sex:"",color:"Verde",feat:"Loro en árbol",date:"2026-08-06",time:"09:30",place:"Vereda",barrio:"Fátima",desc:"Repetía palabras.",who:"Vecino",phone:"5493764333005"}),
    mk(26,"seen",{sp:"perro",sex:"Hembra",color:"Beige",feat:"Cachorra",date:"2026-08-08",time:"10:10",place:"Kiosco",barrio:"Chacra 32-33",desc:"Jugando.",who:"Kiosquero",phone:"5493764333006"}),
    mk(27,"seen",{sp:"gato",sex:"Hembra",color:"Gris",feat:"Atigrada",date:"2026-08-07",time:"21:30",place:"Patio",barrio:"Villa Sarita",desc:"Buscaba comida.",who:"Anónimo",phone:"5493764333007"}),
    mk(28,"seen",{sp:"perro",sex:"Macho",color:"Marrón y blanco",feat:"Collar rojo",date:"2026-08-08",time:"08:15",place:"Parada",barrio:"Villa Urquiza",desc:"En la parada.",who:"Chofer",phone:"5493764333008"}),
    mk(29,"seen",{sp:"perro",sex:"Hembra",color:"Negra y marrón",feat:"Mansa",date:"2026-08-05",time:"17:00",place:"Esquina",barrio:"El Palomar",desc:"A la sombra.",who:"Vecina",phone:"5493764333009"}),
    mk(30,"seen",{sp:"perro",sex:"Macho",color:"Beige",feat:"Collar azul",date:"2026-08-08",time:"14:00",place:"Escuela",barrio:"Chacra 32-33",desc:"Seguía a los chicos.",who:"Portero",phone:"5493764333010"})];
  return [...L,...F,...S];
}
const DEMO_POSTS = seedPosts();
const VETS = [
  { name:"Veterinaria San Roque", kind:"Veterinaria", barrio:"Centro", phone:"5493764555001", hours:"Lun a Sáb 8–20", emerg:true },
  { name:"Clínica Animal Misiones", kind:"Veterinaria 24h", barrio:"Villa Sarita", phone:"5493764555002", hours:"24 horas", emerg:true },
  { name:"Refugio Patitas Posadas", kind:"Refugio", barrio:"Villa Urquiza", phone:"5493764555003", hours:"Todos los días 9–18", emerg:false },
  { name:"Protectora Huellas del Paraná", kind:"Protectora", barrio:"Miguel Lanús", phone:"5493764555004", hours:"Sáb y Dom 10–16", emerg:false },
  { name:"Pet Center Cabello", kind:"Pet shop + Vet", barrio:"Villa Cabello", phone:"5493764555005", hours:"Lun a Sáb 9–19", emerg:false },
];

/* ============================ Leaflet (runtime) ========================= */
function useLeaflet(){
  const [status,setStatus]=useState(typeof window!=="undefined"&&window.L?"ready":"loading");
  useEffect(()=>{
    if(typeof window==="undefined")return; if(window.L){setStatus("ready");return;}
    if(!document.getElementById("leaflet-css")){const css=document.createElement("link");css.id="leaflet-css";css.rel="stylesheet";css.href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";document.head.appendChild(css);}
    let done=false;const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";s.async=true;
    s.onload=()=>{done=true;setStatus(window.L?"ready":"error");};s.onerror=()=>{done=true;setStatus("error");};document.body.appendChild(s);
    const to=setTimeout(()=>{if(!done)setStatus("error");},7000);return ()=>clearTimeout(to);
  },[]);
  return status;
}
function GeoMap({ markers=[], center=POSADAS_CENTER, zoom=13, onMarkerClick, onPick, picked, height=340, locate=false }){
  const status=useLeaflet();const elRef=useRef(),mapRef=useRef(),layerRef=useRef(),pickRef=useRef(),meRef=useRef();const [tileError,setTileError]=useState(false);
  useEffect(()=>{ if(status!=="ready"||!elRef.current||mapRef.current)return;const L=window.L;const map=L.map(elRef.current,{zoomControl:true}).setView(center,zoom);
    const tiles=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"});let e=0;tiles.on("tileerror",()=>{if(++e>4)setTileError(true);});tiles.addTo(map);
    layerRef.current=L.layerGroup().addTo(map);if(onPick)map.on("click",(ev)=>onPick(+ev.latlng.lat.toFixed(6),+ev.latlng.lng.toFixed(6)));mapRef.current=map;const t=setTimeout(()=>map.invalidateSize(),250);
    return ()=>{clearTimeout(t);map.remove();mapRef.current=null;}; },[status]);
  useEffect(()=>{ if(status!=="ready"||!layerRef.current)return;const L=window.L;layerRef.current.clearLayers();markers.forEach(m=>{const icon=L.divIcon({className:"mp-pin",html:`<span style="display:block;width:18px;height:18px;border-radius:50%;background:${m.color};border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45)"></span>`,iconSize:[18,18],iconAnchor:[9,9]});const mk=L.marker([m.lat,m.lng],{icon}).addTo(layerRef.current);if(onMarkerClick)mk.on("click",()=>onMarkerClick(m.post));}); },[markers,status]);
  useEffect(()=>{ if(status!=="ready"||!mapRef.current)return;const L=window.L;if(pickRef.current){mapRef.current.removeLayer(pickRef.current);pickRef.current=null;}if(picked){const icon=L.divIcon({className:"mp-pin",html:`<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${C.brand};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)"></span>`,iconSize:[22,22],iconAnchor:[11,11]});pickRef.current=L.marker([picked.lat,picked.lng],{icon}).addTo(mapRef.current);mapRef.current.setView([picked.lat,picked.lng],Math.max(mapRef.current.getZoom(),15));} },[picked,status]);
  const goToMe=()=>{ if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition((pos)=>{const {latitude,longitude}=pos.coords;if(mapRef.current){mapRef.current.setView([latitude,longitude],15);const L=window.L;if(meRef.current)mapRef.current.removeLayer(meRef.current);meRef.current=L.circleMarker([latitude,longitude],{radius:8,color:"#1f6feb",fillColor:"#1f6feb",fillOpacity:.9}).addTo(mapRef.current);}if(onPick)onPick(+latitude.toFixed(6),+longitude.toFixed(6));}); };
  if(status==="loading")return <div style={{height,background:"#DCEBE6"}} className="rounded-2xl flex items-center justify-center"><Loader2 className="animate-spin" color={C.brand} /></div>;
  if(status==="error")return (<div className="relative"><SvgMap markers={markers} onMarkerClick={onMarkerClick} onPick={onPick} picked={picked} height={height} /><div className="absolute top-2 left-2 right-2 rounded-xl px-3 py-2 text-[11px] flex items-center gap-1.5" style={{background:"#FFF7E6",color:"#7A5B14",border:"1px solid #F3E1B5"}}><Info size={13}/> Mapa esquemático (el entorno bloqueó el mapa real). En un hosting funciona con Leaflet + OpenStreetMap.</div></div>);
  return (<div className="relative rounded-2xl overflow-hidden" style={{border:`1px solid ${C.line}`}}><div ref={elRef} style={{height}}/>{tileError&&<div className="absolute top-2 left-2 right-2 z-[500] rounded-xl px-3 py-2 text-[11px] flex items-center gap-1.5" style={{background:"#FFF7E6",color:"#7A5B14",border:"1px solid #F3E1B5"}}><Info size={13}/> Mapa activo, pero el sandbox bloqueó las imágenes de OpenStreetMap. Al publicarla se ven normalmente.</div>}{locate&&<button onClick={goToMe} className="absolute bottom-3 right-3 z-[500] w-11 h-11 rounded-full flex items-center justify-center shadow-lg" style={{background:C.surface}}><Crosshair size={20} color={C.brand}/></button>}</div>);
}
function SvgMap({ markers, onMarkerClick, onPick, picked, height }){
  const ref=useRef();const click=(e)=>{if(!onPick)return;const r=ref.current.getBoundingClientRect();const px=(e.clientX-r.left)/r.width*1000,py=(e.clientY-r.top)/r.height*700;const {lat,lng}=unproject(px,py);onPick(+lat.toFixed(6),+lng.toFixed(6));};
  const pk=picked?project(picked.lat,picked.lng):null;
  return (<svg ref={ref} viewBox="0 0 1000 700" onClick={click} className="w-full rounded-2xl" style={{height,background:"#DCEBE6",cursor:onPick?"crosshair":"default",border:`1px solid ${C.line}`}}>
    <rect x="0" y="0" width="1000" height="700" fill="#DCEBE6"/><path d="M0,90 Q250,40 500,80 T1000,60 L1000,0 L0,0 Z" fill="#9FD0E8"/><text x="60" y="45" fill="#3E7DA0" fontSize="20" fontWeight="700">Río Paraná</text>
    {Object.entries(BARRIOS).map(([n,c])=>{const p=project(c[0],c[1]);return (<g key={n}><circle cx={p.x} cy={p.y} r="3" fill="#B7C9C2"/><text x={p.x+6} y={p.y+4} fill="#6E837B" fontSize="13">{n}</text></g>);})}
    {markers.map(m=>{const p=project(m.lat,m.lng);return <circle key={m.id} cx={p.x} cy={p.y} r="11" fill={m.color} stroke="#fff" strokeWidth="2.5" style={{cursor:"pointer"}} onClick={(e)=>{e.stopPropagation();onMarkerClick&&onMarkerClick(m.post);}}/>;})}
    {pk&&<circle cx={pk.x} cy={pk.y} r="13" fill={C.brand} stroke="#fff" strokeWidth="3"/>}
  </svg>);
}

/* ================================ APP =================================== */
export default function MascotasPosadas(){
  const [realPosts,setRealPosts]=useState([]);
  const [demoPosts,setDemoPosts]=useState(DEMO_POSTS);
  const [reports,setReports]=useState([]);
  const [user,setUser]=useState(null);
  const [conn,setConn]=useState("pending"); // cloud | local | error | pending
  const [ready,setReady]=useState(false);
  const [view,setView]=useState("home");
  const [newType,setNewType]=useState("lost");
  const [editPost,setEditPost]=useState(null);
  const [current,setCurrent]=useState(null);
  const [toast,setToast]=useState(null);
  const [celebrate,setCelebrate]=useState(false);
  const [reportFor,setReportFor]=useState(null);

  const posts = useMemo(()=>[...realPosts,...demoPosts],[realPosts,demoPosts]);
  const flash=(m)=>{setToast(m);setTimeout(()=>setToast(null),2600);};
  const go=(v,extra)=>{ if(extra&&extra.post)setCurrent(extra.post); if(extra&&extra.type)setNewType(extra.type); if(extra&&"edit" in extra)setEditPost(extra.edit); setView(v); if(typeof window!=="undefined")window.scrollTo(0,0); };

  const loadReal = async ()=>{
    if(CLOUD){ try{ const c=await getClient(); if(!c){setConn("error");await loadLocal();return;} const {data,error}=await c.from("publicaciones").select("*").order("created_at",{ascending:false}); if(error)throw error; setRealPosts((data||[]).map(fromRow)); const rr=await c.from("reportes").select("*").order("created_at",{ascending:false}); setReports(((rr.data)||[]).map(r=>({id:r.id,postId:r.post_id,reason:r.reason,note:r.note,date:r.created_at,postName:r.post_name,barrio:r.barrio}))); setConn("cloud"); }catch{ setConn("error"); await loadLocal(); } }
    else { setConn("local"); await loadLocal(); }
  };
  const loadLocal = async ()=>{ setRealPosts(await Local.get(KEYS.posts,[])); setReports(await Local.get(KEYS.reports,[])); };

  useEffect(()=>{ (async()=>{ setUser(await Auth.current()); await loadReal(); setReady(true);
    if(CLOUD){ const c=await getClient(); if(c&&c.auth&&c.auth.onAuthStateChange){ c.auth.onAuthStateChange((_e,session)=>setUser(mapUser(session&&session.user))); } }
  })(); },[]);

  /* ---- Auth handlers ---- */
  const onSignUp=async(email,password,name)=>{ try{ const u=await Auth.signUp(email,password,name); setUser(u); if(CLOUD&&!u)flash("Revisá tu email para confirmar la cuenta."); else go("home"); return true; }catch(e){ flash(e.message||"No se pudo registrar."); return false; } };
  const onSignIn=async(email,password)=>{ try{ const u=await Auth.signIn(email,password); setUser(u); go("home"); return true; }catch(e){ flash(e.message||"Datos incorrectos."); return false; } };
  const onSignOut=async()=>{ await Auth.signOut(); setUser(null); flash("Sesión cerrada."); };
  const onReset=async(email)=>{ await Auth.reset(email); flash(CLOUD?"Te enviamos un email para restablecer.":"En la nube se envía un email de recuperación."); };
  const onUpdateName=async(name)=>{ const u=await Auth.updateName(clean(name,40)); setUser(u); flash("Perfil actualizado."); };

  /* ---- Post handlers (nube o local) ---- */
  const routeDemo=(post)=>post&&post.demo;
  const createPost=async(p)=>{
    const partial={ ...p, city:"posadas", approved:true, reported:false, recoveredAt:null, status:p.type==="found"?"found":p.type==="lost"?"lost":"searching", emoji:EMO[p.species]||"🐾", owner_id:(user&&user.id)||(conn==="cloud"?null:"local"), contactName:(user&&user.name)||"Vecino/a" };
    if(conn==="cloud"){ try{ const c=await getClient(); let photo=p.photo; if(photo&&photo.startsWith("data:"))photo=await uploadPhoto(c,photo); const {data,error}=await c.from("publicaciones").insert(toRow({...partial,photo})).select().single(); if(error)throw error; const np=fromRow(data); setRealPosts(prev=>[np,...prev]); setCurrent(np); return np; }catch(e){ flash("No se pudo guardar en la nube."); return null; } }
    const id=Math.max(1000,...realPosts.filter(x=>typeof x.id==="number").map(x=>x.id))+1; const np={...partial,id,createdAt:new Date().toISOString()}; const next=[np,...realPosts]; setRealPosts(next); Local.set(KEYS.posts,next); setCurrent(np); return np;
  };
  const updatePost=async(id,fields)=>{
    const existing=realPosts.find(x=>x.id===id); if(!existing){flash("Solo podés editar tus publicaciones.");return null;}
    const merged={...existing,...fields};
    if(conn==="cloud"){ try{ const c=await getClient(); let photo=merged.photo; if(photo&&photo.startsWith("data:"))photo=await uploadPhoto(c,photo); const {data,error}=await c.from("publicaciones").update(toRow({...merged,photo})).eq("id",id).select().single(); if(error)throw error; const np=fromRow(data); setRealPosts(prev=>prev.map(x=>x.id===id?np:x)); setCurrent(np); return np; }catch{ flash("No se pudo actualizar."); return null; } }
    const next=realPosts.map(x=>x.id===id?merged:x); setRealPosts(next); Local.set(KEYS.posts,next); setCurrent(merged); return merged;
  };
  const submitPost=async(payload)=>{ if(payload.__edit)return await updatePost(payload.id,payload.fields); return await createPost(payload); };
  const setStatus=async(post,status)=>{
    const recoveredAt=(status==="found"||status==="reunited")?(post.recoveredAt||new Date().toISOString()):null;
    if(routeDemo(post)){ const next=demoPosts.map(p=>p.id===post.id?{...p,status,recoveredAt}:p); setDemoPosts(next); setCurrent(next.find(p=>p.id===post.id)); }
    else if(conn==="cloud"){ try{ const c=await getClient(); const {data,error}=await c.from("publicaciones").update({status,recovered_at:recoveredAt}).eq("id",post.id).select().single(); if(error)throw error; const np=fromRow(data); setRealPosts(prev=>prev.map(p=>p.id===post.id?np:p)); setCurrent(np); }catch{ flash("No se pudo cambiar el estado."); } }
    else { const next=realPosts.map(p=>p.id===post.id?{...p,status,recoveredAt}:p); setRealPosts(next); Local.set(KEYS.posts,next); setCurrent(next.find(p=>p.id===post.id)); }
    if(status==="reunited"||status==="found"){ setCelebrate(true); setTimeout(()=>setCelebrate(false),2600); }
  };
  const removePost=async(id)=>{
    const post=posts.find(p=>p.id===id);
    if(routeDemo(post)){ setDemoPosts(demoPosts.filter(p=>p.id!==id)); flash("Publicación demo ocultada."); return; }
    if(conn==="cloud"){ try{ const c=await getClient(); await c.from("publicaciones").delete().eq("id",id); await c.from("reportes").delete().eq("post_id",String(id)); }catch{ flash("No se pudo eliminar."); return; } setRealPosts(realPosts.filter(p=>p.id!==id)); setReports(reports.filter(r=>r.postId!==id)); }
    else { const next=realPosts.filter(p=>p.id!==id); setRealPosts(next); Local.set(KEYS.posts,next); const nr=reports.filter(r=>r.postId!==id); setReports(nr); Local.set(KEYS.reports,nr); }
    flash("Publicación eliminada.");
  };
  const approve=async(id,val)=>{
    const post=posts.find(p=>p.id===id);
    if(routeDemo(post)){ setDemoPosts(demoPosts.map(p=>p.id===id?{...p,approved:val}:p)); return; }
    if(conn==="cloud"){ try{ const c=await getClient(); const {data}=await c.from("publicaciones").update({approved:val}).eq("id",id).select().single(); if(data)setRealPosts(prev=>prev.map(p=>p.id===id?fromRow(data):p)); }catch{ flash("No se pudo moderar."); } }
    else { const next=realPosts.map(p=>p.id===id?{...p,approved:val}:p); setRealPosts(next); Local.set(KEYS.posts,next); }
  };
  const submitReport=async(post,reason,note)=>{
    const rec={ postId:post.id, reason, note:clean(note,200), postName:post.petName||post.species, barrio:post.barrio };
    if(conn==="cloud"){ try{ const c=await getClient(); const {data}=await c.from("reportes").insert({post_id:String(post.id),reason,note:rec.note,post_name:rec.postName,barrio:rec.barrio}).select().single(); if(data)setReports(prev=>[{...rec,id:data.id,date:data.created_at},...prev]); }catch{} }
    else { const full={...rec,id:Date.now(),date:new Date().toISOString()}; const nr=[full,...reports]; setReports(nr); Local.set(KEYS.reports,nr); }
    if(!routeDemo(post)){ if(conn==="cloud")getClient().then(c=>c.from("publicaciones").update({reported:true}).eq("id",post.id)); }
    setReportFor(null); flash("Gracias. El equipo revisará el reporte.");
  };
  const clearReport=async(rid)=>{ if(conn==="cloud"){try{const c=await getClient();await c.from("reportes").delete().eq("id",rid);}catch{}} const nr=reports.filter(r=>r.id!==rid); setReports(nr); if(conn!=="cloud")Local.set(KEYS.reports,nr); };

  const requireAuthToPublish = CLOUD && !user;

  if(!ready) return <div style={{background:C.bg,minHeight:480}} className="flex items-center justify-center"><PawPrint className="animate-pulse" color={C.brand}/></div>;
  const visible=posts.filter(p=>p.approved!==false);

  return (
    <div style={{background:C.bg,color:C.ink,fontFamily:"'Plus Jakarta Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif"}} className="min-h-screen w-full">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box}.mp-scroll::-webkit-scrollbar{height:6px}.leaflet-container{font:inherit}
        @keyframes pop{0%{transform:scale(.6);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
        .inp{width:100%;padding:11px 13px;border-radius:14px;border:1px solid ${C.line};background:${C.surface};font-size:14px;outline:none;color:${C.ink}}`}</style>

      <div className="mx-auto max-w-[480px] relative pb-24" style={{background:C.bg}}>
        <Header go={go} count={visible.filter(p=>p.status==="lost").length} conn={conn} />

        {view==="home"    && <HomeView posts={visible} go={go} conn={conn} />}
        {view==="map"     && <MapView posts={visible} go={go} />}
        {view==="search"  && <SearchView posts={visible} go={go} />}
        {view==="new"     && (requireAuthToPublish ? <AuthGate go={go} /> : <NewView type={newType} setType={setNewType} onSubmit={submitPost} go={go} flash={flash} editPost={editPost} />)}
        {view==="detail"  && current && <DetailView post={current} all={visible} go={go} setStatus={setStatus} flash={flash} onReport={()=>setReportFor(current)} user={user} onDelete={removePost} />}
        {view==="share"   && current && <ShareView post={current} go={go} flash={flash} />}
        {view==="help"    && <HelpView go={go} />}
        {view==="business"&& <BusinessView go={go} />}
        {view==="auth"    && <AuthView onSignIn={onSignIn} onSignUp={onSignUp} onReset={onReset} onGoogle={Auth.google} go={go} />}
        {view==="costs"   && <CostsView go={go} conn={conn} />}
        {view==="profile" && <ProfileView posts={posts} go={go} user={user} conn={conn} onSignOut={onSignOut} onUpdateName={onUpdateName} />}
        {view==="admin"   && (isAdmin(user) ? <AdminView posts={posts} reports={reports} approve={approve} removePost={removePost} go={go} clearReport={clearReport} conn={conn} /> : <AdminLocked go={go} />)}

        <BottomNav view={view} go={go} />

        {toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[999] px-4 py-2.5 rounded-full text-white text-sm font-medium shadow-lg" style={{background:C.ink,animation:"pop .25s ease"}}>{toast}</div>}
        {celebrate && (<div className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none"><div className="bg-white rounded-3xl px-8 py-7 text-center shadow-2xl" style={{animation:"pop .3s ease"}}><PartyPopper size={44} color={C.reunited} className="mx-auto"/><p className="mt-2 font-extrabold text-lg">¡Una mascota volvió a casa! 🎉</p><p className="text-sm" style={{color:C.muted}}>Gracias por ser parte de la comunidad.</p></div></div>)}
        {reportFor && <ReportModal post={reportFor} onClose={()=>setReportFor(null)} onSubmit={submitReport} />}
      </div>
    </div>
  );
}

/* ------------------------------- Header ---------------------------------- */
function Header({ go, count, conn }){
  return (
    <div className="sticky top-0 z-[600] px-4 pt-3 pb-3" style={{background:C.bg,borderBottom:`1px solid ${C.line}`}}>
      <div className="flex items-center justify-between">
        <button onClick={()=>go("home")} className="flex items-center gap-2"><div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{background:C.brand}}><PawPrint size={19} color="#fff"/></div><div className="leading-tight text-left"><div className="font-extrabold text-[15px]">Mascotas Posadas</div><div className="text-[10px] font-semibold tracking-wide flex items-center gap-1" style={{color:C.muted}}>MISIONES · AR {conn==="cloud"?<Cloud size={11} color={C.found}/>:<CloudOff size={11} color={C.seen}/>}</div></div></button>
        <div className="flex items-center gap-1.5">
          <button onClick={()=>go("map")} className="relative w-9 h-9 rounded-xl flex items-center justify-center" style={{background:C.surface,border:`1px solid ${C.line}`}}><Bell size={17} color={C.ink}/>{count>0&&<span className="absolute -top-1 -right-1 text-[10px] font-bold text-white rounded-full min-w-[16px] h-[16px] px-1 flex items-center justify-center" style={{background:C.lost}}>{count}</span>}</button>
          <button onClick={()=>go("admin")} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:C.surface,border:`1px solid ${C.line}`}}><Settings2 size={17} color={C.ink}/></button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Home ----------------------------------- */
function HomeView({ posts, go, conn }){
  const lost=posts.filter(p=>p.type==="lost"&&p.status!=="reunited").slice(0,6);
  const found=posts.filter(p=>p.type==="found").slice(0,6);
  const reunited=posts.filter(p=>p.status==="reunited"||p.status==="found").length;
  return (
    <div className="px-4">
      {conn!=="cloud" && (
        <div className="mt-4 rounded-2xl p-3 flex gap-2.5 text-[12px]" style={{background:"#FFF7E6",border:"1px solid #F3E1B5",color:"#7A5B14"}}>
          <CloudOff size={18} className="shrink-0 mt-0.5"/><p><b>Modo local:</b> las publicaciones se guardan solo en este dispositivo. Para que otras personas las vean, configurá Supabase (gratis) — ver <button onClick={()=>go("costs")} className="underline font-bold">Control de costos</button>.</p>
        </div>
      )}
      <div className="mt-4 rounded-3xl p-5 text-white relative overflow-hidden" style={{background:`linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`}}><PawPrint size={130} className="absolute -right-6 -bottom-8 opacity-10"/><h1 className="text-[22px] font-extrabold leading-tight">Juntos podemos<br/>ayudarlos a volver a casa.</h1><p className="text-[13px] mt-1.5 opacity-90">Reportá, buscá y reencontrá mascotas en Posadas.</p></div>
      <div className="grid grid-cols-3 gap-2.5 mt-4"><BigBtn color={C.lost} label="Perdí mi mascota" ico="🔴" onClick={()=>go("new",{type:"lost",edit:null})}/><BigBtn color={C.found} label="Encontré una" ico="🟢" onClick={()=>go("new",{type:"found",edit:null})}/><BigBtn color={C.seen} label="Vi una mascota" ico="🟡" onClick={()=>go("new",{type:"seen",edit:null})}/></div>
      <button onClick={()=>go("search")} className="mt-4 w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-left" style={{background:C.surface,border:`1px solid ${C.line}`,color:C.muted}}><Search size={18}/> <span className="text-sm">Buscar por barrio, nombre, color…</span></button>
      <button onClick={()=>go("map")} className="mt-3 w-full rounded-2xl overflow-hidden text-left relative" style={{border:`1px solid ${C.line}`}}><GeoMap markers={posts.map(p=>({id:p.id,...jit(p),color:TYPE[p.type].dot,post:p}))} height={150}/><div className="absolute bottom-2 left-2 z-[500] bg-white/95 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 pointer-events-none"><MapPin size={13} color={C.brand}/> Ver mapa de Posadas</div></button>
      <StatStrip reunited={reunited} total={posts.length}/>
      <Row title="🔴 Últimas perdidas" posts={lost} go={go}/>
      <Row title="🟢 Últimas encontradas" posts={found} go={go}/>
      <div className="mt-4 grid grid-cols-2 gap-2.5"><QuickCard ico={<Stethoscope size={18}/>} title="Ayuda" sub="Vets y refugios" onClick={()=>go("help")}/><QuickCard ico={<Store size={18}/>} title="Negocios amigos" sub="Comercios locales" onClick={()=>go("business")}/></div>
      <div className="mt-4 mb-2 rounded-2xl p-3.5 flex gap-2.5 text-[12px]" style={{background:"#FFF7E6",border:"1px solid #F3E1B5",color:"#7A5B14"}}><AlertTriangle size={18} className="shrink-0 mt-0.5"/><p>Cuidado con quienes pidan dinero antes de demostrar que tienen a tu mascota. No compartas datos sensibles sin verificar.</p></div>
    </div>
  );
}
function BigBtn({ color, label, ico, onClick }){ return <button onClick={onClick} className="rounded-2xl p-3 text-white text-left flex flex-col justify-between h-[92px] active:scale-95 transition" style={{background:color}}><span className="text-lg">{ico}</span><span className="text-[12px] font-bold leading-tight">{label}</span></button>; }
function QuickCard({ ico, title, sub, onClick }){ return <button onClick={onClick} className="rounded-2xl p-3.5 text-left flex items-center gap-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:C.brandSoft,color:C.brand}}>{ico}</div><div><div className="font-bold text-sm">{title}</div><div className="text-[11px]" style={{color:C.muted}}>{sub}</div></div></button>; }
function StatStrip({ reunited, total }){ const pct=total?Math.round(reunited/total*100):0; return <div className="mt-3 rounded-2xl p-4 flex items-center justify-between" style={{background:C.brandSoft}}><div><div className="text-2xl font-extrabold" style={{color:C.brandDeep}}>{pct}%</div><div className="text-[11px] font-semibold" style={{color:C.brand}}>mascotas recuperadas</div></div><div className="text-right text-[11px]" style={{color:C.brand}}><div className="font-bold text-base">{total}</div>publicaciones activas</div></div>; }
function Row({ title, posts, go }){ if(!posts.length)return null; return <div className="mt-5"><h3 className="font-extrabold text-[15px] mb-2.5">{title}</h3><div className="flex gap-3 overflow-x-auto mp-scroll pb-1 -mx-4 px-4">{posts.map(p=><MiniCard key={p.id} post={p} go={go}/>)}</div></div>; }
function MiniCard({ post, go }){ const t=TYPE[post.type]; return <button onClick={()=>go("detail",{post})} className="shrink-0 w-[140px] rounded-2xl overflow-hidden text-left" style={{background:C.surface,border:`1px solid ${C.line}`}}><Thumb post={post} h={100}/><div className="p-2.5"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:t.dot}}/><span className="text-[10px] font-bold" style={{color:t.dot}}>{t.label}</span></div><div className="font-bold text-sm truncate mt-0.5">{post.petName||`${post.species} ${post.color}`}</div><div className="text-[11px] flex items-center gap-1 truncate" style={{color:C.muted}}><MapPin size={11}/> {post.barrio}</div></div></button>; }
function Thumb({ post, h=110 }){
  return (<div className="relative w-full">
    {post.photo? <img src={post.photo} alt="" style={{height:h}} className="w-full object-cover"/> : <div style={{height:h,background:TYPE[post.type].soft}} className="w-full flex items-center justify-center text-4xl">{post.emoji}</div>}
    {post.demo && <span className="absolute top-1.5 left-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md" style={{background:"rgba(18,33,28,.75)",color:"#fff"}}>DEMO</span>}
  </div>);
}

/* --------------------------------- Mapa ---------------------------------- */
function MapView({ posts, go }){
  const [f,setF]=useState({lost:true,found:true,seen:true,perro:true,gato:true,otro:true});const [sel,setSel]=useState(null);
  const chips=[["lost","🔴 Perdidas"],["found","🟢 Encontradas"],["seen","🟡 Vistas"],["perro","🐕 Perros"],["gato","🐈 Gatos"],["otro","🐾 Otras"]];
  const shown=posts.filter(p=>f[p.type]&&f[p.species]&&p.status!=="reunited");const markers=shown.map(p=>({id:p.id,...jit(p),color:TYPE[p.type].dot,post:p}));
  return (
    <div className="px-4">
      <Title back={()=>go("home")} title="Mapa de Posadas" tag="PARCIAL"/>
      <div className="flex gap-2 overflow-x-auto mp-scroll pb-1 -mx-4 px-4">{chips.map(([k,l])=><Chip key={k} on={f[k]} onClick={()=>setF({...f,[k]:!f[k]})}>{l}</Chip>)}</div>
      <div className="mt-3 relative">
        <GeoMap markers={markers} onMarkerClick={setSel} height={360} locate/>
        {sel&&(<div className="absolute bottom-3 left-3 right-3 z-[500] rounded-2xl p-2.5 flex items-center gap-3 shadow-lg" style={{background:C.surface}}><div className="w-14 h-14 rounded-xl overflow-hidden shrink-0"><Thumb post={sel} h={56}/></div><div className="flex-1 min-w-0"><div className="text-[10px] font-bold" style={{color:TYPE[sel.type].dot}}>{TYPE[sel.type].label}</div><div className="font-bold text-sm truncate">{sel.petName||sel.species}</div><div className="text-[11px] truncate" style={{color:C.muted}}>{sel.barrio} · {sel.date}</div></div><button onClick={()=>go("detail",{post:sel})} className="px-3 py-2 rounded-xl text-xs font-bold text-white shrink-0" style={{background:C.brand}}>Ver</button><button onClick={()=>setSel(null)} className="shrink-0"><X size={16} color={C.muted}/></button></div>)}
      </div>
      <p className="text-[11px] mt-2 flex items-center gap-1.5" style={{color:C.muted}}><ShieldCheck size={13}/> Ubicaciones mostradas de forma aproximada para proteger la privacidad.</p>
      <AlertRadius posts={posts} go={go}/>
    </div>
  );
}
function AlertRadius({ posts, go }){
  const [r,setR]=useState(3);const [me,setMe]=useState(null);
  const locate=()=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>setMe([p.coords.latitude,p.coords.longitude]),()=>setMe(POSADAS_CENTER)):setMe(POSADAS_CENTER);
  const near=me?posts.filter(p=>p.type==="lost"&&p.status!=="reunited"&&p.lat).map(p=>({p,km:haversine(me,[p.lat,p.lng])})).filter(x=>x.km<=r).sort((a,b)=>a.km-b.km):[];
  return (
    <div className="mt-3 rounded-2xl p-4" style={{background:C.surface,border:`1px solid ${C.line}`}}>
      <div className="flex items-center gap-2 font-bold text-sm"><Bell size={16} color={C.brand}/> Alertas por zona <Tag t="PARCIAL"/></div>
      <p className="text-[12px] mt-1" style={{color:C.muted}}>El cálculo por radio ya funciona. El envío push necesita configuración (gratis con FCM, 🟡 pendiente).</p>
      <div className="flex gap-2 mt-3">{[1,3,5,10].map(km=><button key={km} onClick={()=>setR(km)} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{background:r===km?C.brandSoft:C.bg,color:r===km?C.brandDeep:C.muted,border:`1px solid ${r===km?C.brand:C.line}`}}>{km} km</button>)}</div>
      <button onClick={locate} className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2" style={{background:C.brand}}><Navigation size={16}/> Simular alertas cerca mío</button>
      {me&&(<div className="mt-3 space-y-2"><div className="text-[12px] font-bold">{near.length} perdida{near.length!==1?"s":""} a menos de {r} km</div>{near.slice(0,4).map(({p,km})=><button key={p.id} onClick={()=>go("detail",{post:p})} className="w-full flex items-center gap-3 p-2 rounded-xl text-left" style={{background:C.bg}}><div className="w-10 h-10 rounded-lg overflow-hidden shrink-0"><Thumb post={p} h={40}/></div><div className="flex-1 min-w-0"><div className="font-bold text-sm truncate">🐾 {p.petName||p.species} · {p.barrio}</div><div className="text-[11px]" style={{color:C.muted}}>a {km.toFixed(1)} km · {timeAgo(p.createdAt)}</div></div><ChevronRight size={16} color={C.muted}/></button>)}</div>)}
    </div>
  );
}

/* ------------------------------- Buscador -------------------------------- */
function SearchView({ posts, go }){
  const [q,setQ]=useState(""),[type,setType]=useState("all"),[sp,setSp]=useState("all");
  const res=useMemo(()=>{const t=q.trim().toLowerCase();return posts.filter(p=>{if(p.status==="reunited")return false;if(type!=="all"&&p.type!==type)return false;if(sp!=="all"&&p.species!==sp)return false;if(!t)return true;return [p.petName,p.barrio,p.color,p.species,p.sex,p.features,p.place,p.description].join(" ").toLowerCase().includes(t);});},[q,type,sp,posts]);
  return (
    <div className="px-4">
      <Title back={()=>go("home")} title="Buscar mascotas" tag="FUNCIONAL"/>
      <div className="flex items-center gap-2 px-3.5 py-3 rounded-2xl" style={{background:C.surface,border:`1px solid ${C.line}`}}><Search size={18} color={C.muted}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Ej: perros perdidos Villa Cabello" className="flex-1 outline-none text-sm bg-transparent"/>{q&&<button onClick={()=>setQ("")}><X size={16} color={C.muted}/></button>}</div>
      <div className="flex gap-2 mt-3 overflow-x-auto mp-scroll pb-1 -mx-4 px-4">{[["all","Todas"],["lost","🔴 Perdidas"],["found","🟢 Encontradas"],["seen","🟡 Vistas"]].map(([k,l])=><Chip key={k} on={type===k} onClick={()=>setType(k)}>{l}</Chip>)}{[["all","Especie"],["perro","🐕"],["gato","🐈"],["otro","🐾"]].map(([k,l])=><Chip key={"s"+k} on={sp===k} onClick={()=>setSp(k)}>{l}</Chip>)}</div>
      <div className="mt-3 text-[12px] font-semibold" style={{color:C.muted}}>{res.length} resultado{res.length!==1?"s":""}</div>
      <div className="mt-2 grid grid-cols-2 gap-3 mb-2">{res.map(p=><GridCard key={p.id} post={p} go={go}/>)}</div>
      {!res.length&&<Empty text="No hay publicaciones que coincidan. Probá con otros filtros."/>}
    </div>
  );
}
function Chip({ on, onClick, children }){ return <button onClick={onClick} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold" style={{background:on?C.brand:C.surface,color:on?"#fff":C.muted,border:`1px solid ${on?C.brand:C.line}`}}>{children}</button>; }
function GridCard({ post, go }){ const t=TYPE[post.type]; return <button onClick={()=>go("detail",{post})} className="rounded-2xl overflow-hidden text-left" style={{background:C.surface,border:`1px solid ${C.line}`}}><Thumb post={post} h={110}/><div className="p-2.5"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:t.dot}}/><span className="text-[10px] font-bold" style={{color:t.dot}}>{t.label}</span></div><div className="font-bold text-sm truncate mt-0.5">{post.petName||`${post.species} ${post.color}`}</div><div className="text-[11px] flex items-center gap-1 truncate" style={{color:C.muted}}><MapPin size={11}/> {post.barrio}</div></div></button>; }

/* ---------------------------- Auth (login) ------------------------------- */
function AuthGate({ go }){
  return (<div className="px-4"><Title back={()=>go("home")} title="Publicar" tag="PARCIAL"/><div className="rounded-2xl p-6 text-center" style={{background:C.surface,border:`1px solid ${C.line}`}}><CircleUserRound size={40} className="mx-auto" color={C.brand}/><p className="font-bold mt-2">Necesitás una cuenta para publicar</p><p className="text-[13px] mt-1" style={{color:C.muted}}>Así tu publicación queda asociada a vos y podés editarla o marcarla como encontrada.</p><button onClick={()=>go("auth")} className="mt-4 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.brand}}>Ingresar / Registrarme</button></div></div>);
}
function AuthView({ onSignIn, onSignUp, onReset, onGoogle, go }){
  const [mode,setMode]=useState("login");const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [name,setName]=useState("");const [busy,setBusy]=useState(false);
  const submit=async()=>{ if(!email){return;} setBusy(true); if(mode==="login")await onSignIn(email,password); else await onSignUp(email,password,name); setBusy(false); };
  return (
    <div className="px-4">
      <Title back={()=>go("home")} title={mode==="login"?"Ingresar":"Crear cuenta"} tag={CLOUD?"FUNCIONAL":"PARCIAL"}/>
      {!CLOUD && <div className="rounded-2xl p-3 mb-3 text-[12px] flex gap-2" style={{background:"#FFF7E6",border:"1px solid #F3E1B5",color:"#7A5B14"}}><Info size={16} className="shrink-0 mt-0.5"/>Modo local (demo): la sesión se guarda en este dispositivo. Con Supabase configurado, el login es real (email/Google).</div>}
      <div className="flex gap-2 mb-4">{[["login","Ingresar"],["register","Registrarme"]].map(([k,l])=><button key={k} onClick={()=>setMode(k)} className="flex-1 py-2.5 rounded-xl text-sm font-bold" style={{background:mode===k?C.ink:C.surface,color:mode===k?"#fff":C.muted,border:`1px solid ${mode===k?C.ink:C.line}`}}>{l}</button>)}</div>
      <div className="space-y-3">
        {mode==="register"&&<Field label="Nombre"><input value={name} onChange={e=>setName(e.target.value)} className="inp" placeholder="Tu nombre"/></Field>}
        <Field label="Email"><div className="relative"><Mail size={16} color={C.muted} className="absolute left-3 top-1/2 -translate-y-1/2"/><input value={email} onChange={e=>setEmail(e.target.value)} className="inp pl-9" placeholder="vos@email.com" inputMode="email"/></div></Field>
        <Field label="Contraseña"><div className="relative"><KeyRound size={16} color={C.muted} className="absolute left-3 top-1/2 -translate-y-1/2"/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="inp pl-9" placeholder="••••••••"/></div></Field>
      </div>
      <button onClick={submit} disabled={busy} className="mt-4 w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{background:C.brand}}>{busy?<Loader2 size={18} className="animate-spin"/>:<LogIn size={18}/>}{mode==="login"?"Ingresar":"Crear cuenta"}</button>
      {CLOUD && <button onClick={onGoogle} className="mt-2 w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2" style={{background:C.surface,border:`1px solid ${C.line}`}}><span className="font-extrabold" style={{color:"#4285F4"}}>G</span> Continuar con Google</button>}
      {mode==="login"&&<button onClick={()=>email?onReset(email):null} className="mt-3 w-full text-center text-[12px] font-semibold" style={{color:C.brand}}>¿Olvidaste tu contraseña?</button>}
    </div>
  );
}

/* ------------------------------ Publicar --------------------------------- */
function NewView({ type, setType, onSubmit, go, flash, editPost }){
  const editing=!!editPost; const t=TYPE[editing?editPost.type:type];
  const init = editing ? { petName:editPost.petName||"", species:editPost.species||"perro", sex:editPost.sex||"", ageApprox:editPost.ageApprox||"", color:editPost.color||"", features:editPost.features||"", date:editPost.date||new Date().toISOString().slice(0,10), time:editPost.time||"", place:editPost.place||"", barrio:editPost.barrio||BARRIO_LIST[0], description:editPost.description||"", phone:editPost.phone||"", whatsapp:editPost.whatsapp||"", reward:editPost.reward||"" }
    : { petName:"", species:"perro", sex:"", ageApprox:"", color:"", features:"", date:new Date().toISOString().slice(0,10), time:"", place:"", barrio:BARRIO_LIST[0], description:"", phone:"", whatsapp:"", reward:"" };
  const [f,setF]=useState(init);const [photo,setPhoto]=useState(editing?editPost.photo:null);const [coords,setCoords]=useState(editing&&editPost.preciseLocation?{lat:editPost.lat,lng:editPost.lng}:null);const [precise,setPrecise]=useState(editing?!!editPost.preciseLocation:false);const [locMode,setLocMode]=useState("barrio");const [busy,setBusy]=useState(false);const [saving,setSaving]=useState(false);const [done,setDone]=useState(null);const fileRef=useRef();
  const curType=editing?editPost.type:type;const set=(k,v)=>setF(s=>({...s,[k]:v}));
  const onFile=async(e)=>{const file=e.target.files&&e.target.files[0];const err=validateImage(file);if(err){flash(err);return;}setBusy(true);try{setPhoto(await compressImage(file));}catch{flash("No se pudo procesar la imagen.");}setBusy(false);};
  const useGps=()=>{ if(!navigator.geolocation){flash("El navegador no permite geolocalización.");return;} setLocMode("gps"); navigator.geolocation.getCurrentPosition(p=>{setCoords({lat:+p.coords.latitude.toFixed(6),lng:+p.coords.longitude.toFixed(6)});setPrecise(true);flash("Ubicación tomada ✓");},()=>flash("No pudimos obtener tu ubicación.")); };
  const barrioCoords=()=>{const b=BARRIOS[f.barrio]||POSADAS_CENTER;return {lat:b[0],lng:b[1]};};
  const canSubmit=f.color&&f.barrio&&(f.phone||f.whatsapp)&&(curType==="seen"||f.species);
  const submit=async()=>{
    if(!canSubmit){flash("Completá foto, ubicación y contacto.");return;}
    setSaving(true);const c=coords||barrioCoords();
    const fields={ petName:clean(f.petName,40), species:f.species, sex:f.sex, ageApprox:clean(f.ageApprox,20), color:clean(f.color,40), features:clean(f.features,120), date:f.date, time:f.time, place:clean(f.place,80), barrio:f.barrio, description:clean(f.description,400), phone:digits(f.phone), whatsapp:digits(f.whatsapp||f.phone), reward:clean(f.reward,40), lat:c.lat, lng:c.lng, preciseLocation:precise, photo };
    const saved = editing ? await onSubmit({__edit:true,id:editPost.id,fields}) : await onSubmit({...fields,type:curType});
    setSaving(false);
    if(!saved){return;}
    if(editing)go("detail",{post:saved}); else setDone(saved);
  };
  if(done)return <PublishedView post={done} go={go} flash={flash}/>;
  return (
    <div className="px-4 pb-6">
      <Title back={()=>go(editing?"detail":"home",editing?{post:editPost}:undefined)} title={editing?"Editar publicación":"Publicar"} tag="FUNCIONAL"/>
      {!editing&&<div className="grid grid-cols-3 gap-2 mb-4">{Object.entries(TYPE).map(([k,v])=><button key={k} onClick={()=>setType(k)} className="py-2.5 rounded-xl text-xs font-bold" style={{background:type===k?v.dot:C.surface,color:type===k?"#fff":C.muted,border:`1px solid ${type===k?v.dot:C.line}`}}>{v.ico} {v.label}</button>)}</div>}
      <div className="rounded-2xl p-3 mb-4 text-[12px] flex gap-2" style={{background:t.soft,color:C.ink}}><Sparkles size={16} className="shrink-0 mt-0.5" style={{color:t.dot}}/><span>{curType==="found"?"No publiques datos privados que identifiquen al dueño sin verificar primero su identidad.":"Publicá en menos de 2 minutos. Lo esencial: foto, ubicación y contacto."}</span></div>
      <button onClick={()=>fileRef.current&&fileRef.current.click()} className="w-full rounded-2xl mb-2 overflow-hidden flex items-center justify-center" style={{height:170,background:C.surface,border:`1.5px dashed ${C.line}`}}>{busy?<Loader2 className="animate-spin" color={C.brand}/>:photo?<img src={photo} alt="" className="w-full h-full object-cover"/>:<div className="text-center" style={{color:C.muted}}><Camera size={30} className="mx-auto"/><div className="text-sm font-semibold mt-1">Agregar foto</div><div className="text-[11px]">Se comprime automáticamente</div></div>}</button>
      <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden"/>
      <div className="rounded-2xl p-3 mb-4" style={{background:C.surface,border:`1px solid ${C.line}`}}>
        <div className="text-[12px] font-bold mb-2 flex items-center gap-1.5"><MapPinned size={15} color={C.brand}/> Ubicación</div>
        <div className="grid grid-cols-3 gap-2"><LocBtn on={locMode==="gps"} onClick={useGps} ico={<Navigation size={15}/>} label="Mi ubicación"/><LocBtn on={locMode==="pick"} onClick={()=>setLocMode("pick")} ico={<MapPin size={15}/>} label="En el mapa"/><LocBtn on={locMode==="barrio"} onClick={()=>{setLocMode("barrio");setCoords(null);setPrecise(false);}} ico={<ListChecks size={15}/>} label="Barrio/dirección"/></div>
        {locMode==="pick"&&<div className="mt-3"><GeoMap markers={[]} onPick={(lat,lng)=>{setCoords({lat,lng});setPrecise(true);}} picked={coords} height={240} locate/><p className="text-[11px] mt-1.5" style={{color:C.muted}}>Tocá el mapa para marcar dónde fue.</p></div>}
        {coords&&<div className="mt-2 text-[11px] flex items-center gap-1.5" style={{color:C.found}}><Check size={13}/> Coordenadas guardadas ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})</div>}
        <div className="mt-3"><Field label="Barrio *"><select value={f.barrio} onChange={e=>set("barrio",e.target.value)} className="inp">{BARRIO_LIST.map(b=><option key={b}>{b}</option>)}</select></Field></div>
        <div className="mt-2"><Field label={curType==="lost"?"Zona / referencia (visto por última vez)":"Zona / referencia"}><input value={f.place} onChange={e=>set("place",e.target.value)} className="inp" placeholder="Plaza, esquina, referencia…"/></Field></div>
      </div>
      <div className="space-y-3">
        {curType!=="found"&&<Field label="Nombre (si lo sabés)"><input value={f.petName} onChange={e=>set("petName",e.target.value)} className="inp" placeholder="Ej: Rocco"/></Field>}
        <div className="grid grid-cols-2 gap-3"><Field label="Especie *"><select value={f.species} onChange={e=>set("species",e.target.value)} className="inp"><option value="perro">🐕 Perro</option><option value="gato">🐈 Gato</option><option value="otro">🐾 Otro</option></select></Field><Field label="Sexo"><select value={f.sex} onChange={e=>set("sex",e.target.value)} className="inp"><option value="">—</option><option>Macho</option><option>Hembra</option></select></Field></div>
        <div className="grid grid-cols-2 gap-3"><Field label="Color *"><input value={f.color} onChange={e=>set("color",e.target.value)} className="inp" placeholder="Marrón y blanco"/></Field><Field label="Edad aprox."><input value={f.ageApprox} onChange={e=>set("ageApprox",e.target.value)} className="inp" placeholder="2 años"/></Field></div>
        <Field label="Características"><input value={f.features} onChange={e=>set("features",e.target.value)} className="inp" placeholder="Collar rojo, cicatriz, tímido…"/></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Fecha"><input type="date" value={f.date} onChange={e=>set("date",e.target.value)} className="inp"/></Field><Field label="Hora aprox."><input type="time" value={f.time} onChange={e=>set("time",e.target.value)} className="inp"/></Field></div>
        <Field label="Descripción"><textarea value={f.description} onChange={e=>set("description",e.target.value)} rows={3} className="inp" placeholder="Contá lo que pasó…"/></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Teléfono *"><input inputMode="numeric" value={f.phone} onChange={e=>set("phone",e.target.value)} className="inp" placeholder="3764..."/></Field><Field label="WhatsApp"><input inputMode="numeric" value={f.whatsapp} onChange={e=>set("whatsapp",e.target.value)} className="inp" placeholder="igual al teléfono"/></Field></div>
        {curType==="lost"&&<Field label="Recompensa (opcional)"><input value={f.reward} onChange={e=>set("reward",e.target.value)} className="inp" placeholder="Ej: Recompensa"/></Field>}
      </div>
      <button onClick={submit} disabled={saving} className="mt-5 w-full py-3.5 rounded-2xl font-bold text-white text-[15px] flex items-center justify-center gap-2" style={{background:canSubmit?t.dot:C.line}}>{saving&&<Loader2 size={18} className="animate-spin"/>}{editing?"Guardar cambios":"Publicar alerta"}</button>
    </div>
  );
}
function LocBtn({ on, onClick, ico, label }){ return <button onClick={onClick} className="py-2.5 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1" style={{background:on?C.brandSoft:C.bg,color:on?C.brandDeep:C.muted,border:`1px solid ${on?C.brand:C.line}`}}>{ico}{label}</button>; }
function Field({ label, children }){ return <label className="block"><span className="text-[12px] font-semibold" style={{color:C.muted}}>{label}</span><div className="mt-1">{children}</div></label>; }
function PublishedView({ post, go, flash }){
  return (<div className="px-4 pt-8 text-center"><div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{background:C.brandSoft}}><Check size={32} color={C.brand}/></div><h2 className="text-xl font-extrabold mt-3">Tu alerta fue publicada 🎉</h2><p className="text-sm mt-1" style={{color:C.muted}}>Compartila para que llegue a más vecinos.</p><div className="rounded-2xl overflow-hidden mt-5 text-left" style={{background:C.surface,border:`1px solid ${C.line}`}}><Thumb post={post} h={150}/><div className="p-3"><div className="font-bold">{post.petName||post.species}</div><div className="text-[12px]" style={{color:C.muted}}>{post.barrio} · {post.date}</div></div></div><button onClick={()=>go("share",{post})} className="mt-4 w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{background:C.brand}}><Share2 size={18}/> Compartir alerta</button><button onClick={()=>go("detail",{post})} className="mt-2 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.ink}}>Ver publicación</button><button onClick={()=>go("home")} className="mt-2 w-full py-3 rounded-2xl font-bold" style={{background:C.surface,border:`1px solid ${C.line}`}}>Volver al inicio</button></div>);
}

/* -------------------------------- Detalle -------------------------------- */
function DetailView({ post, all, go, setStatus, flash, onReport, user, onDelete }){
  const t=TYPE[post.type],st=STATUS[post.status];
  const owner = !post.demo && user && post.owner_id && post.owner_id===user.id;
  const canManage = owner || isAdmin(user);
  const matches=useMemo(()=>post.type==="lost"?MatchEngine.rank(post,all):[],[post,all]);
  const wa=()=>{const name=post.petName||`una mascota ${t.label.toLowerCase()}`;const msg=`Hola. Vi la publicación de ${name} en Mascotas Posadas. Creo que podría tener información sobre ella.`;window.open(`https://wa.me/${digits(post.whatsapp)}?text=${encodeURIComponent(msg)}`,"_blank");};
  return (
    <div>
      <div className="relative"><Thumb post={post} h={260}/><button onClick={()=>go("home")} className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/95 flex items-center justify-center shadow"><ChevronLeft size={20}/></button><button onClick={()=>go("share",{post})} className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 flex items-center justify-center shadow"><Share2 size={18}/></button><div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full text-white text-xs font-bold" style={{background:t.dot}}>{t.ico} {t.label}</div></div>
      <div className="px-4 -mt-4 relative">
        <div className="rounded-3xl p-4" style={{background:C.surface,border:`1px solid ${C.line}`}}>
          <div className="flex items-start justify-between"><div><h2 className="text-xl font-extrabold">{post.petName||`${post.species} ${post.color}`}</h2><div className="text-[13px] flex items-center gap-1 mt-0.5" style={{color:C.muted}}><MapPin size={13}/> {post.barrio} · {post.place||"Posadas"} <span className="opacity-70">· aprox.</span></div></div><span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{background:st.color}}>{st.label}</span></div>
          <div className="flex gap-1.5 mt-1.5">{post.demo&&<span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{background:"#EEF1F0",color:C.muted}}>DEMO</span>}<span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1" style={{background:C.brandSoft,color:C.brand}}><Clock size={10}/> {timeAgo(post.createdAt)}</span></div>
          <div className="grid grid-cols-2 gap-2.5 mt-4"><Spec label="Especie" v={post.species}/><Spec label="Sexo" v={post.sex||"—"}/><Spec label="Color" v={post.color}/><Spec label="Edad" v={post.ageApprox||"—"}/><Spec label="Fecha" v={post.date}/><Spec label="Hora" v={post.time||"—"}/></div>
          {post.features&&<p className="mt-3 text-sm"><b>Señas:</b> {post.features}</p>}
          {post.description&&<p className="mt-1.5 text-sm" style={{color:C.muted}}>{post.description}</p>}
          {post.reward&&<div className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold" style={{background:"#FFF3D6",color:"#8A6A0F"}}>💰 {post.reward}</div>}
        </div>
        <div className="rounded-2xl p-3.5 mt-3 flex items-center gap-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><Shield size={18} color={C.brand}/><div className="flex-1"><div className="text-[12px] font-bold">Contacto: {post.contactName}</div><div className="text-[11px]" style={{color:C.muted}}>{maskPhone(post.whatsapp)} — protegido</div></div></div>
        <button onClick={wa} className="mt-3 w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{background:C.found}}><Phone size={18}/> Contactar por WhatsApp</button>

        {matches.length>0&&(<div className="mt-4"><div className="flex items-center gap-2 font-extrabold text-sm"><Sparkles size={16} color={C.reunited}/> Posibles coincidencias <Tag t="PARCIAL"/></div><p className="text-[11px] mb-2" style={{color:C.muted}}>Sugerencias por características. No es una identificación segura.</p><div className="space-y-2">{matches.map(({post:p,score,distanceKm,ago})=>(<button key={p.id} onClick={()=>go("detail",{post:p})} className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="w-14 h-14 rounded-xl overflow-hidden shrink-0"><Thumb post={p} h={56}/></div><div className="flex-1 min-w-0"><div className="text-[10px] font-bold" style={{color:TYPE[p.type].dot}}>{TYPE[p.type].ico} Posible coincidencia · {TYPE[p.type].label}</div><div className="font-bold text-sm truncate">{p.petName||p.species} · {p.barrio}</div><div className="text-[11px] flex items-center gap-2" style={{color:C.muted}}>{distanceKm!=null&&<span className="flex items-center gap-0.5"><Ruler size={10}/> {distanceKm.toFixed(1)} km</span>}<span className="flex items-center gap-0.5"><Clock size={10}/> {timeAgo(ago)}</span></div></div><div className="text-right shrink-0"><div className="font-extrabold text-sm" style={{color:C.reunited}}>{score}%</div><div className="text-[9px]" style={{color:C.muted}}>similitud</div></div></button>))}</div></div>)}

        {canManage&&(<div className="mt-4 rounded-2xl p-3.5" style={{background:C.surface,border:`1px solid ${C.line}`}}>
          <div className="text-[12px] font-bold mb-2">Gestionar {owner?"(tu publicación)":"(admin)"}</div>
          <div className="grid grid-cols-2 gap-2 mb-2">{owner&&!post.demo&&<button onClick={()=>go("new",{edit:post})} className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1" style={{background:C.brandSoft,color:C.brandDeep}}><Pencil size={13}/> Editar</button>}<button onClick={()=>{onDelete(post.id);go("home");}} className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1" style={{background:"#FBE7E7",color:C.lost}}><Trash2 size={13}/> Eliminar</button></div>
          <div className="text-[11px] font-semibold mb-1" style={{color:C.muted}}>Cambiar estado</div>
          <div className="grid grid-cols-2 gap-2">{Object.entries(STATUS).map(([k,v])=><button key={k} onClick={()=>setStatus(post,k)} className="py-2 rounded-xl text-xs font-bold" style={{background:post.status===k?v.color:C.bg,color:post.status===k?"#fff":C.muted,border:`1px solid ${post.status===k?v.color:C.line}`}}>{v.label}</button>)}</div>
          {post.recoveredAt&&<div className="mt-2 text-[11px] flex items-center gap-1.5" style={{color:C.found}}><Check size={12}/> Recuperada el {new Date(post.recoveredAt).toLocaleDateString("es-AR")}</div>}
        </div>)}

        <button onClick={onReport} className="mt-3 mb-2 w-full py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5" style={{color:C.muted,border:`1px solid ${C.line}`}}><Flag size={13}/> Reportar publicación</button>
      </div>
    </div>
  );
}
function Spec({ label, v }){ return <div className="rounded-xl px-3 py-2" style={{background:C.bg}}><div className="text-[10px] font-semibold" style={{color:C.muted}}>{label}</div><div className="text-sm font-bold capitalize">{v}</div></div>; }

/* ------------------------- Compartir (tarjeta) --------------------------- */
function ShareView({ post, go, flash }){
  const t=TYPE[post.type];const link=`https://mascotasposadas.ar/p/${post.id}`;
  const text=`${t.ico} ${t.label.toUpperCase()}: ${post.petName||post.species} en ${post.barrio}, Posadas. Si la viste, ayudanos a encontrarla 🐾 ${link}`;
  const share=(net)=>{ if(net==="wa")window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank"); else if(net==="fb")window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`,"_blank"); else if(net==="native"){if(navigator.share)navigator.share({title:"Mascotas Posadas",text,url:link}).catch(()=>{});else{navigator.clipboard&&navigator.clipboard.writeText(text);flash("Copiado.");}} else {navigator.clipboard&&navigator.clipboard.writeText(link);flash("Enlace copiado.");} };
  return (
    <div className="px-4">
      <Title back={()=>go("detail",{post})} title="Compartir alerta" tag="PARCIAL"/>
      <div className="rounded-3xl overflow-hidden" style={{background:C.surface,border:`2px solid ${t.dot}`}}><div className="px-4 py-2.5 text-white font-extrabold text-center" style={{background:t.dot}}>{t.ico} MASCOTA {t.label.toUpperCase()}</div><Thumb post={post} h={220}/><div className="p-4"><div className="text-lg font-extrabold">{post.petName||`${post.species} ${post.color}`}</div><div className="grid grid-cols-2 gap-2 mt-2 text-[13px]"><Info2 label="Especie" v={post.species}/><Info2 label="Zona" v={post.barrio}/><Info2 label="Color" v={post.color}/><Info2 label="Fecha" v={post.date}/></div><p className="mt-3 text-center font-bold text-sm" style={{color:t.dot}}>Si la viste, ayudanos a encontrarla.</p><div className="mt-2 text-center text-[11px] font-extrabold tracking-wide" style={{color:C.brand}}>🐾 MASCOTAS POSADAS</div></div></div>
      <div className="grid grid-cols-4 gap-2 mt-4"><ShareBtn onClick={()=>share("wa")} label="WhatsApp" color={C.found} ico={<Phone size={17}/>}/><ShareBtn onClick={()=>share("fb")} label="Facebook" color="#1877F2" ico={<Share2 size={17}/>}/><ShareBtn onClick={()=>share("copy")} label="Copiar" color={C.brand} ico={<Copy size={17}/>}/><ShareBtn onClick={()=>share("native")} label="Compartir" color={C.ink} ico={<Send size={17}/>}/></div>
      <p className="text-[11px] mt-3" style={{color:C.muted}}><Info size={12} className="inline mr-1"/>El enlace <b>{link}</b> es el destino previsto. Los enlaces profundos funcionan cuando la app esté publicada con dominio (🟡).</p>
    </div>
  );
}
function Info2({ label, v }){ return <div><div className="text-[10px] font-semibold" style={{color:C.muted}}>{label}</div><div className="font-bold capitalize truncate">{v}</div></div>; }
function ShareBtn({ onClick, label, color, ico }){ return <button onClick={onClick} className="py-3 rounded-2xl text-white text-[10px] font-bold flex flex-col items-center gap-1" style={{background:color}}>{ico}{label}</button>; }

/* ------------------------------ Reportar --------------------------------- */
function ReportModal({ post, onClose, onSubmit }){
  const [reason,setReason]=useState(REPORT_REASONS[0]);const [note,setNote]=useState("");
  return (<div className="fixed inset-0 z-[900] flex items-end justify-center" style={{background:"rgba(0,0,0,.4)"}} onClick={onClose}><div className="w-full max-w-[480px] rounded-t-3xl p-5" style={{background:C.surface}} onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between mb-3"><h3 className="font-extrabold text-lg flex items-center gap-2"><Flag size={18} color={C.lost}/> Reportar</h3><button onClick={onClose}><X size={20}/></button></div><p className="text-[12px] mb-3" style={{color:C.muted}}>Reportás: <b>{post.petName||post.species}</b> ({post.barrio})</p><div className="space-y-2">{REPORT_REASONS.map(r=><button key={r} onClick={()=>setReason(r)} className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between" style={{background:reason===r?C.brandSoft:C.bg,border:`1px solid ${reason===r?C.brand:C.line}`}}>{r}{reason===r&&<Check size={16} color={C.brand}/>}</button>)}</div><textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} className="inp mt-3" placeholder="Detalle opcional…"/><button onClick={()=>onSubmit(post,reason,note)} className="mt-3 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.lost}}>Enviar reporte</button></div></div>);
}

/* --------------------------------- Ayuda --------------------------------- */
function HelpView({ go }){
  return (<div className="px-4"><Title back={()=>go("home")} title="🏥 Ayuda" tag="DEMO"/><p className="text-[13px] mb-3" style={{color:C.muted}}>Veterinarias, refugios y protectoras de Posadas.</p><div className="space-y-3 mb-2">{VETS.map((v,i)=>(<div key={i} className="rounded-2xl p-3.5 flex items-center gap-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:C.brandSoft,color:C.brand}}><Stethoscope size={20}/></div><div className="flex-1 min-w-0"><div className="font-bold text-sm flex items-center gap-1.5">{v.name} {v.emerg&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:C.lost}}>24h</span>}</div><div className="text-[11px]" style={{color:C.muted}}>{v.kind} · {v.barrio} · {v.hours}</div></div><a href={`https://wa.me/${digits(v.phone)}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{background:C.found}}><Phone size={16}/></a></div>))}</div></div>);
}

/* ------------------------------- Negocios -------------------------------- */
function BusinessView({ go }){
  const tiers=[{name:"Gratuito",price:"$0",color:C.muted,feats:["Ficha básica en Ayuda","1 foto","Contacto por WhatsApp"]},{name:"Destacado",price:"$$",color:C.brand,feats:["Aparece primero en su zona","Galería de fotos","Etiqueta destacada","Estadísticas de contactos"]},{name:"Premium",price:"$$$",color:C.reunited,feats:["Banner en el inicio","Alertas patrocinadas","Perfil completo + web","Soporte prioritario"]}];
  return (<div className="px-4"><Title back={()=>go("home")} title="Negocios amigos" tag="PENDIENTE"/><p className="text-[13px] mb-3" style={{color:C.muted}}>Veterinarias, pet shops, peluquerías y más pueden sumarse. Los pagos se integran después (🔴 no activar aún).</p><div className="space-y-3 mb-2">{tiers.map(t=>(<div key={t.name} className="rounded-2xl p-4" style={{background:C.surface,border:`1.5px solid ${t.color}`}}><div className="flex items-center justify-between"><div className="font-extrabold" style={{color:t.color}}>{t.name}</div><div className="font-bold">{t.price}</div></div><ul className="mt-2 space-y-1">{t.feats.map(f=><li key={f} className="text-[12px] flex items-center gap-1.5"><Check size={14} color={t.color}/> {f}</li>)}</ul><button className="mt-3 w-full py-2 rounded-xl text-xs font-bold" style={{background:C.bg,color:C.muted,border:`1px solid ${C.line}`}}>Sumar mi negocio (próximamente)</button></div>))}</div></div>);
}

/* --------------------------- Control de costos --------------------------- */
function CostsView({ go, conn }){
  const rows=[
    { s:"Supabase (base + login + fotos)", c:"$0", lim:"Free: 500 MB base · 1 GB fotos · 50.000 usuarios/mes · 5 GB tráfico · 2 proyectos. Se pausa tras 7 días sin uso.", card:"No", ok:true },
    { s:"OpenStreetMap (tiles del mapa)", c:"$0", lim:"Uso razonable según su Tile Usage Policy. VERIFICAR en operations.osmfoundation.org.", card:"No", ok:true },
    { s:"Leaflet (librería del mapa)", c:"$0", lim:"Librería libre / open source.", card:"No", ok:true },
    { s:"Hosting (Cloudflare Pages o Netlify)", c:"$0", lim:"Free tier. VERIFICAR EN LA CUENTA. Vercel Hobby es gratis pero solo uso personal/no comercial.", card:"No", ok:true },
    { s:"Login con Google (opcional)", c:"$0", lim:"Requiere configurar OAuth en Google Cloud (gratis).", card:"No", ok:true },
    { s:"Dominio", c:"$0", lim:"Usás el subdominio gratuito del hosting (.pages.dev / .netlify.app).", card:"No", ok:true },
    { s:"Notificaciones push (FCM)", c:"$0", lim:"🟡 PENDIENTE — gratis pero requiere configuración adicional.", card:"No", ok:false },
    { s:"IA visual (coincidencia por foto)", c:"—", lim:"🔴 REQUIERE SERVICIO PAGO — no activar en esta etapa.", card:"—", ok:false },
    { s:"Pagos de negocios", c:"—", lim:"🔴 No implementar todavía.", card:"—", ok:false },
  ];
  return (
    <div className="px-4">
      <Title back={()=>go("home")} title="💰 Control de costos" tag={conn==="cloud"?"FUNCIONAL":"PARCIAL"}/>
      <div className="rounded-2xl p-4 text-center mb-3" style={{background:C.brandSoft}}><div className="text-3xl font-extrabold" style={{color:C.brandDeep}}>$0 / mes</div><div className="text-[12px] font-semibold" style={{color:C.brand}}>costo de infraestructura en esta etapa</div></div>
      <div className="space-y-2 mb-2">{rows.map((r,i)=>(<div key={i} className="rounded-2xl p-3" style={{background:C.surface,border:`1px solid ${r.ok?C.line:"#F3E1B5"}`}}><div className="flex items-center justify-between"><div className="font-bold text-sm flex-1">{r.s}</div><div className="font-extrabold text-sm" style={{color:r.ok?C.found:C.seen}}>{r.c}</div></div><div className="text-[11px] mt-1" style={{color:C.muted}}>{r.lim}</div><div className="text-[10px] mt-1 font-semibold" style={{color:C.muted}}>¿Requiere tarjeta? <b style={{color:r.card==="No"?C.found:C.muted}}>{r.card}</b></div></div>))}</div>
      <div className="rounded-2xl p-3.5 text-[12px] flex gap-2 mb-2" style={{background:"#FFF7E6",border:"1px solid #F3E1B5",color:"#7A5B14"}}><AlertTriangle size={16} className="shrink-0 mt-0.5"/><p>No registres tarjeta ni actives pruebas premium. Ningún servicio de arriba lo requiere para el plan gratuito. Confirmá siempre los límites en la cuenta del servicio.</p></div>
    </div>
  );
}

/* -------------------------------- Perfil --------------------------------- */
function ProfileView({ posts, go, user, conn, onSignOut, onUpdateName }){
  const mine=posts.filter(p=>!p.demo&&user&&p.owner_id===user.id);
  const found=posts.filter(p=>p.status==="reunited"||p.status==="found").length;
  const [editName,setEditName]=useState(false);const [name,setName]=useState(user?user.name:"");
  return (
    <div className="px-4">
      <Title back={()=>go("home")} title="Mi perfil" tag={conn==="cloud"?"FUNCIONAL":"PARCIAL"}/>
      <div className="rounded-2xl p-3 mb-3 flex items-center gap-2 text-[12px]" style={{background:conn==="cloud"?C.brandSoft:"#FFF7E6",border:`1px solid ${conn==="cloud"?C.brand:"#F3E1B5"}`}}>{conn==="cloud"?<Cloud size={16} color={C.brand}/>:<CloudOff size={16} color={C.seen}/>}<span style={{color:conn==="cloud"?C.brandDeep:"#7A5B14"}}>{conn==="cloud"?"Nube conectada · las publicaciones se comparten entre todos.":"Modo local · configurá Supabase para compartir entre dispositivos."}</span></div>
      {user?(
        <>
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:`linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`}}><div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white"><User size={26}/></div><div className="text-white flex-1"><div className="font-extrabold">{user.name}</div><div className="text-[12px] opacity-90">{user.email}</div></div></div>
          {editName?(<div className="mt-2 flex gap-2"><input value={name} onChange={e=>setName(e.target.value)} className="inp" placeholder="Tu nombre"/><button onClick={()=>{onUpdateName(name);setEditName(false);}} className="px-4 rounded-xl font-bold text-white" style={{background:C.brand}}>OK</button></div>):(<button onClick={()=>{setName(user.name);setEditName(true);}} className="mt-2 w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2" style={{background:C.surface,border:`1px solid ${C.line}`}}><Pencil size={14}/> Editar nombre</button>)}
          <div className="grid grid-cols-3 gap-2.5 mt-3"><Stat n={mine.length} l="Publicadas"/><Stat n={found} l="Reunidas"/><Stat n={0} l="Alertas"/></div>
          <h3 className="font-extrabold text-sm mt-5 mb-2">Mis publicaciones</h3>
          {mine.length===0?<Empty text="Todavía no publicaste nada. Tocá el botón + para empezar."/>:<div className="grid grid-cols-2 gap-3">{mine.map(p=><GridCard key={p.id} post={p} go={go}/>)}</div>}
          <button onClick={()=>go("costs")} className="mt-4 w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2" style={{background:C.surface,border:`1px solid ${C.line}`}}><Wallet size={16} color={C.brand}/> Control de costos</button>
          <button onClick={onSignOut} className="mt-2 mb-2 w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2" style={{color:C.lost,border:`1px solid ${C.line}`}}><LogOut size={16}/> Cerrar sesión</button>
        </>
      ):(
        <div className="rounded-2xl p-6 text-center" style={{background:C.surface,border:`1px solid ${C.line}`}}><CircleUserRound size={40} className="mx-auto" color={C.brand}/><p className="font-bold mt-2">Ingresá a tu cuenta</p><p className="text-[13px] mt-1" style={{color:C.muted}}>Para publicar, editar y seguir tus mascotas.</p><button onClick={()=>go("auth")} className="mt-4 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.brand}}>Ingresar / Registrarme</button><button onClick={()=>go("costs")} className="mt-2 w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2" style={{background:C.bg,border:`1px solid ${C.line}`}}><Wallet size={16} color={C.brand}/> Control de costos</button></div>
      )}
    </div>
  );
}
function Stat({ n, l }){ return <div className="rounded-2xl py-3 text-center" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="text-xl font-extrabold" style={{color:C.brand}}>{n}</div><div className="text-[10px] font-semibold" style={{color:C.muted}}>{l}</div></div>; }

/* ---------------------------- Administración ----------------------------- */
function AdminLocked({ go }){ return <div className="px-4"><Title back={()=>go("home")} title="Administración" tag="FUNCIONAL"/><div className="rounded-2xl p-6 text-center" style={{background:C.surface,border:`1px solid ${C.line}`}}><Shield size={38} className="mx-auto" color={C.brand}/><p className="font-bold mt-2">Solo administradores</p><p className="text-[13px] mt-1" style={{color:C.muted}}>Ingresá con un email de la lista ADMIN_EMAILS para acceder.</p><button onClick={()=>go("auth")} className="mt-4 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.brand}}>Ingresar</button></div></div>; }
function AdminView({ posts, reports, approve, removePost, go, clearReport, conn }){
  const [tab,setTab]=useState("stats");const [fBarrio,setFBarrio]=useState("all"),[fStatus,setFStatus]=useState("all"),[fSp,setFSp]=useState("all");
  const real=posts;const total=real.length;const lost=real.filter(p=>p.type==="lost").length;const found=real.filter(p=>p.type==="found").length;const seen=real.filter(p=>p.type==="seen").length;const reunited=real.filter(p=>p.status==="reunited").length;const recovered=real.filter(p=>p.status==="reunited"||p.status==="found").length;const pct=total?Math.round(recovered/total*100):0;
  const byBarrio=BARRIO_LIST.map(b=>({b,n:real.filter(p=>p.barrio===b).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n).slice(0,8);const maxB=Math.max(1,...byBarrio.map(x=>x.n));
  const repB=BARRIO_LIST.map(b=>({b,n:reports.filter(r=>r.barrio===b).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n).slice(0,5);
  const filtered=posts.filter(p=>(fBarrio==="all"||p.barrio===fBarrio)&&(fStatus==="all"||p.status===fStatus)&&(fSp==="all"||p.species===fSp));
  return (
    <div className="px-4">
      <Title back={()=>go("home")} title="Panel administrador" tag="FUNCIONAL"/>
      {conn!=="cloud"&&<div className="rounded-2xl p-2.5 mb-2 text-[11px] flex items-center gap-1.5" style={{background:"#FFF7E6",border:"1px solid #F3E1B5",color:"#7A5B14"}}><CloudOff size={13}/> Modo local: la moderación afecta solo este dispositivo.</div>}
      <div className="flex gap-2 mb-3 overflow-x-auto mp-scroll -mx-4 px-4">{[["stats","Estadísticas"],["mod","Moderación"],["reports",`Reportes${reports.length?` (${reports.length})`:""}`],["estado","Estado"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold" style={{background:tab===k?C.ink:C.surface,color:tab===k?"#fff":C.muted,border:`1px solid ${tab===k?C.ink:C.line}`}}>{l}</button>)}</div>

      {tab==="stats"&&(<div className="space-y-3 mb-2"><div className="rounded-2xl p-4 text-center" style={{background:`linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`,color:"#fff"}}><div className="text-4xl font-extrabold">{pct}%</div><div className="text-[12px] font-semibold opacity-90">porcentaje de recuperación</div></div><div className="grid grid-cols-2 gap-2.5"><Kpi n={total} l="Total publicaciones" c={C.ink}/><Kpi n={reunited} l="Reunidas con familia" c={C.reunited}/><Kpi n={lost} l="Perdidas" c={C.lost}/><Kpi n={found} l="Encontradas" c={C.found}/><Kpi n={seen} l="Vistas" c={C.seen}/><Kpi n={reports.length} l="Reportes" c={C.muted}/></div><div className="rounded-2xl p-4" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="font-bold text-sm mb-3">Publicaciones por barrio</div><Bars data={byBarrio} max={maxB} color={C.brand}/></div>{repB.length>0&&<div className="rounded-2xl p-4" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="font-bold text-sm mb-3">Barrios con más reportes</div><Bars data={repB} max={Math.max(1,...repB.map(x=>x.n))} color={C.lost}/></div>}</div>)}

      {tab==="mod"&&(<div className="mb-2"><div className="flex gap-2 mb-3 overflow-x-auto mp-scroll -mx-4 px-4"><Sel value={fBarrio} onChange={setFBarrio} options={[["all","Barrio"],...BARRIO_LIST.map(b=>[b,b])]}/><Sel value={fStatus} onChange={setFStatus} options={[["all","Estado"],...Object.entries(STATUS).map(([k,v])=>[k,v.label])]}/><Sel value={fSp} onChange={setFSp} options={[["all","Especie"],["perro","Perro"],["gato","Gato"],["otro","Otro"]]}/></div><div className="text-[12px] font-semibold mb-2" style={{color:C.muted}}>{filtered.length} publicación{filtered.length!==1?"es":""}</div><div className="space-y-2.5">{filtered.map(p=>(<div key={p.id} className="rounded-2xl p-2.5 flex items-center gap-2.5" style={{background:C.surface,border:`1px solid ${p.reported?C.lost:C.line}`,opacity:p.approved===false?0.55:1}}><div className="w-11 h-11 rounded-xl overflow-hidden shrink-0"><Thumb post={p} h={44}/></div><button onClick={()=>go("detail",{post:p})} className="flex-1 min-w-0 text-left"><div className="text-[10px] font-bold" style={{color:TYPE[p.type].dot}}>{TYPE[p.type].label} · {STATUS[p.status].label}{p.demo?" · DEMO":""}{p.reported?" · ⚠":""}</div><div className="font-bold text-sm truncate">{p.petName||p.species} · {p.barrio}</div></button><div className="flex gap-1.5 shrink-0"><button onClick={()=>approve(p.id,p.approved===false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:p.approved===false?C.found:C.bg}}>{p.approved===false?<Check size={15} color="#fff"/>:<EyeOff size={15} color={C.muted}/>}</button><button onClick={()=>removePost(p.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"#FBE7E7"}}><Trash2 size={15} color={C.lost}/></button></div></div>))}</div></div>)}

      {tab==="reports"&&(<div className="space-y-2.5 mb-2">{reports.length===0?<Empty text="No hay reportes pendientes."/>:reports.map(r=>(<div key={r.id} className="rounded-2xl p-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="flex items-center justify-between"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:C.lost}}>{r.reason}</span><span className="text-[10px]" style={{color:C.muted}}>{timeAgo(r.date)}</span></div><div className="font-bold text-sm mt-1.5">{r.postName} · {r.barrio}</div>{r.note&&<div className="text-[12px] mt-0.5" style={{color:C.muted}}>{r.note}</div>}<div className="flex gap-2 mt-2"><button onClick={()=>{const p=posts.find(x=>x.id===r.postId);if(p)go("detail",{post:p});}} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{background:C.bg,border:`1px solid ${C.line}`}}>Ver</button><button onClick={()=>clearReport(r.id)} className="flex-1 py-2 rounded-xl text-xs font-bold text-white" style={{background:C.found}}>Resolver</button><button onClick={()=>removePost(r.postId)} className="py-2 px-3 rounded-xl text-xs font-bold" style={{background:"#FBE7E7",color:C.lost}}><Ban size={14}/></button></div></div>))}</div>)}

      {tab==="estado"&&<AuditPanel conn={conn}/>}
    </div>
  );
}
function Sel({ value, onChange, options }){ return <select value={value} onChange={e=>onChange(e.target.value)} className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold" style={{background:C.surface,border:`1px solid ${C.line}`,color:C.ink}}>{options.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>; }
function Bars({ data, max, color }){ return <div className="space-y-2">{data.map(x=><div key={x.b} className="flex items-center gap-2"><div className="w-24 text-[11px] truncate" style={{color:C.muted}}>{x.b}</div><div className="flex-1 h-3 rounded-full overflow-hidden" style={{background:C.bg}}><div style={{width:`${x.n/max*100}%`,background:color,height:"100%"}}/></div><div className="w-5 text-right text-[11px] font-bold">{x.n}</div></div>)}</div>; }
function Kpi({ n, l, c }){ return <div className="rounded-2xl p-3.5" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="text-2xl font-extrabold" style={{color:c}}>{n}</div><div className="text-[11px] font-semibold" style={{color:C.muted}}>{l}</div></div>; }
function AuditPanel({ conn }){
  const green=["Publicar (perdida/encontrada/vista) + foto comprimida","Buscador y filtros","Mapa real (Leaflet+OSM) con respaldo","Coincidencias por características + distancia + tiempo","WhatsApp con mensaje automático","Compartir (WhatsApp/Facebook/Copiar/Nativo)","Estados + fecha de recuperación","Moderación por categorías + reportes","Login/registro/logout/editar perfil","Editar y borrar la propia publicación","Alertas por radio (1/3/5/10 km)","Control de costos ($0)"];
  const yellow=["Multiusuario real: FUNCIONA al configurar Supabase (URL+key) y publicar en hosting","Tiles del mapa: dependen del entorno/hosting","Enlaces profundos para compartir (necesitan dominio)","Notificaciones push (FCM, gratis, requiere configurar)"];
  const red=["IA visual de fotos — REQUIERE SERVICIO PAGO (interfaz lista en MatchEngine.visionHook)","Pagos de negocios — no implementar"];
  const Block=({t,items,c})=><div className="rounded-2xl p-3.5 mb-2.5" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="font-extrabold text-sm mb-2" style={{color:c}}>{t}</div><ul className="space-y-1">{items.map(i=><li key={i} className="text-[12px] flex gap-1.5"><span style={{color:c}}>•</span> {i}</li>)}</ul></div>;
  return (<div className="mb-2"><div className="rounded-2xl p-3 mb-2.5 text-[12px] flex items-center gap-2" style={{background:conn==="cloud"?C.brandSoft:"#FFF7E6",border:`1px solid ${conn==="cloud"?C.brand:"#F3E1B5"}`}}>{conn==="cloud"?<Cloud size={16} color={C.brand}/>:<CloudOff size={16} color={C.seen}/>}<b style={{color:conn==="cloud"?C.brandDeep:"#7A5B14"}}>Modo actual: {conn==="cloud"?"NUBE (multiusuario)":"LOCAL (este dispositivo)"}</b></div><Block t="🟢 Funcional" items={green} c={C.found}/><Block t="🟡 Parcial" items={yellow} c={C.seen}/><Block t="🔴 Requiere pago / no activar" items={red} c={C.lost}/></div>);
}

/* ------------------------------ Bottom nav ------------------------------- */
function BottomNav({ view, go }){
  const items=[["home",Home,"Inicio"],["map",MapPin,"Mapa"],["__new",null,""],["search",Search,"Buscar"],["profile",User,"Perfil"]];
  return (<div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[600] px-4 pb-3 pt-2" style={{background:"linear-gradient(to top, "+C.bg+" 70%, transparent)"}}><div className="rounded-2xl flex items-center justify-between px-2 py-1.5 shadow-lg" style={{background:C.surface,border:`1px solid ${C.line}`}}>{items.map(([k,Ico,l])=>k==="__new"?(<button key={k} onClick={()=>go("new",{type:"lost",edit:null})} className="w-12 h-12 rounded-2xl flex items-center justify-center -mt-6 shadow-lg" style={{background:C.brand}}><Plus size={24} color="#fff"/></button>):(<button key={k} onClick={()=>go(k)} className="flex-1 flex flex-col items-center gap-0.5 py-1.5"><Ico size={20} color={view===k?C.brand:C.muted}/><span className="text-[10px] font-semibold" style={{color:view===k?C.brand:C.muted}}>{l}</span></button>))}</div></div>);
}

/* ------------------------------- Helpers UI ------------------------------ */
function Title({ back, title, tag }){ return <div className="flex items-center gap-3 mt-4 mb-3">{back&&<button onClick={back} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:C.surface,border:`1px solid ${C.line}`}}><ChevronLeft size={19}/></button>}<h2 className="text-lg font-extrabold flex-1">{title}</h2>{tag&&<Tag t={tag}/>}</div>; }
function Tag({ t }){ const m={FUNCIONAL:C.found,PARCIAL:C.seen,PENDIENTE:C.muted,DEMO:C.brand}; return <span className="text-[9px] font-extrabold px-2 py-1 rounded-full" style={{background:(m[t]||C.muted)+"22",color:m[t]||C.muted}}>{t}</span>; }
function Empty({ text }){ return <div className="rounded-2xl p-8 text-center text-sm" style={{background:C.surface,border:`1px dashed ${C.line}`,color:C.muted}}><PawPrint className="mx-auto mb-2 opacity-40"/> {text}</div>; }

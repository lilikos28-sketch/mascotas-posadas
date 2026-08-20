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
const MISIONES_CENTER = [-26.8, -54.7]; // centro aproximado de la provincia
const MISIONES_ZOOM = 8; // muestra toda la provincia

/* ------------------------------ Barrios ---------------------------------- */
// Localidades de toda la provincia de Misiones (con coordenadas y código postal)
const ZONAS = {
  "Posadas":[-27.3621,-55.8981,"3300"],
  "Garupá":[-27.4667,-55.8167,"3304"],
  "Candelaria":[-27.4560,-55.7440,"3313"],
  "Santa Ana":[-27.3720,-55.5790,"3312"],
  "Oberá":[-27.4871,-55.1199,"3360"],
  "Eldorado":[-26.4009,-54.6156,"3380"],
  "Puerto Iguazú":[-25.5972,-54.5786,"3370"],
  "Apóstoles":[-27.9130,-55.7570,"3350"],
  "Leandro N. Alem":[-27.6010,-55.3260,"3315"],
  "San Vicente":[-26.9970,-54.4880,"3364"],
  "Puerto Rico":[-26.7940,-55.0270,"3334"],
  "Montecarlo":[-26.5670,-54.7590,"3384"],
  "Jardín América":[-27.0430,-55.2280,"3332"],
  "Aristóbulo del Valle":[-27.0950,-54.8990,"3363"],
  "San Pedro":[-26.6220,-54.1080,"3352"],
  "Wanda":[-25.9700,-54.5670,"3376"],
  "Puerto Esperanza":[-26.0190,-54.6120,"3378"],
  "Campo Grande":[-27.2130,-54.9750,"3319"],
  "Dos de Mayo":[-27.0270,-54.6790,"3364"],
  "Cerro Azul":[-27.6360,-55.4970,"3314"],
  "San Javier":[-27.8720,-55.1330,"3357"],
  "Concepción de la Sierra":[-27.9820,-55.5220,"3354"],
  "Bernardo de Irigoyen":[-26.2560,-53.6470,"3372"],
  "Comandante Andresito":[-25.6000,-53.9500,"3374"],
  "25 de Mayo":[-27.3720,-54.7420,"3367"],
  "Alba Posse":[-27.5450,-54.8180,"3365"],
  "Otra localidad":[-27.3621,-55.8981,""],
};
const ZONA_LIST = Object.keys(ZONAS);
const zonaCP = (nombre)=>{ const z=ZONAS[nombre]; return z&&z[2]?z[2]:""; };
const fmtLegajo = (p)=> p&&p.legajo ? "#"+String(p.legajo).padStart(4,"0") : "";
const ubicTxt = (p)=>{ if(!p)return "Misiones"; const z=p.zona||"Posadas"; const b=(z==="Posadas"&&p.barrio)?`${p.barrio}, `:""; return `${b}${z}`; };

// Barrios de Posadas (se ofrecen solo cuando la zona elegida es Posadas)
const BARRIOS = {
  "Centro":[-27.3621,-55.8981],"Bajada Vieja":[-27.3585,-55.8930],"Villa Sarita":[-27.3705,-55.9075],
  "Villa Urquiza":[-27.3760,-55.8925],"Villa Blosset":[-27.3820,-55.9010],"Villa Cabello":[-27.3925,-55.9330],
  "Miguel Lanús":[-27.3800,-55.9450],"Itaembé Miní":[-27.4050,-55.9600],"Itaembé Guazú":[-27.4250,-55.9250],
  "San Isidro":[-27.3730,-55.8760],"Chacra 32-33":[-27.3980,-55.8850],"El Palomar":[-27.3880,-55.9080],
  "Los Paraísos":[-27.4010,-55.9150],"Fátima":[-27.4090,-55.8950],"Nemesio Parma":[-27.3900,-55.8650],
  "Villa Lanús":[-27.3690,-55.9180],"San Lorenzo":[-27.3950,-55.8550],"Villa Poujade":[-27.4150,-55.9050],
};
const BARRIO_LIST = Object.keys(BARRIOS);
// Compat: para el mapa y estadísticas, todas las zonas conocidas
const LUGARES_COORD = { ...BARRIOS };
Object.entries(ZONAS).forEach(([k,v])=>{ LUGARES_COORD[k]=[v[0],v[1]]; });
const coordDe = (nombre)=> LUGARES_COORD[nombre] || ZONAS["Posadas"].slice(0,2);
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
const KEYS = { posts:"mp:posts:v4", reports:"mp:reports:v4", session:"mp:session:v4", lugares:"mp:lugares:v1", mensajes:"mp:mensajes:v1", mascotas:"mp:mascotas:v1", avist:"mp:avist:v1" };
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
const toRow = (p)=>({ owner_id:p.owner_id??null, type:p.type, status:p.status, pet_name:p.petName, species:p.species, sex:p.sex, age_approx:p.ageApprox, color:p.color, features:p.features, date:p.date, time:p.time, place:p.place, zona:p.zona, barrio:p.barrio, cp:p.cp, description:p.description, photo:p.photo, contact_name:p.contactName, phone:p.phone, whatsapp:p.whatsapp, reward:p.reward, lat:p.lat, lng:p.lng, precise_location:p.preciseLocation, recovered_at:p.recoveredAt, approved:p.approved, reported:p.reported, city:p.city });
const fromRow = (r)=>({ id:r.id, legajo:r.legajo, owner_id:r.owner_id, type:r.type, status:r.status, petName:r.pet_name, species:r.species, sex:r.sex, ageApprox:r.age_approx, color:r.color, features:r.features, date:r.date, time:r.time, place:r.place, zona:r.zona, barrio:r.barrio, cp:r.cp, description:r.description, photo:r.photo, contactName:r.contact_name, phone:r.phone, whatsapp:r.whatsapp, reward:r.reward, lat:r.lat, lng:r.lng, preciseLocation:r.precise_location, recoveredAt:r.recovered_at, createdAt:r.created_at, approved:r.approved, reported:r.reported, city:r.city, demo:false, emoji:EMO[r.species]||"🐾" });
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
function GeoMap({ markers=[], center=POSADAS_CENTER, zoom=13, onMarkerClick, onPick, picked, height=340, locate=false, fitToMarkers=false }){
  const status=useLeaflet();const elRef=useRef(),mapRef=useRef(),layerRef=useRef(),pickRef=useRef(),meRef=useRef();const [tileError,setTileError]=useState(false);
  useEffect(()=>{ if(status!=="ready"||!elRef.current||mapRef.current)return;const L=window.L;const map=L.map(elRef.current,{zoomControl:true}).setView(center,zoom);
    const tiles=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"© OpenStreetMap"});let e=0;tiles.on("tileerror",()=>{if(++e>4)setTileError(true);});tiles.addTo(map);
    layerRef.current=L.layerGroup().addTo(map);if(onPick)map.on("click",(ev)=>onPick(+ev.latlng.lat.toFixed(6),+ev.latlng.lng.toFixed(6)));mapRef.current=map;const t=setTimeout(()=>map.invalidateSize(),250);
    return ()=>{clearTimeout(t);map.remove();mapRef.current=null;}; },[status]);
  useEffect(()=>{ if(status!=="ready"||!layerRef.current)return;const L=window.L;layerRef.current.clearLayers();markers.forEach(m=>{const icon=L.divIcon({className:"mp-pin",html:`<span style="display:block;width:18px;height:18px;border-radius:50%;background:${m.color};border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45)"></span>`,iconSize:[18,18],iconAnchor:[9,9]});const mk=L.marker([m.lat,m.lng],{icon}).addTo(layerRef.current);if(onMarkerClick)mk.on("click",()=>onMarkerClick(m.post));});
    if(fitToMarkers&&markers.length>0&&mapRef.current){ try{ const b=L.latLngBounds(markers.map(m=>[m.lat,m.lng])); mapRef.current.fitBounds(b.pad(0.2),{maxZoom:13}); }catch(e){} } },[markers,status]);
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
export default function App(){
  const [realPosts,setRealPosts]=useState([]);
  const [demoPosts,setDemoPosts]=useState(DEMO_POSTS);
  const [reports,setReports]=useState([]);
  const [mensajes,setMensajes]=useState([]);
  const [lugares,setLugares]=useState([]);
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
  const [misMascotas,setMisMascotas]=useState([]);
  const [avistamientos,setAvistamientos]=useState([]);
  const [qrMascota,setQrMascota]=useState(null); // mascota abierta desde un QR

  const posts = useMemo(()=>[...realPosts,...demoPosts],[realPosts,demoPosts]);
  const flash=(m)=>{setToast(m);setTimeout(()=>setToast(null),2600);};
  const go=(v,extra)=>{ if(extra&&extra.post)setCurrent(extra.post); if(extra&&extra.type)setNewType(extra.type); if(extra&&"edit" in extra)setEditPost(extra.edit); setView(v); if(typeof window!=="undefined")window.scrollTo(0,0); };

  const loadReal = async ()=>{
    if(CLOUD){ try{ const c=await getClient(); if(!c){setConn("error");await loadLocal();return;} const {data,error}=await c.from("publicaciones").select("*").order("created_at",{ascending:false}); if(error)throw error; setRealPosts((data||[]).map(fromRow)); const rr=await c.from("reportes").select("*").order("created_at",{ascending:false}); setReports(((rr.data)||[]).map(r=>({id:r.id,postId:r.post_id,reason:r.reason,note:r.note,date:r.created_at,postName:r.post_name,barrio:r.barrio})));
      try{ const lm=await c.from("lugares").select("*").order("created_at",{ascending:false}); setLugares((lm.data)||[]); }catch{}
      try{ const mm=await c.from("mensajes").select("*").order("created_at",{ascending:false}); setMensajes((mm.data)||[]); }catch{}
      setConn("cloud"); }catch{ setConn("error"); await loadLocal(); } }
    else { setConn("local"); await loadLocal(); }
  };
  const loadLocal = async ()=>{ setRealPosts(await Local.get(KEYS.posts,[])); setReports(await Local.get(KEYS.reports,[])); setLugares(await Local.get(KEYS.lugares,[])); setMensajes(await Local.get(KEYS.mensajes,[])); };

  useEffect(()=>{ (async()=>{ setUser(await Auth.current()); await loadReal(); await loadMascotas(); setReady(true);
    if(CLOUD){ const c=await getClient(); if(c&&c.auth&&c.auth.onAuthStateChange){ c.auth.onAuthStateChange((_e,session)=>setUser(mapUser(session&&session.user))); } }
    // ¿Se abrió desde un QR? La URL trae ?m=CODIGO
    try{ const params=new URLSearchParams(window.location.search); const code=params.get("m"); if(code){ await abrirMascotaPorCodigo(code); } }catch{}
  })(); },[]);

  const loadMascotas = async ()=>{
    if(CLOUD){ try{ const c=await getClient(); if(!c)return;
      try{ const {data}=await c.from("mascotas").select("*").order("created_at",{ascending:false}); setMisMascotas(data||[]); }catch{}
      try{ const {data}=await c.from("avistamientos").select("*").order("created_at",{ascending:false}); setAvistamientos(data||[]); }catch{}
    }catch{} }
    else { setMisMascotas(await Local.get(KEYS.mascotas,[])); setAvistamientos(await Local.get(KEYS.avist,[])); }
  };

  const abrirMascotaPorCodigo = async (code)=>{
    if(CLOUD){ try{ const c=await getClient(); const {data}=await c.from("mascotas").select("*").eq("codigo",code).single(); if(data){ setQrMascota(data); setView("mascota_publica"); return; } }catch{} }
    const locales=await Local.get(KEYS.mascotas,[]); const m=locales.find(x=>x.codigo===code); if(m){ setQrMascota(m); setView("mascota_publica"); }
  };

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

  /* ---- Mensajes de contacto (buzón privado del admin) ---- */
  const enviarMensaje=async(m)=>{
    const rec={ nombre:clean(m.nombre,60), contacto:clean(m.contacto,60), tipo:m.tipo, mensaje:clean(m.mensaje,600) };
    if(conn==="cloud"){ try{ const c=await getClient(); const {error}=await c.from("mensajes").insert(rec); if(error)throw error; return true; }catch{ flash("No se pudo enviar. Reintentá."); return false; } }
    const full={...rec,id:Date.now(),created_at:new Date().toISOString()}; const nm=[full,...mensajes]; setMensajes(nm); Local.set(KEYS.mensajes,nm); return true;
  };
  const borrarMensaje=async(id)=>{ if(conn==="cloud"){try{const c=await getClient();await c.from("mensajes").delete().eq("id",id);}catch{}} const nm=mensajes.filter(x=>x.id!==id); setMensajes(nm); if(conn!=="cloud")Local.set(KEYS.mensajes,nm); };

  /* ---- Lugares (vets/refugios/negocios) administrados por vos ---- */
  const guardarLugar=async(l)=>{
    const rec={ kind:l.kind, name:clean(l.name,80), barrio:l.barrio||"", address:clean(l.address,120), phone:digits(l.phone), whatsapp:digits(l.whatsapp||l.phone), hours:clean(l.hours,60), emerg:!!l.emerg, tier:l.tier||"gratuito", approved:true };
    if(conn==="cloud"){ try{ const c=await getClient();
        if(l.id){ const {data,error}=await c.from("lugares").update(rec).eq("id",l.id).select().single(); if(error)throw error; setLugares(prev=>prev.map(x=>x.id===l.id?data:x)); }
        else { const {data,error}=await c.from("lugares").insert(rec).select().single(); if(error)throw error; setLugares(prev=>[data,...prev]); }
        flash("Guardado ✓"); return true;
      }catch{ flash("No se pudo guardar el lugar."); return false; } }
    if(l.id){ const nl=lugares.map(x=>x.id===l.id?{...x,...rec}:x); setLugares(nl); Local.set(KEYS.lugares,nl); }
    else { const full={...rec,id:Date.now(),created_at:new Date().toISOString()}; const nl=[full,...lugares]; setLugares(nl); Local.set(KEYS.lugares,nl); }
    flash("Guardado ✓"); return true;
  };
  const borrarLugar=async(id)=>{ if(conn==="cloud"){try{const c=await getClient();await c.from("lugares").delete().eq("id",id);}catch{}} const nl=lugares.filter(x=>x.id!==id); setLugares(nl); if(conn!=="cloud")Local.set(KEYS.lugares,nl); flash("Lugar eliminado."); };

  /* ---- Registro de mascotas + QR ---- */
  const genCodigo=()=>{ const s="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let r=""; for(let i=0;i<7;i++)r+=s[Math.floor(Math.random()*s.length)]; return r; };
  const registrarMascota=async(m)=>{
    const codigo=m.codigo||genCodigo();
    const rec={ owner_id:user?user.id:null, codigo, pet_name:clean(m.petName,40), species:m.species, sex:m.sex||"", color:clean(m.color,40), features:clean(m.features,200), zona:m.zona||"", phone:digits(m.phone), whatsapp:digits(m.whatsapp||m.phone), photo:m.photo, notas:clean(m.notas,200) };
    if(conn==="cloud"){ try{ const c=await getClient(); let photo=rec.photo; if(photo&&photo.startsWith("data:"))photo=await uploadPhoto(c,photo); const guardado={...rec,photo}; const {error}=await c.from("mascotas").insert(guardado); if(error)throw error; const full={...guardado,id:Date.now(),created_at:new Date().toISOString()}; setMisMascotas(prev=>[full,...prev]); return full; }catch(e){ flash("No se pudo registrar la mascota."); return null; } }
    const full={...rec,id:Date.now(),created_at:new Date().toISOString()}; const nm=[full,...misMascotas]; setMisMascotas(nm); Local.set(KEYS.mascotas,nm); return full;
  };
  const borrarMascota=async(id)=>{ if(conn==="cloud"){try{const c=await getClient();await c.from("mascotas").delete().eq("id",id);}catch{}} const nm=misMascotas.filter(x=>x.id!==id); setMisMascotas(nm); if(conn!=="cloud")Local.set(KEYS.mascotas,nm); };

  const reportarAvistamiento=async(mascota,a)=>{
    const rec={ mascota_id:mascota.id, mascota_codigo:mascota.codigo, mascota_nombre:mascota.pet_name||mascota.petName, owner_id:mascota.owner_id||null, quien:clean(a.quien,60), contacto:clean(a.contacto,60), zona:clean(a.zona,60), nota:clean(a.nota,400) };
    if(conn==="cloud"){ try{ const c=await getClient(); const {error}=await c.from("avistamientos").insert(rec); if(error)throw error; return true; }catch{ flash("No se pudo enviar el aviso."); return false; } }
    const full={...rec,id:Date.now(),created_at:new Date().toISOString()}; const na=[full,...avistamientos]; setAvistamientos(na); Local.set(KEYS.avist,na); return true;
  };
  const borrarAvistamiento=async(id)=>{ if(conn==="cloud"){try{const c=await getClient();await c.from("avistamientos").delete().eq("id",id);}catch{}} const na=avistamientos.filter(x=>x.id!==id); setAvistamientos(na); if(conn!=="cloud")Local.set(KEYS.avist,na); };

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
        {view==="help"    && <HelpView go={go} lugares={lugares} />}
        {view==="business"&& <BusinessView go={go} />}
        {view==="contacto"&& <ContactoView go={go} onSend={enviarMensaje} />}
        {view==="registrar_mascota"&& (requireAuthToPublish ? <AuthGate go={go} /> : <RegistrarMascotaView go={go} onSave={async(f)=>{ const m=await registrarMascota(f); if(m){ setQrMascota(m); } return m; }} flash={flash} />)}
        {view==="mis_mascotas"&& <MisMascotasView go={go} mascotas={misMascotas.filter(m=>!user||m.owner_id===user.id||m.owner_id==null)} user={user} onDelete={borrarMascota} avistamientos={avistamientos} setQr={setQrMascota} irQr={(m)=>{setQrMascota(m);go("qr_mascota");}} />}
        {view==="qr_mascota"&& (qrMascota ? <QRMascotaView go={go} mascota={qrMascota} flash={flash} /> : <VistaVacia go={go} texto="No se encontró la mascota. Volvé a Mis mascotas." />)}
        {view==="mascota_publica"&& (qrMascota ? <MascotaPublicaView go={go} mascota={qrMascota} onReport={reportarAvistamiento} flash={flash} /> : <VistaVacia go={go} texto="No se encontró esta mascota." />)}
        {view==="auth"    && <AuthView onSignIn={onSignIn} onSignUp={onSignUp} onReset={onReset} onGoogle={Auth.google} go={go} />}
        {view==="costs"   && <CostsView go={go} conn={conn} />}
        {view==="profile" && <ProfileView posts={posts} go={go} user={user} conn={conn} onSignOut={onSignOut} onUpdateName={onUpdateName} />}
        {view==="admin"   && (isAdmin(user) ? <AdminView posts={posts} reports={reports} approve={approve} removePost={removePost} go={go} clearReport={clearReport} conn={conn} mensajes={mensajes} borrarMensaje={borrarMensaje} lugares={lugares} guardarLugar={guardarLugar} borrarLugar={borrarLugar} avistamientos={avistamientos} borrarAvistamiento={borrarAvistamiento} /> : <AdminLocked go={go} />)}

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
        <button onClick={()=>go("home")} className="flex items-center gap-2"><div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{background:C.brand}}><PawPrint size={19} color="#fff"/></div><div className="leading-tight text-left"><div className="font-extrabold text-[15px]">Mascotas Perdidas Misiones</div><div className="text-[10px] font-semibold tracking-wide flex items-center gap-1" style={{color:C.muted}}>MISIONES · AR {conn==="cloud"?<Cloud size={11} color={C.found}/>:<CloudOff size={11} color={C.seen}/>}</div></div></button>
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
      <div className="mt-4 rounded-3xl p-5 text-white relative overflow-hidden" style={{background:`linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`}}><PawPrint size={130} className="absolute -right-6 -bottom-8 opacity-10"/><h1 className="text-[22px] font-extrabold leading-tight">Juntos podemos<br/>ayudarlos a volver a casa.</h1><p className="text-[13px] mt-1.5 opacity-90">Reportá, buscá y reencontrá mascotas en Misiones.</p></div>
      <div className="grid grid-cols-3 gap-2.5 mt-4"><BigBtn color={C.lost} label="Perdí mi mascota" sub="Se escapó o no aparece" ico="🔴" onClick={()=>go("new",{type:"lost",edit:null})}/><BigBtn color={C.found} label="Encontré una" sub="La tengo conmigo" ico="🟢" onClick={()=>go("new",{type:"found",edit:null})}/><BigBtn color={C.seen} label="Vi una mascota" sub="La vi en la calle" ico="🟡" onClick={()=>go("new",{type:"seen",edit:null})}/></div>
      <button onClick={()=>go("search")} className="mt-4 w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl text-left" style={{background:C.surface,border:`1px solid ${C.line}`,color:C.muted}}><Search size={18}/> <span className="text-sm">Buscar por barrio, nombre, color…</span></button>
      <button onClick={()=>go("map")} className="mt-3 w-full rounded-2xl overflow-hidden text-left relative" style={{border:`1px solid ${C.line}`}}><GeoMap markers={posts.map(p=>({id:p.id,...jit(p),color:TYPE[p.type].dot,post:p}))} height={150}/><div className="absolute bottom-2 left-2 z-[500] bg-white/95 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1 pointer-events-none"><MapPin size={13} color={C.brand}/> Ver mapa de Misiones</div></button>
      <StatStrip reunited={reunited} total={posts.length}/>
      <Row title="🔴 Últimas perdidas" posts={lost} go={go}/>
      <Row title="🟢 Últimas encontradas" posts={found} go={go}/>
      {/* Botones "Ayuda" y "Negocios amigos" ocultos temporalmente (a pedido). Para reactivarlos, quitar el comentario de abajo.
      <div className="mt-4 grid grid-cols-2 gap-2.5"><QuickCard ico={<Stethoscope size={18}/>} title="Ayuda" sub="Vets y refugios" onClick={()=>go("help")}/><QuickCard ico={<Store size={18}/>} title="Negocios amigos" sub="Comercios locales" onClick={()=>go("business")}/></div>
      */}
      <button onClick={()=>go("contacto")} className="mt-4 w-full rounded-2xl p-3.5 text-left flex items-center gap-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:C.brandSoft,color:C.brand}}><Mail size={18}/></div><div className="flex-1"><div className="font-bold text-sm">Contacto</div><div className="text-[11px]" style={{color:C.muted}}>Publicitá con nosotros, sumá tu refugio o enviá una sugerencia</div></div><ChevronRight size={16} color={C.muted}/></button>

      <button onClick={()=>go("registrar_mascota")} className="mt-2.5 w-full rounded-2xl p-4 text-left flex items-center gap-3 text-white relative overflow-hidden" style={{background:`linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`}}><div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:"rgba(255,255,255,.2)"}}><ShieldCheck size={20}/></div><div className="flex-1"><div className="font-extrabold text-sm">Registrá tu mascota 🐾</div><div className="text-[11px] opacity-90">Creá su ficha con QR para el collar. Si se pierde, quien la encuentre te avisa al instante.</div></div><ChevronRight size={16} className="opacity-80"/></button>
      <button onClick={()=>go("mis_mascotas")} className="mt-2 w-full text-center text-[12px] font-bold py-1" style={{color:C.brand}}>Ver mis mascotas registradas →</button>
      <div className="mt-4 mb-2 rounded-2xl p-3.5 flex gap-2.5 text-[12px]" style={{background:"#FFF7E6",border:"1px solid #F3E1B5",color:"#7A5B14"}}><AlertTriangle size={18} className="shrink-0 mt-0.5"/><p>Cuidado con quienes pidan dinero antes de demostrar que tienen a tu mascota. No compartas datos sensibles sin verificar.</p></div>
    </div>
  );
}
function BigBtn({ color, label, sub, ico, onClick }){ return <button onClick={onClick} className="rounded-2xl p-3 text-white text-left flex flex-col justify-between h-[104px] active:scale-95 transition" style={{background:color}}><span className="text-lg">{ico}</span><span><span className="text-[12px] font-bold leading-tight block">{label}</span>{sub&&<span className="text-[9px] opacity-90 leading-tight block mt-0.5">{sub}</span>}</span></button>; }
function QuickCard({ ico, title, sub, onClick }){ return <button onClick={onClick} className="rounded-2xl p-3.5 text-left flex items-center gap-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:C.brandSoft,color:C.brand}}>{ico}</div><div><div className="font-bold text-sm">{title}</div><div className="text-[11px]" style={{color:C.muted}}>{sub}</div></div></button>; }
function StatStrip({ reunited, total }){ const pct=total?Math.round(reunited/total*100):0; return <div className="mt-3 rounded-2xl p-4 flex items-center justify-between" style={{background:C.brandSoft}}><div><div className="text-2xl font-extrabold" style={{color:C.brandDeep}}>{pct}%</div><div className="text-[11px] font-semibold" style={{color:C.brand}}>mascotas recuperadas</div></div><div className="text-right text-[11px]" style={{color:C.brand}}><div className="font-bold text-base">{total}</div>publicaciones activas</div></div>; }
function Row({ title, posts, go }){ if(!posts.length)return null; return <div className="mt-5"><h3 className="font-extrabold text-[15px] mb-2.5">{title}</h3><div className="flex gap-3 overflow-x-auto mp-scroll pb-1 -mx-4 px-4">{posts.map(p=><MiniCard key={p.id} post={p} go={go}/>)}</div></div>; }
function MiniCard({ post, go }){ const t=TYPE[post.type]; return <button onClick={()=>go("detail",{post})} className="shrink-0 w-[140px] rounded-2xl overflow-hidden text-left" style={{background:C.surface,border:`1px solid ${C.line}`}}><Thumb post={post} h={100}/><div className="p-2.5"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:t.dot}}/><span className="text-[10px] font-bold" style={{color:t.dot}}>{t.label}</span></div><div className="font-bold text-sm truncate mt-0.5">{post.petName||`${post.species} ${post.color}`}</div><div className="text-[11px] flex items-center gap-1 truncate" style={{color:C.muted}}><MapPin size={11}/> {ubicTxt(post)}</div></div></button>; }
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
      <Title back={()=>go("home")} title="Mapa de Misiones" tag="FUNCIONAL"/>
      <div className="flex gap-2 overflow-x-auto mp-scroll pb-1 -mx-4 px-4">{chips.map(([k,l])=><Chip key={k} on={f[k]} onClick={()=>setF({...f,[k]:!f[k]})}>{l}</Chip>)}</div>
      <div className="mt-3 relative">
        <GeoMap markers={markers} onMarkerClick={setSel} height={360} locate center={MISIONES_CENTER} zoom={MISIONES_ZOOM} fitToMarkers/>
        {sel&&(<div className="absolute bottom-3 left-3 right-3 z-[500] rounded-2xl p-2.5 flex items-center gap-3 shadow-lg" style={{background:C.surface}}><div className="w-14 h-14 rounded-xl overflow-hidden shrink-0"><Thumb post={sel} h={56}/></div><div className="flex-1 min-w-0"><div className="text-[10px] font-bold" style={{color:TYPE[sel.type].dot}}>{TYPE[sel.type].label}</div><div className="font-bold text-sm truncate">{sel.petName||sel.species}</div><div className="text-[11px] truncate" style={{color:C.muted}}>{ubicTxt(sel)} · {sel.date}</div></div><button onClick={()=>go("detail",{post:sel})} className="px-3 py-2 rounded-xl text-xs font-bold text-white shrink-0" style={{background:C.brand}}>Ver</button><button onClick={()=>setSel(null)} className="shrink-0"><X size={16} color={C.muted}/></button></div>)}
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
      {me&&(<div className="mt-3 space-y-2"><div className="text-[12px] font-bold">{near.length} perdida{near.length!==1?"s":""} a menos de {r} km</div>{near.slice(0,4).map(({p,km})=><button key={p.id} onClick={()=>go("detail",{post:p})} className="w-full flex items-center gap-3 p-2 rounded-xl text-left" style={{background:C.bg}}><div className="w-10 h-10 rounded-lg overflow-hidden shrink-0"><Thumb post={p} h={40}/></div><div className="flex-1 min-w-0"><div className="font-bold text-sm truncate">🐾 {p.petName||p.species} · {ubicTxt(p)}</div><div className="text-[11px]" style={{color:C.muted}}>a {km.toFixed(1)} km · {timeAgo(p.createdAt)}</div></div><ChevronRight size={16} color={C.muted}/></button>)}</div>)}
    </div>
  );
}

/* ------------------------------- Buscador -------------------------------- */
function SearchView({ posts, go }){
  const [q,setQ]=useState(""),[type,setType]=useState("all"),[sp,setSp]=useState("all");
  const res=useMemo(()=>{const t=q.trim().toLowerCase();return posts.filter(p=>{if(p.status==="reunited")return false;if(type!=="all"&&p.type!==type)return false;if(sp!=="all"&&p.species!==sp)return false;if(!t)return true;return [p.petName,p.barrio,p.zona,p.cp,p.color,p.species,p.sex,p.features,p.place,p.description].join(" ").toLowerCase().includes(t);});},[q,type,sp,posts]);
  return (
    <div className="px-4">
      <Title back={()=>go("home")} title="Buscar mascotas" tag="FUNCIONAL"/>
      <div className="flex items-center gap-2 px-3.5 py-3 rounded-2xl" style={{background:C.surface,border:`1px solid ${C.line}`}}><Search size={18} color={C.muted}/><input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscá por nombre, barrio, localidad o código postal" className="flex-1 outline-none text-sm bg-transparent"/>{q&&<button onClick={()=>setQ("")}><X size={16} color={C.muted}/></button>}</div>
      <div className="flex gap-2 mt-3 overflow-x-auto mp-scroll pb-1 -mx-4 px-4">{[["all","Todas"],["lost","🔴 Perdidas"],["found","🟢 Encontradas"],["seen","🟡 Vistas"]].map(([k,l])=><Chip key={k} on={type===k} onClick={()=>setType(k)}>{l}</Chip>)}{[["all","Especie"],["perro","🐕"],["gato","🐈"],["otro","🐾"]].map(([k,l])=><Chip key={"s"+k} on={sp===k} onClick={()=>setSp(k)}>{l}</Chip>)}</div>
      <div className="mt-3 text-[12px] font-semibold" style={{color:C.muted}}>{res.length} resultado{res.length!==1?"s":""}</div>
      <div className="mt-2 grid grid-cols-2 gap-3 mb-2">{res.map(p=><GridCard key={p.id} post={p} go={go}/>)}</div>
      {!res.length&&<Empty text="No hay publicaciones que coincidan. Probá con otros filtros."/>}
    </div>
  );
}
function Chip({ on, onClick, children }){ return <button onClick={onClick} className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold" style={{background:on?C.brand:C.surface,color:on?"#fff":C.muted,border:`1px solid ${on?C.brand:C.line}`}}>{children}</button>; }
function GridCard({ post, go }){ const t=TYPE[post.type]; return <button onClick={()=>go("detail",{post})} className="rounded-2xl overflow-hidden text-left" style={{background:C.surface,border:`1px solid ${C.line}`}}><Thumb post={post} h={110}/><div className="p-2.5"><div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background:t.dot}}/><span className="text-[10px] font-bold" style={{color:t.dot}}>{t.label}</span></div><div className="font-bold text-sm truncate mt-0.5">{post.petName||`${post.species} ${post.color}`}</div><div className="text-[11px] flex items-center gap-1 truncate" style={{color:C.muted}}><MapPin size={11}/> {ubicTxt(post)}</div></div></button>; }

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
      {/* Botón "Continuar con Google" quitado: requiere configuración adicional en Supabase (Google Cloud). Reactivar cuando esté configurado el proveedor. */}
      {mode==="login"&&<button onClick={()=>email?onReset(email):null} className="mt-3 w-full text-center text-[12px] font-semibold" style={{color:C.brand}}>¿Olvidaste tu contraseña?</button>}
    </div>
  );
}

/* ------------------------------ Publicar --------------------------------- */
function NewView({ type, setType, onSubmit, go, flash, editPost }){
  const editing=!!editPost; const t=TYPE[editing?editPost.type:type];
  const init = editing ? { petName:editPost.petName||"", species:editPost.species||"perro", sex:editPost.sex||"", ageApprox:editPost.ageApprox||"", color:editPost.color||"", features:editPost.features||"", date:editPost.date||new Date().toISOString().slice(0,10), time:editPost.time||"", place:editPost.place||"", zona:editPost.zona||"Posadas", barrio:editPost.barrio||"", cp:editPost.cp||"", description:editPost.description||"", phone:editPost.phone||"", whatsapp:editPost.whatsapp||"", reward:editPost.reward||"" }
    : { petName:"", species:"perro", sex:"", ageApprox:"", color:"", features:"", date:new Date().toISOString().slice(0,10), time:"", place:"", zona:"Posadas", barrio:"", cp:"3300", description:"", phone:"", whatsapp:"", reward:"" };
  const [f,setF]=useState(init);const [photo,setPhoto]=useState(editing?editPost.photo:null);const [coords,setCoords]=useState(editing&&editPost.preciseLocation?{lat:editPost.lat,lng:editPost.lng}:null);const [precise,setPrecise]=useState(editing?!!editPost.preciseLocation:false);const [locMode,setLocMode]=useState("barrio");const [busy,setBusy]=useState(false);const [saving,setSaving]=useState(false);const [done,setDone]=useState(null);const fileRef=useRef();
  const curType=editing?editPost.type:type;const set=(k,v)=>setF(s=>({...s,[k]:v}));
  const onFile=async(e)=>{const file=e.target.files&&e.target.files[0];const err=validateImage(file);if(err){flash(err);return;}setBusy(true);try{setPhoto(await compressImage(file));}catch{flash("No se pudo procesar la imagen.");}setBusy(false);};
  const useGps=()=>{ if(!navigator.geolocation){flash("El navegador no permite geolocalización.");return;} setLocMode("gps"); navigator.geolocation.getCurrentPosition(p=>{setCoords({lat:+p.coords.latitude.toFixed(6),lng:+p.coords.longitude.toFixed(6)});setPrecise(true);flash("Ubicación tomada ✓");},()=>flash("No pudimos obtener tu ubicación.")); };
  const barrioCoords=()=>{ if(f.zona==="Posadas"&&f.barrio&&BARRIOS[f.barrio]){const b=BARRIOS[f.barrio];return {lat:b[0],lng:b[1]};} const z=coordDe(f.zona);return {lat:z[0],lng:z[1]}; };
  const canSubmit=f.color&&f.zona&&(f.phone||f.whatsapp)&&(curType==="seen"||f.species);
  const submit=async()=>{
    if(!canSubmit){flash("Completá foto, ubicación y contacto.");return;}
    setSaving(true);const c=coords||barrioCoords();
    const fields={ petName:clean(f.petName,40), species:f.species, sex:f.sex, ageApprox:clean(f.ageApprox,20), color:clean(f.color,40), features:clean(f.features,120), date:f.date, time:f.time, place:clean(f.place,80), zona:f.zona, barrio:f.barrio, cp:clean(f.cp,10), description:clean(f.description,400), phone:digits(f.phone), whatsapp:digits(f.whatsapp||f.phone), reward:clean(f.reward,40), lat:c.lat, lng:c.lng, preciseLocation:precise, photo };
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
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Localidad *"><select value={f.zona} onChange={e=>{const z=e.target.value; set("zona",z); set("cp",zonaCP(z)); if(z!=="Posadas")set("barrio","");}} className="inp">{ZONA_LIST.map(z=><option key={z}>{z}</option>)}</select></Field>
          <Field label="Código postal"><input value={f.cp} onChange={e=>set("cp",e.target.value)} className="inp" placeholder="Ej: 3300" inputMode="numeric"/></Field>
        </div>
        {f.zona==="Posadas" && <div className="mt-3"><Field label="Barrio (opcional)"><select value={f.barrio} onChange={e=>set("barrio",e.target.value)} className="inp"><option value="">— Elegir barrio —</option>{BARRIO_LIST.map(b=><option key={b}>{b}</option>)}</select></Field></div>}
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
  return (<div className="px-4 pt-8 text-center"><div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{background:C.brandSoft}}><Check size={32} color={C.brand}/></div><h2 className="text-xl font-extrabold mt-3">Tu alerta fue publicada 🎉</h2><p className="text-sm mt-1" style={{color:C.muted}}>Compartila para que llegue a más vecinos.</p><div className="rounded-2xl overflow-hidden mt-5 text-left" style={{background:C.surface,border:`1px solid ${C.line}`}}><Thumb post={post} h={150}/><div className="p-3"><div className="font-bold">{post.petName||post.species}</div><div className="text-[12px]" style={{color:C.muted}}>{ubicTxt(post)} · {post.date}</div></div></div><button onClick={()=>go("share",{post})} className="mt-4 w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{background:C.brand}}><Share2 size={18}/> Compartir alerta</button><button onClick={()=>go("detail",{post})} className="mt-2 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.ink}}>Ver publicación</button><button onClick={()=>go("home")} className="mt-2 w-full py-3 rounded-2xl font-bold" style={{background:C.surface,border:`1px solid ${C.line}`}}>Volver al inicio</button></div>);
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
          <div className="flex items-start justify-between"><div>{fmtLegajo(post)&&<div className="text-[11px] font-extrabold mb-0.5" style={{color:C.brand}}>Legajo {fmtLegajo(post)}</div>}<h2 className="text-xl font-extrabold">{post.petName||`${post.species} ${post.color}`}</h2><div className="text-[13px] flex items-center gap-1 mt-0.5" style={{color:C.muted}}><MapPin size={13}/> {ubicTxt(post)}{post.cp?` (CP ${post.cp})`:""} <span className="opacity-70">· aprox.</span></div></div><span className="px-2.5 py-1 rounded-full text-[11px] font-bold text-white" style={{background:st.color}}>{st.label}</span></div>
          <div className="flex gap-1.5 mt-1.5">{post.demo&&<span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{background:"#EEF1F0",color:C.muted}}>DEMO</span>}<span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1" style={{background:C.brandSoft,color:C.brand}}><Clock size={10}/> {timeAgo(post.createdAt)}</span></div>
          <div className="grid grid-cols-2 gap-2.5 mt-4"><Spec label="Especie" v={post.species}/><Spec label="Sexo" v={post.sex||"—"}/><Spec label="Color" v={post.color}/><Spec label="Edad" v={post.ageApprox||"—"}/><Spec label="Fecha" v={post.date}/><Spec label="Hora" v={post.time||"—"}/></div>
          {post.features&&<p className="mt-3 text-sm"><b>Señas:</b> {post.features}</p>}
          {post.description&&<p className="mt-1.5 text-sm" style={{color:C.muted}}>{post.description}</p>}
          {post.reward&&<div className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold" style={{background:"#FFF3D6",color:"#8A6A0F"}}>💰 {post.reward}</div>}
        </div>
        <div className="rounded-2xl p-3.5 mt-3 flex items-center gap-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><Shield size={18} color={C.brand}/><div className="flex-1"><div className="text-[12px] font-bold">Contacto: {post.contactName}</div><div className="text-[11px]" style={{color:C.muted}}>{maskPhone(post.whatsapp)} — protegido</div></div></div>
        <button onClick={wa} className="mt-3 w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{background:C.found}}><Phone size={18}/> Contactar por WhatsApp</button>

        {matches.length>0&&(<div className="mt-4"><div className="flex items-center gap-2 font-extrabold text-sm"><Sparkles size={16} color={C.reunited}/> Posibles coincidencias <Tag t="PARCIAL"/></div><p className="text-[11px] mb-2" style={{color:C.muted}}>Sugerencias por características. No es una identificación segura.</p><div className="space-y-2">{matches.map(({post:p,score,distanceKm,ago})=>(<button key={p.id} onClick={()=>go("detail",{post:p})} className="w-full flex items-center gap-3 p-2.5 rounded-2xl text-left" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="w-14 h-14 rounded-xl overflow-hidden shrink-0"><Thumb post={p} h={56}/></div><div className="flex-1 min-w-0"><div className="text-[10px] font-bold" style={{color:TYPE[p.type].dot}}>{TYPE[p.type].ico} Posible coincidencia · {TYPE[p.type].label}</div><div className="font-bold text-sm truncate">{p.petName||p.species} · {ubicTxt(p)}</div><div className="text-[11px] flex items-center gap-2" style={{color:C.muted}}>{distanceKm!=null&&<span className="flex items-center gap-0.5"><Ruler size={10}/> {distanceKm.toFixed(1)} km</span>}<span className="flex items-center gap-0.5"><Clock size={10}/> {timeAgo(ago)}</span></div></div><div className="text-right shrink-0"><div className="font-extrabold text-sm" style={{color:C.reunited}}>{score}%</div><div className="text-[9px]" style={{color:C.muted}}>similitud</div></div></button>))}</div></div>)}

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
/* Genera el afiche "SE BUSCA" como imagen (canvas) y lo comparte o descarga */
async function generarAfiche(post){
  const W=1080, H=1350, dpr=1;
  const cv=document.createElement("canvas"); cv.width=W; cv.height=H;
  const x=cv.getContext("2d");
  const col = post.type==="lost"?"#E23B3B":post.type==="found"?"#159A5A":"#E19A0C";
  const label = post.type==="lost"?"MASCOTA PERDIDA":post.type==="found"?"MASCOTA ENCONTRADA":"MASCOTA VISTA";
  const titulo = post.type==="lost"?"SE BUSCA":post.type==="found"?"¿ES TUYO?":"¿LA VISTE?";
  const contactoTxt = post.type==="lost"?"Si la viste, comunicate:":post.type==="found"?"¿Es tu mascota? Comunicate:":"Si sabés de quién es, comunicate:";
  // Fondo
  x.fillStyle="#FFFFFF"; x.fillRect(0,0,W,H);
  x.strokeStyle=col; x.lineWidth=10; x.strokeRect(24,24,W-48,H-48);
  // Encabezado
  x.fillStyle=col; x.fillRect(24,24,W-48,150);
  x.fillStyle="#FFFFFF"; x.textAlign="center"; x.font="800 78px sans-serif";
  x.fillText(titulo,W/2,120);
  x.font="600 34px sans-serif"; x.fillText(label,W/2,160);
  // Foto
  const boxY=200,boxH=560;
  const drawResto=()=>{
    if(post.legajo){ x.fillStyle=col; x.textAlign="center"; x.font="700 32px sans-serif"; x.fillText("Legajo "+fmtLegajo(post),W/2,boxY+boxH+42); }
    x.fillStyle="#12211C"; x.textAlign="center"; x.font="800 72px sans-serif";
    x.fillText((post.petName||post.species||"").toUpperCase(),W/2,boxY+boxH+108);
    const rows=[["Especie",(post.species||"")+(post.sex?" · "+post.sex:"")],["Color",post.color||"-"],["Zona",ubicTxt(post)],["Fecha",post.date||"-"]];
    if(post.features)rows.push(["Señas",post.features]);
    let ry=boxY+boxH+168;
    x.font="400 36px sans-serif";
    rows.forEach(([k,v])=>{
      x.textAlign="left"; x.fillStyle="#5F726B"; x.font="700 36px sans-serif"; x.fillText(k+":",90,ry);
      x.textAlign="right"; x.fillStyle="#12211C"; x.font="400 36px sans-serif";
      let val=String(v); if(val.length>26)val=val.slice(0,25)+"…";
      x.fillText(val,W-90,ry); ry+=58;
    });
    // Contacto
    const cy=H-230;
    x.fillStyle="#159A5A"; x.beginPath(); x.roundRect(90,cy,W-180,110,16); x.fill();
    x.fillStyle="#FFFFFF"; x.textAlign="center"; x.font="600 34px sans-serif";
    x.fillText(contactoTxt,W/2,cy+45);
    x.font="800 44px sans-serif"; x.fillText("WhatsApp "+(post.whatsapp||post.phone||""),W/2,cy+90);
    // Marca
    x.fillStyle="#0E7C6B"; x.font="800 36px sans-serif"; x.fillText("🐾 MASCOTAS PERDIDAS MISIONES",W/2,H-90);
    x.fillStyle="#5F726B"; x.font="400 26px sans-serif"; x.fillText("mascotasposadas.netlify.app",W/2,H-55);
  };
  // dibujar foto o emoji
  await new Promise((res)=>{
    if(post.photo){
      const img=new Image(); img.crossOrigin="anonymous";
      img.onload=()=>{ // recorte tipo "cover"
        const r=Math.max((W-160)/img.width,boxH/img.height);
        const iw=img.width*r, ih=img.height*r;
        x.save(); x.beginPath(); x.roundRect(80,boxY,W-160,boxH,20); x.clip();
        x.drawImage(img,W/2-iw/2,boxY+boxH/2-ih/2,iw,ih); x.restore(); res();
      };
      img.onerror=()=>{ x.fillStyle=col+"22"; x.beginPath(); x.roundRect(80,boxY,W-160,boxH,20); x.fill(); x.font="220px serif"; x.textAlign="center"; x.fillText(post.emoji||"🐾",W/2,boxY+boxH/2+70); res(); };
      img.src=post.photo;
    } else { x.fillStyle=col+"22"; x.beginPath(); x.roundRect(80,boxY,W-160,boxH,20); x.fill(); x.font="220px serif"; x.textAlign="center"; x.fillText(post.emoji||"🐾",W/2,boxY+boxH/2+70); res(); }
  });
  drawResto();
  return cv;
}

function ShareView({ post, go, flash }){
  const t=TYPE[post.type];const link=`https://mascotasposadas.netlify.app`;
  const [gen,setGen]=useState(false);
  const frase = post.type==="lost"?"Si la viste, ayudanos a encontrarla":post.type==="found"?"¿Es tuyo? Ayudalo a volver a casa":"Si sabés de quién es, avisanos";
  const text=`${t.ico} ${t.label.toUpperCase()}: ${post.petName||post.species} en ${ubicTxt(post)}. ${frase} 🐾 ${link}`;
  const share=(net)=>{ if(net==="wa")window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank"); else if(net==="fb")window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`,"_blank"); else if(net==="native"){if(navigator.share)navigator.share({title:"Mascotas Posadas",text,url:link}).catch(()=>{});else{navigator.clipboard&&navigator.clipboard.writeText(text);flash("Copiado.");}} else {navigator.clipboard&&navigator.clipboard.writeText(text);flash("Texto copiado.");} };
  const afiche=async(modo)=>{
    setGen(true);
    try{
      const cv=await generarAfiche(post);
      const blob=await new Promise(r=>cv.toBlob(r,"image/png",0.92));
      const file=new File([blob],`mascota-${post.petName||post.id}.png`,{type:"image/png"});
      if(modo==="share" && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:"Mascotas Posadas",text}); 
      } else {
        const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=file.name; a.click(); URL.revokeObjectURL(url);
        flash("Afiche descargado ✓");
      }
    }catch(e){ flash("No se pudo generar el afiche."); }
    setGen(false);
  };
  return (
    <div className="px-4">
      <Title back={()=>go("detail",{post})} title="Compartir alerta" tag="FUNCIONAL"/>
      <div className="rounded-3xl overflow-hidden" style={{background:C.surface,border:`2px solid ${t.dot}`}}><div className="px-4 py-2.5 text-white font-extrabold text-center" style={{background:t.dot}}>{t.ico} MASCOTA {t.label.toUpperCase()}</div><Thumb post={post} h={220}/><div className="p-4"><div className="text-lg font-extrabold">{post.petName||`${post.species} ${post.color}`}</div><div className="grid grid-cols-2 gap-2 mt-2 text-[13px]"><Info2 label="Especie" v={post.species}/><Info2 label="Zona" v={ubicTxt(post)}/><Info2 label="Color" v={post.color}/><Info2 label="Fecha" v={post.date}/></div><p className="mt-3 text-center font-bold text-sm" style={{color:t.dot}}>{frase}.</p><div className="mt-2 text-center text-[11px] font-extrabold tracking-wide" style={{color:C.brand}}>🐾 MASCOTAS PERDIDAS MISIONES</div></div></div>

      <button onClick={()=>afiche("share")} disabled={gen} className="mt-4 w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{background:t.dot}}>{gen?<Loader2 size={18} className="animate-spin"/>:<Camera size={18}/>} Crear afiche "SE BUSCA" con la foto</button>
      <button onClick={()=>afiche("download")} disabled={gen} className="mt-2 w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2" style={{background:C.surface,border:`1px solid ${C.line}`}}><Copy size={16} color={C.brand}/> Descargar afiche (imagen)</button>
      <p className="text-[11px] mt-2 text-center" style={{color:C.muted}}>El afiche se puede mandar por WhatsApp, subir a historias de Instagram/Facebook o imprimir.</p>

      <div className="mt-4 text-[12px] font-bold" style={{color:C.muted}}>O compartí el enlace:</div>
      <div className="grid grid-cols-4 gap-2 mt-2"><ShareBtn onClick={()=>share("wa")} label="WhatsApp" color={C.found} ico={<Phone size={17}/>}/><ShareBtn onClick={()=>share("fb")} label="Facebook" color="#1877F2" ico={<Share2 size={17}/>}/><ShareBtn onClick={()=>share("copy")} label="Copiar" color={C.brand} ico={<Copy size={17}/>}/><ShareBtn onClick={()=>share("native")} label="Compartir" color={C.ink} ico={<Send size={17}/>}/></div>
    </div>
  );
}
function Info2({ label, v }){ return <div><div className="text-[10px] font-semibold" style={{color:C.muted}}>{label}</div><div className="font-bold capitalize truncate">{v}</div></div>; }
function ShareBtn({ onClick, label, color, ico }){ return <button onClick={onClick} className="py-3 rounded-2xl text-white text-[10px] font-bold flex flex-col items-center gap-1" style={{background:color}}>{ico}{label}</button>; }

/* ------------------------------ Reportar --------------------------------- */
function ReportModal({ post, onClose, onSubmit }){
  const [reason,setReason]=useState(REPORT_REASONS[0]);const [note,setNote]=useState("");
  return (<div className="fixed inset-0 z-[900] flex items-end justify-center" style={{background:"rgba(0,0,0,.4)"}} onClick={onClose}><div className="w-full max-w-[480px] rounded-t-3xl p-5" style={{background:C.surface}} onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between mb-3"><h3 className="font-extrabold text-lg flex items-center gap-2"><Flag size={18} color={C.lost}/> Reportar</h3><button onClick={onClose}><X size={20}/></button></div><p className="text-[12px] mb-3" style={{color:C.muted}}>Reportás: <b>{post.petName||post.species}</b> ({ubicTxt(post)})</p><div className="space-y-2">{REPORT_REASONS.map(r=><button key={r} onClick={()=>setReason(r)} className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between" style={{background:reason===r?C.brandSoft:C.bg,border:`1px solid ${reason===r?C.brand:C.line}`}}>{r}{reason===r&&<Check size={16} color={C.brand}/>}</button>)}</div><textarea value={note} onChange={e=>setNote(e.target.value)} rows={2} className="inp mt-3" placeholder="Detalle opcional…"/><button onClick={()=>onSubmit(post,reason,note)} className="mt-3 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.lost}}>Enviar reporte</button></div></div>);
}

/* --------------------------------- Ayuda --------------------------------- */
function HelpView({ go, lugares=[] }){
  const items = lugares.filter(l=>l.approved!==false);
  const KIND={ veterinaria:{label:"Veterinaria",ico:<Stethoscope size={20}/>}, refugio:{label:"Refugio",ico:<PawPrint size={20}/>}, negocio:{label:"Negocio",ico:<Store size={20}/>} };
  return (<div className="px-4"><Title back={()=>go("home")} title="🏥 Ayuda" tag="FUNCIONAL"/><p className="text-[13px] mb-3" style={{color:C.muted}}>Veterinarias, refugios y negocios de Posadas.</p>
    {items.length===0 ? <Empty text="Todavía no hay lugares cargados. Pronto vas a encontrar acá veterinarias y refugios."/> :
    <div className="space-y-3 mb-2">{items.map((v)=>{const k=KIND[v.kind]||KIND.negocio;return (<div key={v.id} className="rounded-2xl p-3.5 flex items-center gap-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:C.brandSoft,color:C.brand}}>{k.ico}</div><div className="flex-1 min-w-0"><div className="font-bold text-sm flex items-center gap-1.5">{v.name} {v.emerg&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:C.lost}}>24h</span>}</div><div className="text-[11px]" style={{color:C.muted}}>{k.label}{v.barrio?" · "+v.barrio:""}{v.hours?" · "+v.hours:""}</div></div>{(v.whatsapp||v.phone)&&<a href={`https://wa.me/${digits(v.whatsapp||v.phone)}`} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{background:C.found}}><Phone size={16}/></a>}</div>);})}</div>}
  </div>);
}

/* ---- Generador de QR autónomo (sin descargas externas, evita bloqueo CORB) ---- */
/* Implementación compacta de QR Code (modelo 2). Genera una matriz de módulos. */
const QRGen=(function(){
  // Tablas mínimas para niveles de corrección y capacidad (usamos ECC nivel M).
  function QR8bitByte(data){this.mode=4;this.data=data;this.parsedData=[];for(let i=0,l=data.length;i<l;i++){const b=[];let c=data.charCodeAt(i);if(c>0x10000){b[0]=0xF0|((c&0x1C0000)>>>18);b[1]=0x80|((c&0x3F000)>>>12);b[2]=0x80|((c&0xFC0)>>>6);b[3]=0x80|(c&0x3F);}else if(c>0x800){b[0]=0xE0|((c&0xF000)>>>12);b[1]=0x80|((c&0xFC0)>>>6);b[2]=0x80|(c&0x3F);}else if(c>0x80){b[0]=0xC0|((c&0x7C0)>>>6);b[1]=0x80|(c&0x3F);}else{b[0]=c;}this.parsedData.push(b);}this.parsedData=Array.prototype.concat.apply([],this.parsedData);if(this.parsedData.length!=this.data.length){this.parsedData.unshift(191);this.parsedData.unshift(187);this.parsedData.unshift(239);}}
  QR8bitByte.prototype={getLength:function(){return this.parsedData.length;},write:function(buffer){for(let i=0,l=this.parsedData.length;i<l;i++){buffer.put(this.parsedData[i],8);}}};
  function QRCodeModel(typeNumber,errorCorrectLevel){this.typeNumber=typeNumber;this.errorCorrectLevel=errorCorrectLevel;this.modules=null;this.moduleCount=0;this.dataCache=null;this.dataList=[];}
  QRCodeModel.prototype={addData:function(data){const newData=new QR8bitByte(data);this.dataList.push(newData);this.dataCache=null;},isDark:function(row,col){return this.modules[row][col];},getModuleCount:function(){return this.moduleCount;},make:function(){this.makeImpl(false,this.getBestMaskPattern());},makeImpl:function(test,maskPattern){this.moduleCount=this.typeNumber*4+17;this.modules=new Array(this.moduleCount);for(let row=0;row<this.moduleCount;row++){this.modules[row]=new Array(this.moduleCount);for(let col=0;col<this.moduleCount;col++){this.modules[row][col]=null;}}this.setupPositionProbePattern(0,0);this.setupPositionProbePattern(this.moduleCount-7,0);this.setupPositionProbePattern(0,this.moduleCount-7);this.setupPositionAdjustPattern();this.setupTimingPattern();this.setupTypeInfo(test,maskPattern);if(this.typeNumber>=7){this.setupTypeNumber(test);}if(this.dataCache==null){this.dataCache=QRCodeModel.createData(this.typeNumber,this.errorCorrectLevel,this.dataList);}this.mapData(this.dataCache,maskPattern);},setupPositionProbePattern:function(row,col){for(let r=-1;r<=7;r++){if(row+r<=-1||this.moduleCount<=row+r)continue;for(let c=-1;c<=7;c++){if(col+c<=-1||this.moduleCount<=col+c)continue;if((0<=r&&r<=6&&(c==0||c==6))||(0<=c&&c<=6&&(r==0||r==6))||(2<=r&&r<=4&&2<=c&&c<=4)){this.modules[row+r][col+c]=true;}else{this.modules[row+r][col+c]=false;}}}},getBestMaskPattern:function(){let minLostPoint=0,pattern=0;for(let i=0;i<8;i++){this.makeImpl(true,i);const lostPoint=QRUtil.getLostPoint(this);if(i==0||minLostPoint>lostPoint){minLostPoint=lostPoint;pattern=i;}}return pattern;},setupTimingPattern:function(){for(let r=8;r<this.moduleCount-8;r++){if(this.modules[r][6]!=null)continue;this.modules[r][6]=(r%2==0);}for(let c=8;c<this.moduleCount-8;c++){if(this.modules[6][c]!=null)continue;this.modules[6][c]=(c%2==0);}},setupPositionAdjustPattern:function(){const pos=QRUtil.getPatternPosition(this.typeNumber);for(let i=0;i<pos.length;i++){for(let j=0;j<pos.length;j++){const row=pos[i],col=pos[j];if(this.modules[row][col]!=null)continue;for(let r=-2;r<=2;r++){for(let c=-2;c<=2;c++){if(r==-2||r==2||c==-2||c==2||(r==0&&c==0)){this.modules[row+r][col+c]=true;}else{this.modules[row+r][col+c]=false;}}}}}},setupTypeNumber:function(test){const bits=QRUtil.getBCHTypeNumber(this.typeNumber);for(let i=0;i<18;i++){const mod=(!test&&((bits>>i)&1)==1);this.modules[Math.floor(i/3)][i%3+this.moduleCount-8-3]=mod;}for(let i=0;i<18;i++){const mod=(!test&&((bits>>i)&1)==1);this.modules[i%3+this.moduleCount-8-3][Math.floor(i/3)]=mod;}},setupTypeInfo:function(test,maskPattern){const data=(this.errorCorrectLevel<<3)|maskPattern;const bits=QRUtil.getBCHTypeInfo(data);for(let i=0;i<15;i++){const mod=(!test&&((bits>>i)&1)==1);if(i<6){this.modules[i][8]=mod;}else if(i<8){this.modules[i+1][8]=mod;}else{this.modules[this.moduleCount-15+i][8]=mod;}}for(let i=0;i<15;i++){const mod=(!test&&((bits>>i)&1)==1);if(i<8){this.modules[8][this.moduleCount-i-1]=mod;}else if(i<9){this.modules[8][15-i-1+1]=mod;}else{this.modules[8][15-i-1]=mod;}}this.modules[this.moduleCount-8][8]=(!test);},mapData:function(data,maskPattern){let inc=-1,row=this.moduleCount-1,bitIndex=7,byteIndex=0;for(let col=this.moduleCount-1;col>0;col-=2){if(col==6)col--;while(true){for(let c=0;c<2;c++){if(this.modules[row][col-c]==null){let dark=false;if(byteIndex<data.length){dark=(((data[byteIndex]>>>bitIndex)&1)==1);}const mask=QRUtil.getMask(maskPattern,row,col-c);if(mask)dark=!dark;this.modules[row][col-c]=dark;bitIndex--;if(bitIndex==-1){byteIndex++;bitIndex=7;}}}row+=inc;if(row<0||this.moduleCount<=row){row-=inc;inc=-inc;break;}}}}};
  QRCodeModel.PAD0=0xEC;QRCodeModel.PAD1=0x11;
  QRCodeModel.createData=function(typeNumber,errorCorrectLevel,dataList){const rsBlocks=QRRSBlock.getRSBlocks(typeNumber,errorCorrectLevel);const buffer=new QRBitBuffer();for(let i=0;i<dataList.length;i++){const data=dataList[i];buffer.put(data.mode,4);buffer.put(data.getLength(),QRUtil.getLengthInBits(data.mode,typeNumber));data.write(buffer);}let totalDataCount=0;for(let i=0;i<rsBlocks.length;i++){totalDataCount+=rsBlocks[i].dataCount;}if(buffer.getLengthInBits()>totalDataCount*8){throw new Error("code length overflow. ("+buffer.getLengthInBits()+">"+totalDataCount*8+")");}if(buffer.getLengthInBits()+4<=totalDataCount*8){buffer.put(0,4);}while(buffer.getLengthInBits()%8!=0){buffer.putBit(false);}while(true){if(buffer.getLengthInBits()>=totalDataCount*8)break;buffer.put(QRCodeModel.PAD0,8);if(buffer.getLengthInBits()>=totalDataCount*8)break;buffer.put(QRCodeModel.PAD1,8);}return QRCodeModel.createBytes(buffer,rsBlocks);};
  QRCodeModel.createBytes=function(buffer,rsBlocks){let offset=0,maxDcCount=0,maxEcCount=0;const dcdata=new Array(rsBlocks.length),ecdata=new Array(rsBlocks.length);for(let r=0;r<rsBlocks.length;r++){const dcCount=rsBlocks[r].dataCount,ecCount=rsBlocks[r].totalCount-dcCount;maxDcCount=Math.max(maxDcCount,dcCount);maxEcCount=Math.max(maxEcCount,ecCount);dcdata[r]=new Array(dcCount);for(let i=0;i<dcdata[r].length;i++){dcdata[r][i]=0xff&buffer.buffer[i+offset];}offset+=dcCount;const rsPoly=QRUtil.getErrorCorrectPolynomial(ecCount);const rawPoly=new QRPolynomial(dcdata[r],rsPoly.getLength()-1);const modPoly=rawPoly.mod(rsPoly);ecdata[r]=new Array(rsPoly.getLength()-1);for(let i=0;i<ecdata[r].length;i++){const modIndex=i+modPoly.getLength()-ecdata[r].length;ecdata[r][i]=(modIndex>=0)?modPoly.get(modIndex):0;}}let totalCodeCount=0;for(let i=0;i<rsBlocks.length;i++){totalCodeCount+=rsBlocks[i].totalCount;}const data=new Array(totalCodeCount);let index=0;for(let i=0;i<maxDcCount;i++){for(let r=0;r<rsBlocks.length;r++){if(i<dcdata[r].length)data[index++]=dcdata[r][i];}}for(let i=0;i<maxEcCount;i++){for(let r=0;r<rsBlocks.length;r++){if(i<ecdata[r].length)data[index++]=ecdata[r][i];}}return data;};
  const QRMode={MODE_8BIT_BYTE:4};
  const QRErrorCorrectLevel={M:0};
  const QRUtil={PATTERN_POSITION_TABLE:[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90]],G15:0x537,G18:0x1f25,G15_MASK:0x5412,getBCHTypeInfo:function(data){let d=data<<10;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)>=0){d^=(QRUtil.G15<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G15)));}return((data<<10)|d)^QRUtil.G15_MASK;},getBCHTypeNumber:function(data){let d=data<<12;while(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)>=0){d^=(QRUtil.G18<<(QRUtil.getBCHDigit(d)-QRUtil.getBCHDigit(QRUtil.G18)));}return(data<<12)|d;},getBCHDigit:function(data){let digit=0;while(data!=0){digit++;data>>>=1;}return digit;},getPatternPosition:function(typeNumber){return QRUtil.PATTERN_POSITION_TABLE[typeNumber-1];},getMask:function(maskPattern,i,j){switch(maskPattern){case 0:return(i+j)%2==0;case 1:return i%2==0;case 2:return j%3==0;case 3:return(i+j)%3==0;case 4:return(Math.floor(i/2)+Math.floor(j/3))%2==0;case 5:return(i*j)%2+(i*j)%3==0;case 6:return((i*j)%2+(i*j)%3)%2==0;case 7:return((i*j)%3+(i+j)%2)%2==0;default:throw new Error("bad maskPattern:"+maskPattern);}},getErrorCorrectPolynomial:function(errorCorrectLength){let a=new QRPolynomial([1],0);for(let i=0;i<errorCorrectLength;i++){a=a.multiply(new QRPolynomial([1,QRMath.gexp(i)],0));}return a;},getLengthInBits:function(mode,type){if(1<=type&&type<10){return 8;}else if(type<27){return 16;}else{return 16;}},getLostPoint:function(qrCode){const moduleCount=qrCode.getModuleCount();let lostPoint=0;for(let row=0;row<moduleCount;row++){for(let col=0;col<moduleCount;col++){let sameCount=0;const dark=qrCode.isDark(row,col);for(let r=-1;r<=1;r++){if(row+r<0||moduleCount<=row+r)continue;for(let c=-1;c<=1;c++){if(col+c<0||moduleCount<=col+c)continue;if(r==0&&c==0)continue;if(dark==qrCode.isDark(row+r,col+c))sameCount++;}}if(sameCount>5)lostPoint+=(3+sameCount-5);}}for(let row=0;row<moduleCount-1;row++){for(let col=0;col<moduleCount-1;col++){let count=0;if(qrCode.isDark(row,col))count++;if(qrCode.isDark(row+1,col))count++;if(qrCode.isDark(row,col+1))count++;if(qrCode.isDark(row+1,col+1))count++;if(count==0||count==4)lostPoint+=3;}}for(let row=0;row<moduleCount;row++){for(let col=0;col<moduleCount-6;col++){if(qrCode.isDark(row,col)&&!qrCode.isDark(row,col+1)&&qrCode.isDark(row,col+2)&&qrCode.isDark(row,col+3)&&qrCode.isDark(row,col+4)&&!qrCode.isDark(row,col+5)&&qrCode.isDark(row,col+6))lostPoint+=40;}}for(let col=0;col<moduleCount;col++){for(let row=0;row<moduleCount-6;row++){if(qrCode.isDark(row,col)&&!qrCode.isDark(row+1,col)&&qrCode.isDark(row+2,col)&&qrCode.isDark(row+3,col)&&qrCode.isDark(row+4,col)&&!qrCode.isDark(row+5,col)&&qrCode.isDark(row+6,col))lostPoint+=40;}}let darkCount=0;for(let col=0;col<moduleCount;col++){for(let row=0;row<moduleCount;row++){if(qrCode.isDark(row,col))darkCount++;}}const ratio=Math.abs(100*darkCount/moduleCount/moduleCount-50)/5;lostPoint+=ratio*10;return lostPoint;}};
  const QRMath={glog:function(n){if(n<1)throw new Error("glog("+n+")");return QRMath.LOG_TABLE[n];},gexp:function(n){while(n<0)n+=255;while(n>=256)n-=255;return QRMath.EXP_TABLE[n];},EXP_TABLE:new Array(256),LOG_TABLE:new Array(256)};
  for(let i=0;i<8;i++)QRMath.EXP_TABLE[i]=1<<i;for(let i=8;i<256;i++)QRMath.EXP_TABLE[i]=QRMath.EXP_TABLE[i-4]^QRMath.EXP_TABLE[i-5]^QRMath.EXP_TABLE[i-6]^QRMath.EXP_TABLE[i-8];for(let i=0;i<255;i++)QRMath.LOG_TABLE[QRMath.EXP_TABLE[i]]=i;
  function QRPolynomial(num,shift){if(num.length==undefined)throw new Error(num.length+"/"+shift);let offset=0;while(offset<num.length&&num[offset]==0)offset++;this.num=new Array(num.length-offset+shift);for(let i=0;i<num.length-offset;i++)this.num[i]=num[i+offset];}
  QRPolynomial.prototype={get:function(index){return this.num[index];},getLength:function(){return this.num.length;},multiply:function(e){const num=new Array(this.getLength()+e.getLength()-1);for(let i=0;i<this.getLength();i++){for(let j=0;j<e.getLength();j++){num[i+j]^=QRMath.gexp(QRMath.glog(this.get(i))+QRMath.glog(e.get(j)));}}return new QRPolynomial(num,0);},mod:function(e){if(this.getLength()-e.getLength()<0)return this;const ratio=QRMath.glog(this.get(0))-QRMath.glog(e.get(0));const num=new Array(this.getLength());for(let i=0;i<this.getLength();i++)num[i]=this.get(i);for(let i=0;i<e.getLength();i++)num[i]^=QRMath.gexp(QRMath.glog(e.get(i))+ratio);return new QRPolynomial(num,0).mod(e);}};
  function QRRSBlock(totalCount,dataCount){this.totalCount=totalCount;this.dataCount=dataCount;}
  QRRSBlock.RS_BLOCK_TABLE=[[1,26,16],[1,44,28],[1,70,44],[1,100,64],[1,134,86],[2,86,68],[2,98,78],[2,121,97],[2,146,116],[2,86,68,2,88,70],[4,101,81],[2,116,92,2,117,93],[4,133,107],[3,145,115,1,146,116],[5,109,87,1,110,88],[5,122,98,1,123,99],[1,135,107,5,136,108],[5,150,120,1,151,121],[3,141,113,4,142,114],[3,135,107,5,136,108]];
  QRRSBlock.getRSBlocks=function(typeNumber,errorCorrectLevel){const rsBlock=QRRSBlock.RS_BLOCK_TABLE[typeNumber-1];const list=[];const length=rsBlock.length/3;for(let i=0;i<length;i++){const count=rsBlock[i*3+0],totalCount=rsBlock[i*3+1],dataCount=rsBlock[i*3+2];for(let j=0;j<count;j++){list.push(new QRRSBlock(totalCount,dataCount));}}return list;};
  function QRBitBuffer(){this.buffer=[];this.length=0;}
  QRBitBuffer.prototype={get:function(index){const bufIndex=Math.floor(index/8);return((this.buffer[bufIndex]>>>(7-index%8))&1)==1;},put:function(num,length){for(let i=0;i<length;i++){this.putBit(((num>>>(length-i-1))&1)==1);}},getLengthInBits:function(){return this.length;},putBit:function(bit){const bufIndex=Math.floor(this.length/8);if(this.buffer.length<=bufIndex)this.buffer.push(0);if(bit)this.buffer[bufIndex]|=(0x80>>>(this.length%8));this.length++;}};
  // Elige el tipo (versión) más chico que entre el texto
  function make(text){for(let type=1;type<=20;type++){try{const model=new QRCodeModel(type,QRErrorCorrectLevel.M);model.addData(text);model.make();return model;}catch(e){if(type===20)throw e;}}}
  return { make };
})();

// Dibuja el QR en un canvas
function drawQROnCanvas(canvas,text,size,dark,light){
  const model=QRGen.make(text);const count=model.getModuleCount();
  const cellSize=Math.floor(size/(count+2)); const margin=cellSize; const dim=cellSize*count+margin*2;
  canvas.width=dim; canvas.height=dim;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle=light||"#FFFFFF"; ctx.fillRect(0,0,dim,dim);
  ctx.fillStyle=dark||"#0E7C6B";
  for(let r=0;r<count;r++){for(let c=0;c<count;c++){if(model.isDark(r,c)){ctx.fillRect(margin+c*cellSize,margin+r*cellSize,cellSize,cellSize);}}}
  return canvas;
}
const mascotaURL=(codigo)=>`https://mascotasposadas.netlify.app/?m=${codigo}`;

/* --------------------- Registrar tu mascota (ficha + QR) ------------------ */
function RegistrarMascotaView({ go, onSave, flash }){
  const [f,setF]=useState({ petName:"", species:"perro", sex:"", color:"", features:"", zona:"Posadas", phone:"", whatsapp:"", notas:"", photo:null });
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setF(s=>({...s,[k]:v}));
  const fileRef=useRef(null);
  const onPhoto=async(e)=>{ const file=e.target.files&&e.target.files[0]; if(!file)return; const err=(typeof validateImage==="function")?validateImage(file):null; if(err){flash(err);return;} try{ const data=await compressImage(file); set("photo",data); }catch{ flash("No se pudo procesar la imagen."); } };
  const canSave=f.petName&&f.photo&&(f.phone||f.whatsapp);
  const guardar=async()=>{ if(!canSave){flash("Completá nombre, foto y un teléfono.");return;} setSaving(true); const m=await onSave(f); setSaving(false); if(m){ go("qr_mascota"); } };
  return (<div className="px-4 pb-6">
    <Title back={()=>go("home")} title="Registrá tu mascota" tag="FUNCIONAL"/>
    <div className="rounded-2xl p-3 mb-4 text-[12px] flex gap-2" style={{background:C.brandSoft,color:C.ink}}><ShieldCheck size={16} className="shrink-0 mt-0.5" style={{color:C.brand}}/><span>Creá la ficha de tu mascota. Vas a obtener un <b>QR para imprimir y poner en su collar</b>. Si se pierde, quien la encuentre escanea el QR y te avisa, sin ver tus datos personales.</span></div>
    <button onClick={()=>fileRef.current&&fileRef.current.click()} className="w-full rounded-2xl overflow-hidden mb-3 flex items-center justify-center" style={{background:C.surface,border:`1.5px dashed ${C.line}`,height:f.photo?220:120}}>
      {f.photo? <img src={f.photo} alt="" className="w-full h-full object-cover"/> : <div className="text-center" style={{color:C.muted}}><Camera size={26} className="mx-auto mb-1"/><div className="text-sm font-semibold">Subir foto de tu mascota</div></div>}
    </button>
    <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} className="hidden"/>
    <div className="space-y-3">
      <Field label="Nombre *"><input value={f.petName} onChange={e=>set("petName",e.target.value)} className="inp" placeholder="Ej: Toby"/></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Especie"><select value={f.species} onChange={e=>set("species",e.target.value)} className="inp"><option value="perro">Perro</option><option value="gato">Gato</option><option value="otro">Otro</option></select></Field><Field label="Sexo"><select value={f.sex} onChange={e=>set("sex",e.target.value)} className="inp"><option value="">—</option><option>Macho</option><option>Hembra</option></select></Field></div>
      <Field label="Color"><input value={f.color} onChange={e=>set("color",e.target.value)} className="inp" placeholder="Ej: Marrón con blanco"/></Field>
      <Field label="Señas particulares"><input value={f.features} onChange={e=>set("features",e.target.value)} className="inp" placeholder="Ej: mancha en la oreja, collar rojo"/></Field>
      <Field label="Localidad"><select value={f.zona} onChange={e=>set("zona",e.target.value)} className="inp">{ZONA_LIST.map(z=><option key={z}>{z}</option>)}</select></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Teléfono *"><input inputMode="numeric" value={f.phone} onChange={e=>set("phone",e.target.value)} className="inp" placeholder="3764..."/></Field><Field label="WhatsApp"><input inputMode="numeric" value={f.whatsapp} onChange={e=>set("whatsapp",e.target.value)} className="inp" placeholder="igual al teléfono"/></Field></div>
      <Field label="Notas (opcional)"><input value={f.notas} onChange={e=>set("notas",e.target.value)} className="inp" placeholder="Ej: es asustadiza, no muerde"/></Field>
    </div>
    <button onClick={guardar} disabled={saving||!canSave} className="mt-5 w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{background:canSave?C.brand:C.line}}>{saving&&<Loader2 size={18} className="animate-spin"/>}Crear ficha y generar QR</button>
  </div>);
}

/* ------------------------- QR de la mascota ------------------------------ */
function VistaVacia({ go, texto }){
  return (<div className="px-4 pt-10 text-center"><div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{background:C.brandSoft}}><PawPrint size={30} color={C.brand}/></div><p className="font-bold mt-3">{texto||"No hay nada para mostrar."}</p><button onClick={()=>go("home")} className="mt-4 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.brand}}>Volver al inicio</button></div>);
}

function QRMascotaView({ go, mascota, flash }){
  const canvasRef=useRef(null);
  const [listo,setListo]=useState(false);
  const url=mascotaURL(mascota.codigo);
  const [qrError,setQrError]=useState(false);
  useEffect(()=>{ try{ if(canvasRef.current){ drawQROnCanvas(canvasRef.current,url,240,"#0E7C6B","#FFFFFF"); setListo(true); setQrError(false); } }catch(e){ setQrError(true); } },[url]);
  const descargarPoster=async()=>{
    const W=1080,H=1350; const cv=document.createElement("canvas"); cv.width=W;cv.height=H; const x=cv.getContext("2d");
    x.fillStyle="#FFFFFF";x.fillRect(0,0,W,H); x.strokeStyle="#0E7C6B";x.lineWidth=10;x.strokeRect(24,24,W-48,H-48);
    x.fillStyle="#0E7C6B";x.fillRect(24,24,W-48,150); x.fillStyle="#FFFFFF";x.textAlign="center";x.font="800 70px sans-serif";x.fillText("¡AYUDAME A VOLVER!",W/2,118);
    // foto
    await new Promise((res)=>{ if(mascota.photo){const img=new Image();img.crossOrigin="anonymous";img.onload=()=>{const r=Math.max(420/img.width,420/img.height),iw=img.width*r,ih=img.height*r;x.save();x.beginPath();x.arc(W/2,410,210,0,7);x.clip();x.drawImage(img,W/2-iw/2,410-ih/2,iw,ih);x.restore();res();};img.onerror=res;img.src=mascota.photo;}else res(); });
    x.fillStyle="#12211C";x.textAlign="center";x.font="800 72px sans-serif";x.fillText((mascota.pet_name||mascota.petName||"").toUpperCase(),W/2,700);
    x.fillStyle="#5F726B";x.font="400 34px sans-serif";x.fillText("Escaneá el código para avisar dónde estoy",W/2,752);
    // QR grande (generado localmente)
    const qcv=document.createElement("canvas"); drawQROnCanvas(qcv,url,360,"#0E7C6B","#FFFFFF");
    x.drawImage(qcv,W/2-180,800,360,360);
    x.fillStyle="#159A5A";x.beginPath();x.roundRect(140,1200,W-280,86,16);x.fill(); x.fillStyle="#FFFFFF";x.font="800 34px sans-serif";x.fillText("Sin exponer los datos del dueño",W/2,1252);
    x.fillStyle="#0E7C6B";x.font="800 30px sans-serif";x.fillText("🐾 MASCOTAS PERDIDAS MISIONES",W/2,H-45);
    const url2=cv.toDataURL("image/png"); const a=document.createElement("a"); a.href=url2; a.download=`qr-${mascota.pet_name||mascota.codigo}.png`; a.click(); flash("Póster descargado ✓");
  };
  return (<div className="px-4 pb-6 text-center">
    <Title back={()=>go("mis_mascotas")} title="QR de tu mascota" tag="FUNCIONAL"/>
    <div className="rounded-3xl p-5 mt-1" style={{background:C.surface,border:`1px solid ${C.line}`}}>
      <div className="text-lg font-extrabold">{mascota.pet_name||mascota.petName} 🐾</div>
      <div className="text-[12px] mb-3" style={{color:C.muted}}>Código: <b>{mascota.codigo}</b></div>
      <div className="inline-block rounded-2xl p-3" style={{background:"#fff",border:`1px solid ${C.line}`}}><canvas ref={canvasRef}/></div>
      <p className="text-[12px] mt-3" style={{color:C.muted}}>Cuando alguien escanee este QR, verá la ficha de {mascota.pet_name||"tu mascota"} y podrá avisarte que la encontró — <b>sin ver tu teléfono</b>.</p>
    </div>
    <button onClick={descargarPoster} className="mt-4 w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{background:C.brand}}><Copy size={18}/> Descargar póster con el QR</button>
    <p className="text-[11px] mt-2" style={{color:C.muted}}>Imprimí el póster y colgá el QR, o ponelo en el collar. También podés guardarlo en el celular.</p>
    <button onClick={()=>go("mis_mascotas")} className="mt-3 w-full py-3 rounded-2xl font-bold" style={{background:C.surface,border:`1px solid ${C.line}`}}>Ver mis mascotas</button>
  </div>);
}

/* ---------------- Página pública (se abre al escanear el QR) -------------- */
function MascotaPublicaView({ go, mascota, onReport, flash }){
  const [f,setF]=useState({quien:"",contacto:"",zona:"",nota:""});
  const [busy,setBusy]=useState(false);const [ok,setOk]=useState(false);
  const set=(k,v)=>setF(s=>({...s,[k]:v}));
  const enviar=async()=>{ if(!f.quien||!f.contacto){flash("Dejá tu nombre y un contacto.");return;} setBusy(true); const r=await onReport(mascota,f); setBusy(false); if(r)setOk(true); };
  const nombre=mascota.pet_name||mascota.petName||"esta mascota";
  if(ok)return (<div className="px-4 pt-10 text-center"><div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{background:C.brandSoft}}><Check size={32} color={C.brand}/></div><h2 className="text-xl font-extrabold mt-3">¡Gracias! 🐾</h2><p className="text-sm mt-1" style={{color:C.muted}}>Le avisamos al dueño de {nombre} que la viste. Sos un sol por ayudar. ❤️</p><button onClick={()=>go("home")} className="mt-5 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.brand}}>Ir a Mascotas Perdidas Misiones</button></div>);
  return (<div className="px-4 pb-6">
    <div className="text-center pt-4"><div className="text-[11px] font-extrabold tracking-wide" style={{color:C.brand}}>🐾 MASCOTAS PERDIDAS MISIONES</div></div>
    <div className="rounded-3xl overflow-hidden mt-3" style={{background:C.surface,border:`2px solid ${C.brand}`}}>
      <div className="px-4 py-2.5 text-white font-extrabold text-center" style={{background:C.brand}}>¡Hola! Soy {nombre} 🐾</div>
      {mascota.photo && <img src={mascota.photo} alt="" className="w-full object-cover" style={{maxHeight:280}}/>}
      <div className="p-4">
        <p className="text-center text-sm font-semibold mb-3" style={{color:C.ink}}>Si me encontraste, dejá tu aviso acá abajo y mi familia te va a contactar. ¡Gracias por ayudarme a volver a casa!</p>
        <div className="grid grid-cols-2 gap-2 text-[13px] mb-3">
          {mascota.species&&<Info2 label="Especie" v={mascota.species}/>}
          {mascota.color&&<Info2 label="Color" v={mascota.color}/>}
          {mascota.features&&<div className="col-span-2"><Info2 label="Señas" v={mascota.features}/></div>}
          {mascota.notas&&<div className="col-span-2"><Info2 label="Notas" v={mascota.notas}/></div>}
        </div>
      </div>
    </div>
    <div className="mt-4 rounded-2xl p-4" style={{background:C.surface,border:`1px solid ${C.line}`}}>
      <div className="font-extrabold text-sm mb-3">📍 Avisar que la vi</div>
      <div className="space-y-3">
        <Field label="Tu nombre *"><input value={f.quien} onChange={e=>set("quien",e.target.value)} className="inp" placeholder="¿Cómo te llamás?"/></Field>
        <Field label="Tu teléfono / WhatsApp *"><input value={f.contacto} onChange={e=>set("contacto",e.target.value)} className="inp" placeholder="Para que te contacten"/></Field>
        <Field label="¿Dónde la viste?"><input value={f.zona} onChange={e=>set("zona",e.target.value)} className="inp" placeholder="Zona o dirección aproximada"/></Field>
        <Field label="Mensaje"><textarea value={f.nota} onChange={e=>set("nota",e.target.value)} rows={3} className="inp" placeholder="Contá cómo está, dónde, etc."/></Field>
      </div>
      <button onClick={enviar} disabled={busy} className="mt-4 w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{background:C.brand}}>{busy&&<Loader2 size={18} className="animate-spin"/>}Enviar aviso</button>
    </div>
  </div>);
}

/* ------------------------- Mis mascotas registradas ----------------------- */
function MisMascotasView({ go, mascotas=[], user, onDelete, avistamientos=[], irQr }){
  return (<div className="px-4 pb-6">
    <Title back={()=>go("home")} title="Mis mascotas" tag="FUNCIONAL"/>
    <button onClick={()=>go("registrar_mascota")} className="w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 mb-4" style={{background:C.brand}}><Plus size={18}/> Registrar una mascota</button>
    {mascotas.length===0 ? <Empty text="Todavía no registraste ninguna mascota. Registrala para tener su QR de seguridad."/> :
    <div className="space-y-3">{mascotas.map(m=>{ const avisos=avistamientos.filter(a=>a.mascota_codigo===m.codigo).length; return (
      <div key={m.id} className="rounded-2xl overflow-hidden" style={{background:C.surface,border:`1px solid ${C.line}`}}>
        <div className="flex items-center gap-3 p-3">
          {m.photo? <img src={m.photo} alt="" className="w-14 h-14 rounded-xl object-cover"/> : <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{background:C.brandSoft}}>🐾</div>}
          <div className="flex-1 min-w-0"><div className="font-bold text-sm">{m.pet_name||m.petName}</div><div className="text-[11px]" style={{color:C.muted}}>{m.species}{m.color?" · "+m.color:""} · código {m.codigo}</div>{avisos>0&&<div className="text-[11px] font-bold mt-0.5" style={{color:C.found}}>📍 {avisos} aviso{avisos>1?"s":""} de avistamiento</div>}</div>
        </div>
        <div className="flex gap-2 px-3 pb-3">
          <button onClick={()=>irQr(m)} className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white" style={{background:C.brand}}>Ver / imprimir QR</button>
          <button onClick={()=>onDelete(m.id)} className="py-2.5 px-3 rounded-xl text-xs font-bold" style={{background:"#FBE7E7",color:C.lost}}><Trash2 size={14}/></button>
        </div>
      </div>);})}</div>}
  </div>);
}

/* ------------------------------- Contacto -------------------------------- */
const TIPOS_CONTACTO=["Publicidad","Sumar refugio","Sugerencia","Otro"];
function ContactoView({ go, onSend }){
  const [f,setF]=useState({nombre:"",contacto:"",tipo:TIPOS_CONTACTO[0],mensaje:""});
  const [busy,setBusy]=useState(false);const [ok,setOk]=useState(false);
  const set=(k,v)=>setF(s=>({...s,[k]:v}));
  const enviar=async()=>{ if(!f.nombre||!f.contacto||!f.mensaje)return; setBusy(true); const r=await onSend(f); setBusy(false); if(r)setOk(true); };
  if(ok)return (<div className="px-4 pt-10 text-center"><div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center" style={{background:C.brandSoft}}><Check size={32} color={C.brand}/></div><h2 className="text-xl font-extrabold mt-3">¡Mensaje enviado! 🎉</h2><p className="text-sm mt-1" style={{color:C.muted}}>Gracias por escribirnos. Te vamos a responder pronto.</p><button onClick={()=>go("home")} className="mt-5 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.brand}}>Volver al inicio</button></div>);
  const canSend=f.nombre&&f.contacto&&f.mensaje;
  return (<div className="px-4 pb-6"><Title back={()=>go("home")} title="Contacto" tag="FUNCIONAL"/>
    <div className="rounded-2xl p-3 mb-4 text-[12px] flex gap-2" style={{background:C.brandSoft,color:C.ink}}><Mail size={16} className="shrink-0 mt-0.5" style={{color:C.brand}}/><span>¿Querés publicitar tu negocio, sumar un refugio o hacer una sugerencia? Escribinos y te contactamos.</span></div>
    <div className="space-y-3">
      <Field label="Nombre *"><input value={f.nombre} onChange={e=>set("nombre",e.target.value)} className="inp" placeholder="Tu nombre"/></Field>
      <Field label="Teléfono / WhatsApp / Email *"><input value={f.contacto} onChange={e=>set("contacto",e.target.value)} className="inp" placeholder="Cómo te contactamos"/></Field>
      <Field label="Tipo de consulta"><select value={f.tipo} onChange={e=>set("tipo",e.target.value)} className="inp">{TIPOS_CONTACTO.map(t=><option key={t}>{t}</option>)}</select></Field>
      <Field label="Mensaje *"><textarea value={f.mensaje} onChange={e=>set("mensaje",e.target.value)} rows={4} className="inp" placeholder="Contanos en qué podemos ayudarte…"/></Field>
    </div>
    <button onClick={enviar} disabled={busy||!canSend} className="mt-5 w-full py-3.5 rounded-2xl font-bold text-white text-[15px] flex items-center justify-center gap-2" style={{background:canSend?C.brand:C.line}}>{busy&&<Loader2 size={18} className="animate-spin"/>}Enviar mensaje</button>
  </div>);
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
          {isAdmin(user) && <button onClick={()=>go("costs")} className="mt-4 w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2" style={{background:C.surface,border:`1px solid ${C.line}`}}><Wallet size={16} color={C.brand}/> Control de costos</button>}
          <button onClick={onSignOut} className="mt-2 mb-2 w-full py-3 rounded-2xl font-bold flex items-center justify-center gap-2" style={{color:C.lost,border:`1px solid ${C.line}`}}><LogOut size={16}/> Cerrar sesión</button>
        </>
      ):(
        <div className="rounded-2xl p-6 text-center" style={{background:C.surface,border:`1px solid ${C.line}`}}><CircleUserRound size={40} className="mx-auto" color={C.brand}/><p className="font-bold mt-2">Ingresá a tu cuenta</p><p className="text-[13px] mt-1" style={{color:C.muted}}>Para publicar, editar y seguir tus mascotas.</p><button onClick={()=>go("auth")} className="mt-4 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.brand}}>Ingresar / Registrarme</button></div>
      )}
    </div>
  );
}
function Stat({ n, l }){ return <div className="rounded-2xl py-3 text-center" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="text-xl font-extrabold" style={{color:C.brand}}>{n}</div><div className="text-[10px] font-semibold" style={{color:C.muted}}>{l}</div></div>; }

/* ---------------------------- Administración ----------------------------- */
function AdminLocked({ go }){ return <div className="px-4"><Title back={()=>go("home")} title="Administración" tag="FUNCIONAL"/><div className="rounded-2xl p-6 text-center" style={{background:C.surface,border:`1px solid ${C.line}`}}><Shield size={38} className="mx-auto" color={C.brand}/><p className="font-bold mt-2">Solo administradores</p><p className="text-[13px] mt-1" style={{color:C.muted}}>Ingresá con un email de la lista ADMIN_EMAILS para acceder.</p><button onClick={()=>go("auth")} className="mt-4 w-full py-3 rounded-2xl font-bold text-white" style={{background:C.brand}}>Ingresar</button></div></div>; }
function AdminView({ posts, reports, approve, removePost, go, clearReport, conn, mensajes=[], borrarMensaje, lugares=[], guardarLugar, borrarLugar, avistamientos=[], borrarAvistamiento }){
  const [tab,setTab]=useState("stats");const [fBarrio,setFBarrio]=useState("all"),[fStatus,setFStatus]=useState("all"),[fSp,setFSp]=useState("all");
  const real=posts;const total=real.length;const lost=real.filter(p=>p.type==="lost").length;const found=real.filter(p=>p.type==="found").length;const seen=real.filter(p=>p.type==="seen").length;const reunited=real.filter(p=>p.status==="reunited").length;const recovered=real.filter(p=>p.status==="reunited"||p.status==="found").length;const pct=total?Math.round(recovered/total*100):0;
  const byBarrio=BARRIO_LIST.map(b=>({b,n:real.filter(p=>p.barrio===b).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n).slice(0,8);const maxB=Math.max(1,...byBarrio.map(x=>x.n));
  const repB=BARRIO_LIST.map(b=>({b,n:reports.filter(r=>r.barrio===b).length})).filter(x=>x.n).sort((a,b)=>b.n-a.n).slice(0,5);
  const filtered=posts.filter(p=>(fBarrio==="all"||p.barrio===fBarrio)&&(fStatus==="all"||p.status===fStatus)&&(fSp==="all"||p.species===fSp));
  return (
    <div className="px-4">
      <Title back={()=>go("home")} title="Panel administrador" tag="FUNCIONAL"/>
      {conn!=="cloud"&&<div className="rounded-2xl p-2.5 mb-2 text-[11px] flex items-center gap-1.5" style={{background:"#FFF7E6",border:"1px solid #F3E1B5",color:"#7A5B14"}}><CloudOff size={13}/> Modo local: la moderación afecta solo este dispositivo.</div>}
      <div className="flex gap-2 mb-3 overflow-x-auto mp-scroll -mx-4 px-4">{[["stats","Estadísticas"],["mod","Moderación"],["reports",`Reportes${reports.length?` (${reports.length})`:""}`],["mensajes",`Mensajes${mensajes.length?` (${mensajes.length})`:""}`],["avistamientos",`Avistamientos${avistamientos.length?` (${avistamientos.length})`:""}`],["lugares","Lugares"],["estado","Estado"]].map(([k,l])=><button key={k} onClick={()=>setTab(k)} className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold" style={{background:tab===k?C.ink:C.surface,color:tab===k?"#fff":C.muted,border:`1px solid ${tab===k?C.ink:C.line}`}}>{l}</button>)}</div>

      {tab==="stats"&&(<div className="space-y-3 mb-2"><div className="rounded-2xl p-4 text-center" style={{background:`linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`,color:"#fff"}}><div className="text-4xl font-extrabold">{pct}%</div><div className="text-[12px] font-semibold opacity-90">porcentaje de recuperación</div></div><div className="grid grid-cols-2 gap-2.5"><Kpi n={total} l="Total publicaciones" c={C.ink}/><Kpi n={reunited} l="Reunidas con familia" c={C.reunited}/><Kpi n={lost} l="Perdidas" c={C.lost}/><Kpi n={found} l="Encontradas" c={C.found}/><Kpi n={seen} l="Vistas" c={C.seen}/><Kpi n={reports.length} l="Reportes" c={C.muted}/></div><div className="rounded-2xl p-4" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="font-bold text-sm mb-3">Publicaciones por barrio</div><Bars data={byBarrio} max={maxB} color={C.brand}/></div>{repB.length>0&&<div className="rounded-2xl p-4" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="font-bold text-sm mb-3">Barrios con más reportes</div><Bars data={repB} max={Math.max(1,...repB.map(x=>x.n))} color={C.lost}/></div>}</div>)}

      {tab==="mod"&&(<div className="mb-2"><div className="flex gap-2 mb-3 overflow-x-auto mp-scroll -mx-4 px-4"><Sel value={fBarrio} onChange={setFBarrio} options={[["all","Barrio"],...BARRIO_LIST.map(b=>[b,b])]}/><Sel value={fStatus} onChange={setFStatus} options={[["all","Estado"],...Object.entries(STATUS).map(([k,v])=>[k,v.label])]}/><Sel value={fSp} onChange={setFSp} options={[["all","Especie"],["perro","Perro"],["gato","Gato"],["otro","Otro"]]}/></div><div className="text-[12px] font-semibold mb-2" style={{color:C.muted}}>{filtered.length} publicación{filtered.length!==1?"es":""}</div><div className="space-y-2.5">{filtered.map(p=>(<div key={p.id} className="rounded-2xl p-2.5 flex items-center gap-2.5" style={{background:C.surface,border:`1px solid ${p.reported?C.lost:C.line}`,opacity:p.approved===false?0.55:1}}><div className="w-11 h-11 rounded-xl overflow-hidden shrink-0"><Thumb post={p} h={44}/></div><button onClick={()=>go("detail",{post:p})} className="flex-1 min-w-0 text-left"><div className="text-[10px] font-bold" style={{color:TYPE[p.type].dot}}>{TYPE[p.type].label} · {STATUS[p.status].label}{p.demo?" · DEMO":""}{p.reported?" · ⚠":""}</div><div className="font-bold text-sm truncate">{p.petName||p.species} · {ubicTxt(p)}</div></button><div className="flex gap-1.5 shrink-0"><button onClick={()=>approve(p.id,p.approved===false)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:p.approved===false?C.found:C.bg}}>{p.approved===false?<Check size={15} color="#fff"/>:<EyeOff size={15} color={C.muted}/>}</button><button onClick={()=>removePost(p.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"#FBE7E7"}}><Trash2 size={15} color={C.lost}/></button></div></div>))}</div></div>)}

      {tab==="reports"&&(<div className="space-y-2.5 mb-2">{reports.length===0?<Empty text="No hay reportes pendientes."/>:reports.map(r=>(<div key={r.id} className="rounded-2xl p-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="flex items-center justify-between"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white" style={{background:C.lost}}>{r.reason}</span><span className="text-[10px]" style={{color:C.muted}}>{timeAgo(r.date)}</span></div><div className="font-bold text-sm mt-1.5">{r.postName} · {r.barrio}</div>{r.note&&<div className="text-[12px] mt-0.5" style={{color:C.muted}}>{r.note}</div>}<div className="flex gap-2 mt-2"><button onClick={()=>{const p=posts.find(x=>x.id===r.postId);if(p)go("detail",{post:p});}} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{background:C.bg,border:`1px solid ${C.line}`}}>Ver</button><button onClick={()=>clearReport(r.id)} className="flex-1 py-2 rounded-xl text-xs font-bold text-white" style={{background:C.found}}>Resolver</button><button onClick={()=>removePost(r.postId)} className="py-2 px-3 rounded-xl text-xs font-bold" style={{background:"#FBE7E7",color:C.lost}}><Ban size={14}/></button></div></div>))}</div>)}

      {tab==="mensajes"&&(<div className="space-y-2.5 mb-2">{mensajes.length===0?<Empty text="No hay mensajes todavía. Acá vas a ver lo que te escriban desde Contacto."/>:mensajes.map(m=>(<div key={m.id} className="rounded-2xl p-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="flex items-center justify-between"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{background:C.brandSoft,color:C.brandDeep}}>{m.tipo||"Consulta"}</span><span className="text-[10px]" style={{color:C.muted}}>{timeAgo(m.created_at)}</span></div><div className="font-bold text-sm mt-1.5">{m.nombre}</div><div className="text-[12px] flex items-center gap-1.5 mt-0.5" style={{color:C.brand}}><Phone size={11}/> {m.contacto}</div><div className="text-[13px] mt-1.5">{m.mensaje}</div><div className="flex gap-2 mt-2">{digits(m.contacto)&&<a href={`https://wa.me/${digits(m.contacto)}`} target="_blank" rel="noreferrer" className="flex-1 py-2 rounded-xl text-xs font-bold text-white text-center" style={{background:C.found}}>Responder por WhatsApp</a>}<button onClick={()=>borrarMensaje(m.id)} className="py-2 px-3 rounded-xl text-xs font-bold" style={{background:"#FBE7E7",color:C.lost}}><Trash2 size={14}/></button></div></div>))}</div>)}

      {tab==="avistamientos"&&(<div className="space-y-2.5 mb-2">{avistamientos.length===0?<Empty text="No hay avistamientos todavía. Acá vas a ver los avisos de gente que escaneó un QR."/>:avistamientos.map(a=>(<div key={a.id} className="rounded-2xl p-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="flex items-center justify-between"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{background:C.brandSoft,color:C.brandDeep}}>🐾 {a.mascota_nombre||a.mascota_codigo}</span><span className="text-[10px]" style={{color:C.muted}}>{timeAgo(a.created_at)}</span></div><div className="text-[13px] mt-1.5"><b>{a.quien}</b> la vio{a.zona?` en ${a.zona}`:""}</div>{a.nota&&<div className="text-[12px] mt-0.5" style={{color:C.muted}}>{a.nota}</div>}<div className="text-[12px] flex items-center gap-1.5 mt-1" style={{color:C.brand}}><Phone size={11}/> {a.contacto}</div><div className="flex gap-2 mt-2">{digits(a.contacto)&&<a href={`https://wa.me/${digits(a.contacto)}`} target="_blank" rel="noreferrer" className="flex-1 py-2 rounded-xl text-xs font-bold text-white text-center" style={{background:C.found}}>Contactar por WhatsApp</a>}<button onClick={()=>borrarAvistamiento(a.id)} className="py-2 px-3 rounded-xl text-xs font-bold" style={{background:"#FBE7E7",color:C.lost}}><Trash2 size={14}/></button></div></div>))}</div>)}

      {tab==="lugares"&&<LugaresAdmin lugares={lugares} guardarLugar={guardarLugar} borrarLugar={borrarLugar}/>}

      {tab==="estado"&&<AuditPanel conn={conn}/>}
    </div>
  );
}
function Sel({ value, onChange, options }){ return <select value={value} onChange={e=>onChange(e.target.value)} className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold" style={{background:C.surface,border:`1px solid ${C.line}`,color:C.ink}}>{options.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>; }

function LugaresAdmin({ lugares=[], guardarLugar, borrarLugar }){
  const vacio={ id:null, kind:"veterinaria", name:"", barrio:"", address:"", phone:"", whatsapp:"", hours:"", emerg:false };
  const [f,setF]=useState(vacio);const [editando,setEditando]=useState(false);const [busy,setBusy]=useState(false);
  const set=(k,v)=>setF(s=>({...s,[k]:v}));
  const KIND=[["veterinaria","Veterinaria"],["refugio","Refugio"],["negocio","Negocio"]];
  const editar=(l)=>{ setF({id:l.id,kind:l.kind,name:l.name,barrio:l.barrio||"",address:l.address||"",phone:l.phone||"",whatsapp:l.whatsapp||"",hours:l.hours||"",emerg:!!l.emerg}); setEditando(true); window.scrollTo(0,0); };
  const cancelar=()=>{ setF(vacio); setEditando(false); };
  const guardar=async()=>{ if(!f.name){return;} setBusy(true); const r=await guardarLugar(f); setBusy(false); if(r)cancelar(); };
  return (
    <div className="mb-2">
      <div className="rounded-2xl p-4 mb-3" style={{background:C.surface,border:`1px solid ${C.line}`}}>
        <div className="font-extrabold text-sm mb-3 flex items-center gap-1.5">{editando?<><Pencil size={15} color={C.brand}/> Editar lugar</>:<><Plus size={15} color={C.brand}/> Agregar lugar</>}</div>
        <div className="space-y-3">
          <Field label="Tipo"><select value={f.kind} onChange={e=>set("kind",e.target.value)} className="inp">{KIND.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Nombre *"><input value={f.name} onChange={e=>set("name",e.target.value)} className="inp" placeholder="Ej: Veterinaria San Roque"/></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Teléfono"><input inputMode="numeric" value={f.phone} onChange={e=>set("phone",e.target.value)} className="inp" placeholder="3764..."/></Field><Field label="WhatsApp"><input inputMode="numeric" value={f.whatsapp} onChange={e=>set("whatsapp",e.target.value)} className="inp" placeholder="igual al teléfono"/></Field></div>
          <Field label="Dirección"><input value={f.address} onChange={e=>set("address",e.target.value)} className="inp" placeholder="Calle y número"/></Field>
          <div className="grid grid-cols-2 gap-3"><Field label="Barrio"><select value={f.barrio} onChange={e=>set("barrio",e.target.value)} className="inp"><option value="">—</option>{BARRIO_LIST.map(b=><option key={b}>{b}</option>)}</select></Field><Field label="Horario"><input value={f.hours} onChange={e=>set("hours",e.target.value)} className="inp" placeholder="Lun a Sáb 8–20"/></Field></div>
          <label className="flex items-center gap-2 text-sm font-semibold" style={{color:C.ink}}><input type="checkbox" checked={f.emerg} onChange={e=>set("emerg",e.target.checked)}/> Atiende urgencias 24h</label>
        </div>
        <div className="flex gap-2 mt-4"><button onClick={guardar} disabled={busy||!f.name} className="flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{background:f.name?C.brand:C.line}}>{busy&&<Loader2 size={16} className="animate-spin"/>}{editando?"Guardar cambios":"Agregar"}</button>{editando&&<button onClick={cancelar} className="px-4 py-3 rounded-2xl font-bold" style={{background:C.surface,border:`1px solid ${C.line}`}}>Cancelar</button>}</div>
      </div>
      <div className="text-[12px] font-semibold mb-2" style={{color:C.muted}}>{lugares.length} lugar{lugares.length!==1?"es":""} cargado{lugares.length!==1?"s":""}</div>
      <div className="space-y-2">{lugares.map(l=>(<div key={l.id} className="rounded-2xl p-3 flex items-center gap-3" style={{background:C.surface,border:`1px solid ${C.line}`}}><div className="flex-1 min-w-0"><div className="font-bold text-sm truncate">{l.name} {l.emerg&&<span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{background:C.lost}}>24h</span>}</div><div className="text-[11px]" style={{color:C.muted}}>{l.kind}{l.barrio?" · "+l.barrio:""}{l.phone?" · "+l.phone:""}</div></div><button onClick={()=>editar(l)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:C.brandSoft}}><Pencil size={14} color={C.brand}/></button><button onClick={()=>borrarLugar(l.id)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:"#FBE7E7"}}><Trash2 size={14} color={C.lost}/></button></div>))}</div>
    </div>
  );
}
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

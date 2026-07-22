import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Bell, BellRing, ClipboardList, PackageCheck, Pencil, Printer, RefreshCw, Truck, WalletCards } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { formatCaseType, formatMeasurementLine, normalizeOrderMeasurements } from "@shared/orderMeasurements";

type OrderStatus = "pending" | "confirmed" | "production" | "preparing" | "shipping" | "delivered" | "cancelled";
type Order = { id:number; orderNumber:string; status:OrderStatus; fabricName?:string|null; fabricColor?:string|null; profileColor?:string|null; mountType?:string|null; caseType?:string|null; width?:string|number|null; height?:string|number|null; quantity?:number|null; measurements?:unknown; totalPrice:string|number; customerName?:string|null; customerPhone?:string|null; customerAddress?:string|null; customerCity?:string|null; customerNote?:string|null; createdAt:string|Date };
const statusLabels: Record<OrderStatus,string> = { pending:"Bekliyor", confirmed:"Onaylandı", production:"İmalatta", preparing:"Hazırlanıyor", shipping:"Kargoda", delivered:"Teslim Edildi", cancelled:"İptal Edildi" };
const statusOptions = Object.entries(statusLabels) as Array<[OrderStatus,string]>;
const LAST_ORDER_KEY = "rgnfix-admin-last-order-id";
const money = (value:string|number) => new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",maximumFractionDigits:2}).format(Number(value||0));
const date = (value:string|Date) => new Intl.DateTimeFormat("tr-TR",{dateStyle:"short",timeStyle:"short"}).format(new Date(value));
const esc = (value:unknown) => String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const titleCase = (value:unknown) => String(value??"").trim().replace(/(^|\s)\S/g, letter => letter.toLocaleUpperCase("tr-TR"));
const mountName = (value:unknown) => ({ vidali:"Vidalı", kancali:"Kancalı", yapisma:"Yapıştırma", "rgn-pen":"RGN PEN" }[String(value??"")] || titleCase(value));

function printOrder(order:Order){
  const popup=window.open("","_blank","width=620,height=900"); if(!popup) return void toast.error("Yazdırma penceresi engellendi.");
  const measurements = normalizeOrderMeasurements(order);
  const measurementRows = measurements.map((item, index) => `<tr><td>${index + 1}</td><td>${esc(item.label)}</td><td>${esc(item.width)} cm</td><td>${esc(item.height)} cm</td><td>${esc(item.quantity)}</td></tr>`).join("");
  const customerAddress = [order.customerCity, order.customerAddress].filter(Boolean).join(" ");
  popup.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Sipariş ${esc(order.orderNumber)}</title><style>
    @page{size:A5 portrait;margin:8mm}
    *{box-sizing:border-box}
    body{margin:0;background:#f4f7f8;color:#102033;font-family:Inter,Arial,sans-serif;font-size:11px;line-height:1.45}
    .sheet{min-height:194mm;background:#fff;border:1.6mm solid #102033;padding:8mm;position:relative}
    .top{display:grid;grid-template-columns:1fr auto;gap:8mm;align-items:start;border-bottom:1px solid #d6dee2;padding-bottom:6mm}
    .brand{font-size:28px;font-weight:900;letter-spacing:1.2px;color:#102033}
    .subtitle{margin-top:1mm;color:#637082;font-size:9px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase}
    .meta{text-align:right}
    .meta .no{font-size:16px;font-weight:900;color:#102033}
    .meta .date{margin-top:1mm;color:#637082;font-size:10px}
    .status{display:inline-block;margin-top:2mm;border:1px solid #cbd6dc;border-radius:999px;padding:1mm 3mm;color:#344154;font-size:9px;font-weight:800;text-transform:uppercase}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:6mm}
    .card{border:1px solid #dce4e8;border-radius:3mm;overflow:hidden}
    .card h2{margin:0;background:#f2f7f8;border-bottom:1px solid #dce4e8;padding:2.5mm 3mm;color:#102033;font-size:10px;letter-spacing:1.1px;text-transform:uppercase}
    .body{padding:2mm 3mm}
    .field{display:grid;grid-template-columns:24mm 1fr;gap:3mm;border-bottom:1px solid #edf1f3;padding:1.8mm 0}
    .field:last-child{border-bottom:0}
    .label{color:#667386;font-size:9px;font-weight:700;text-transform:uppercase}
    .value{color:#102033;font-weight:800}
    .full{margin-top:4mm}
    table{width:100%;border-collapse:collapse}
    th{background:#102033;color:#fff;padding:2.2mm 2mm;text-align:left;font-size:8.5px;letter-spacing:.6px;text-transform:uppercase}
    td{border-bottom:1px solid #e6edf0;padding:2.2mm 2mm;font-weight:800}
    td:first-child{width:8mm;color:#667386}
    th:nth-child(3),th:nth-child(4),th:nth-child(5),td:nth-child(3),td:nth-child(4),td:nth-child(5){text-align:right}
    .note{min-height:19mm;white-space:pre-wrap;color:#28374a}
    .summary{display:grid;grid-template-columns:1fr 42mm;gap:4mm;align-items:stretch;margin-top:5mm}
    .terms{border:1px solid #dce4e8;border-radius:3mm;padding:3mm;color:#637082;font-size:9px}
    .total{background:#102033;color:#fff;border-radius:3mm;padding:4mm;text-align:right}
    .total span{display:block;color:#b9c9d0;font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase}
    .total b{display:block;margin-top:1mm;font-size:20px}
    .footer{position:absolute;left:8mm;right:8mm;bottom:5mm;display:flex;justify-content:space-between;border-top:1px solid #d6dee2;padding-top:2mm;color:#637082;font-size:8.5px}
  </style></head><body onload="window.print()"><div class="sheet">
    <div class="top"><div><div class="brand">RGNFIX</div><div class="subtitle">Plise perde sipariş formu</div></div><div class="meta"><div class="no">#${esc(order.orderNumber)}</div><div class="date">${esc(date(order.createdAt))}</div><div class="status">${esc(statusLabels[order.status] || order.status)}</div></div></div>
    <div class="grid">
      <section class="card"><h2>Müşteri Bilgileri</h2><div class="body"><div class="field"><div class="label">Müşteri</div><div class="value">${esc(order.customerName)}</div></div><div class="field"><div class="label">Telefon</div><div class="value">${esc(order.customerPhone)}</div></div><div class="field"><div class="label">Adres</div><div class="value">${esc(customerAddress)}</div></div></div></section>
      <section class="card"><h2>Ürün Bilgileri</h2><div class="body"><div class="field"><div class="label">Ürün</div><div class="value">${esc(order.fabricName)}</div></div><div class="field"><div class="label">Varyant</div><div class="value">${esc(order.fabricColor)}</div></div><div class="field"><div class="label">Profil</div><div class="value">${esc(titleCase(order.profileColor))}</div></div><div class="field"><div class="label">Montaj</div><div class="value">${esc(mountName(order.mountType))}</div></div><div class="field"><div class="label">Kasa</div><div class="value">${esc(formatCaseType(order.caseType))}</div></div></div></section>
    </div>
    <section class="card full"><h2>Ölçüler</h2><table><thead><tr><th>#</th><th>Alan</th><th>En</th><th>Boy</th><th>Adet</th></tr></thead><tbody>${measurementRows}</tbody></table></section>
    <section class="card full"><h2>Sipariş Notu</h2><div class="body note">${esc(order.customerNote || "Not eklenmedi.")}</div></section>
    <div class="summary"><div class="terms">Ölçüler müşteri beyanına göre özel üretime alınır. Üretim öncesi ürün, profil, montaj ve ölçü bilgilerini kontrol ediniz.</div><div class="total"><span>Toplam Tutar</span><b>${esc(money(order.totalPrice))}</b></div></div>
    <div class="footer"><span>RGNFIX · rgnfix.com</span><span>WhatsApp: 0530 028 89 03</span></div>
  </div></body></html>`); popup.document.close();
}

export default function AdminPanel(){
  const {user,loading:authLoading}=useAuth({redirectOnUnauthenticated:true,redirectPath:"/giris"});
  const [orders,setOrders]=useState<Order[]>([]); const ordersRef=useRef<Order[]>([]); const audioRef=useRef<AudioContext|null>(null);
  const [loading,setLoading]=useState(true); const [error,setError]=useState(""); const [demoMode,setDemoMode]=useState(false); const [updatingId,setUpdatingId]=useState<number|null>(null);
  const [permission,setPermission]=useState<NotificationPermission>(typeof Notification==="undefined"?"denied":Notification.permission); const firstLoad=useRef(true);

  const playSound=useCallback(()=>{try{const C=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!C)return;const ctx=audioRef.current||new C();audioRef.current=ctx;void ctx.resume();const now=ctx.currentTime;[740,988,1318,1760].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;o.type="sine";g.gain.setValueAtTime(.0001,now+i*.14);g.gain.exponentialRampToValueAtTime(.28,now+i*.14+.02);g.gain.exponentialRampToValueAtTime(.0001,now+i*.14+.12);o.connect(g).connect(ctx.destination);o.start(now+i*.14);o.stop(now+i*.14+.14)});}catch(e){console.warn(e)}},[]);
  const notify=useCallback((items:Order[])=>{if(!items.length)return;playSound();const newest=items[0];toast.success(`Yeni sipariş: #${newest.orderNumber}`);if(typeof Notification!=="undefined"&&Notification.permission==="granted")new Notification("RGNFIX Yeni Sipariş",{body:`#${newest.orderNumber} · ${newest.customerName||"Müşteri"} · ${money(newest.totalPrice)}`,icon:"/favicon.ico"});},[playSound]);
  const loadOrders=useCallback(async(silent=false)=>{if(!silent)setLoading(true);try{const r=await fetch("/api/admin/orders",{credentials:"include"});const d=await r.json();if(!r.ok)throw new Error(d.error||"Siparişler yüklenemedi.");const next=d.orders||[];const max=next.reduce((m: number,o:Order)=>Math.max(m,Number(o.id)),0);const stored=Number(localStorage.getItem(LAST_ORDER_KEY)||"0");const current=ordersRef.current.reduce((m,o)=>Math.max(m,Number(o.id)),0);if(!firstLoad.current||stored>0)notify(next.filter((o:Order)=>Number(o.id)>Math.max(stored,current)));if(max>0)localStorage.setItem(LAST_ORDER_KEY,String(max));firstLoad.current=false;ordersRef.current=next;setOrders(next);setDemoMode(Boolean(d.demoMode));setError("");}catch(e){setError(e instanceof Error?e.message:"Siparişler yüklenemedi.");}finally{if(!silent)setLoading(false)}},[notify]);
  useEffect(()=>{if(user?.role!=="admin")return;void loadOrders();const timer=window.setInterval(()=>void loadOrders(true),8000);return()=>window.clearInterval(timer)},[user?.role,loadOrders]);
  const enable=async()=>{playSound();if(typeof Notification==="undefined")return void toast.error("Tarayıcı bildirim desteklemiyor.");const p=await Notification.requestPermission();setPermission(p);toast.success(p==="granted"?"Sipariş sesi ve bildirim açıldı.":"Panel açıkken sipariş sesi çalışacak.")};
  const updateStatus=async(id:number,status:OrderStatus)=>{setUpdatingId(id);try{const r=await fetch(`/api/admin/orders/${id}/status`,{method:"PATCH",headers:{"content-type":"application/json"},credentials:"include",body:JSON.stringify({status})});const d=await r.json();if(!r.ok)throw new Error(d.error);const next=ordersRef.current.map(o=>o.id===id?{...o,status}:o);ordersRef.current=next;setOrders(next);toast.success("Durum güncellendi.");}catch(e){setError(e instanceof Error?e.message:"Durum güncellenemedi.");}finally{setUpdatingId(null)}};
  const totals=useMemo(()=>({total:orders.length,production:orders.filter(o=>["confirmed","production","preparing"].includes(o.status)).length,shipping:orders.filter(o=>o.status==="shipping").length,revenue:orders.reduce((s,o)=>s+Number(o.totalPrice||0),0)}),[orders]);

  if(authLoading)return <div className="container py-16 text-center">Yükleniyor…</div>;
  if(!user||user.role!=="admin")return <div className="container py-16 text-center">Yetkisiz erişim</div>;
  return <div className="container py-8 space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-medium text-primary">RGNFIX Yönetim</p><h1 className="text-3xl font-bold">Sipariş Yönetim Paneli</h1><p className="text-sm text-muted-foreground">Hoş geldiniz, {user.name||"Yönetici"}.</p></div><div className="flex flex-wrap gap-2"><Button variant={permission==="granted"?"secondary":"outline"} onClick={()=>void enable()}>{permission==="granted"?<BellRing className="mr-2 h-4 w-4"/>:<Bell className="mr-2 h-4 w-4"/>}Ses ve Bildirimi Aç</Button><Button asChild variant="outline"><Link href="/yonetici/fiyatlar">Fiyat Yönetimi</Link></Button><Button variant="outline" onClick={()=>void loadOrders()}><RefreshCw className="mr-2 h-4 w-4"/>Yenile</Button></div></div>
    {demoMode&&<div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Veritabanı bağlı değil.</div>}{error&&<div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat icon={<ClipboardList/>} value={totals.total} label="Toplam sipariş"/><Stat icon={<PackageCheck/>} value={totals.production} label="Hazırlanan"/><Stat icon={<Truck/>} value={totals.shipping} label="Kargoda"/><Stat icon={<WalletCards/>} value={money(totals.revenue)} label="Toplam tutar"/></div>
    <Card className="overflow-hidden"><div className="border-b p-5 font-semibold">Siparişler</div>{loading?<div className="p-10 text-center">Yükleniyor…</div>:orders.length===0?<div className="p-10 text-center text-muted-foreground">Henüz sipariş yok.</div>:<div className="overflow-x-auto"><table className="w-full min-w-[1320px] text-sm"><thead className="bg-muted/60 text-left"><tr>{["Sipariş","Müşteri","Ürün","Ölçü","Tutar","Tarih","Durum","İşlem"].map(h=><th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y">{orders.map(o=>{const orderMeasurements=normalizeOrderMeasurements(o);return <tr key={o.id} className="align-top"><td className="px-4 py-4 font-bold">#{o.orderNumber}</td><td className="px-4 py-4"><b>{o.customerName||"—"}</b><br/>{o.customerPhone}<p className="max-w-60 text-xs text-muted-foreground">{o.customerCity} {o.customerAddress}</p></td><td className="px-4 py-4"><b>{o.fabricName}</b><p className="text-xs text-muted-foreground">{o.fabricColor} / {o.profileColor}<br/>{o.mountType} / {formatCaseType(o.caseType)}</p></td><td className="px-4 py-4"><div className="space-y-1">{orderMeasurements.map((item,index)=><p key={`${item.label}-${index}`}>{formatMeasurementLine(item)}</p>)}</div></td><td className="px-4 py-4 font-bold">{money(o.totalPrice)}</td><td className="px-4 py-4">{date(o.createdAt)}</td><td className="px-4 py-4"><select value={o.status} onChange={e=>void updateStatus(o.id,e.target.value as OrderStatus)} disabled={updatingId===o.id} className="h-9 rounded-lg border bg-background px-2">{statusOptions.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></td><td className="px-4 py-4"><div className="flex gap-2"><Button asChild size="sm"><Link href={`/yonetici/siparis/${o.id}/duzenle`}><Pencil className="mr-2 h-4 w-4"/>Tam Düzenle</Link></Button><Button size="sm" variant="outline" onClick={()=>printOrder(o)}><Printer className="mr-2 h-4 w-4"/>A5</Button></div></td></tr>})}</tbody></table></div>}</Card>
  </div>;
}
function Stat({icon,value,label}:{icon:React.ReactNode;value:React.ReactNode;label:string}){return <Card className="p-5"><div className="h-5 w-5 text-primary">{icon}</div><p className="mt-4 text-2xl font-bold">{value}</p><p className="text-sm text-muted-foreground">{label}</p></Card>}

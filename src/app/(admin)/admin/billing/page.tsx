'use client';

import { useCallback, useEffect, useState } from 'react';
import { Banknote, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Loader2, RefreshCw, Search, ShieldOff, WalletCards, Wifi, WifiOff, Link2Off, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const rupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

type NetworkSync = {
  status: 'SYNCED' | 'PENDING' | 'FAILED' | 'UNMAPPED' | 'NOT_FOUND';
  pppoeStatus: 'ONLINE' | 'OFFLINE' | 'ISOLATED' | 'DISABLED' | null;
  mode: 'SIMULATION' | 'LIVE' | null;
  message: string;
};

type Invoice = {
  id:string;
  amount:number;
  dueDate:string;
  status:string;
  networkSync:NetworkSync;
  customer:{
    id:string;
    customerNumber?:string;
    fullName:string;
    pppoeUsername?:string;
    serviceStatus?:string;
    packageExcel?:string;
    package?:{name:string}|null;
  };
};

type Data = {
  invoices:Invoice[];
  stats:{total:number;unpaid:number;overdue:number;paid:number;revenue:number};
  period:string;
  mikrotik:{mode:'SIMULATION'|'LIVE'|null;routerStatus:'ONLINE'|'OFFLINE';generatedAt:string|null;error:string|null};
  pagination:{page:number;pageSize:number;total:number;totalPages:number};
};

const syncBadge = (sync: NetworkSync) => {
  if (sync.status === 'SYNCED') return <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">SYNCED</Badge>;
  if (sync.status === 'PENDING') return <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">PENDING</Badge>;
  if (sync.status === 'FAILED') return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">FAILED</Badge>;
  if (sync.status === 'NOT_FOUND') return <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">PPPoE TIDAK DITEMUKAN</Badge>;
  return <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">BELUM ADA PPPoE</Badge>;
};

const pppoeBadge = (status: NetworkSync['pppoeStatus']) => {
  if (!status) return <span className="text-xs text-gray-400">-</span>;
  if (status === 'ONLINE') return <Badge className="bg-emerald-600">ONLINE</Badge>;
  if (status === 'OFFLINE') return <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">OFFLINE</Badge>;
  return <Badge className="bg-red-600">{status}</Badge>;
};

export default function BillingPage() {
  const [data,setData]=useState<Data|null>(null);
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('');
  const [page,setPage]=useState(1);
  const [loading,setLoading]=useState(true);
  const [refreshing,setRefreshing]=useState(false);
  const [workingId,setWorkingId]=useState<string|null>(null);

  const load=useCallback(async(showLoader=true)=>{
    if(showLoader && !data) setLoading(true); else setRefreshing(true);
    try {
      const q=new URLSearchParams({page:String(page),pageSize:'50'});
      if(search) q.set('search',search);
      if(status) q.set('status',status);
      const r=await fetch(`/api/admin/billing?${q}`,{cache:'no-store'});
      if(!r.ok) throw new Error('Gagal memuat billing');
      setData(await r.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  },[search,status,page,data]);

  useEffect(()=>{
    const t=setTimeout(()=>load(!data),250);
    return()=>clearTimeout(t);
  },[search,status,page]);

  const changeStatus=(value:string)=>{setStatus(value);setPage(1);};
  const changeSearch=(value:string)=>{setSearch(value);setPage(1);};

  const generate=async()=>{
    setRefreshing(true);
    try {
      await fetch('/api/admin/billing',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
      await load(false);
    } finally { setRefreshing(false); }
  };

  const action=async(invoice:Invoice,a:string)=>{
    setWorkingId(invoice.id);
    try {
      const r=await fetch(`/api/admin/billing/${invoice.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:a})});
      if(!r.ok) throw new Error('Aksi gagal');
      const result=await r.json();

      setData(current=>{
        if(!current) return current;
        const previousStatus=invoice.status;
        const nextStatus=result.status || previousStatus;
        const nextService=result.serviceStatus || invoice.customer.serviceStatus;
        const invoices=current.invoices.map(item=>item.id===invoice.id?{
          ...item,
          status:nextStatus,
          customer:{...item.customer,serviceStatus:nextService},
          networkSync:{
            ...item.networkSync,
            status: result.networkSync?.success ? 'PENDING' : item.networkSync.status,
            message: result.networkSync?.message || item.networkSync.message,
          }
        }:item);
        const stats={...current.stats};
        if(previousStatus!=='PAID' && nextStatus==='PAID'){
          if(previousStatus==='UNPAID') stats.unpaid=Math.max(0,stats.unpaid-1);
          if(previousStatus==='OVERDUE') stats.overdue=Math.max(0,stats.overdue-1);
          stats.paid+=1;
          stats.revenue+=invoice.amount;
        }
        return {...current,invoices,stats};
      });

      void load(false);
    } finally { setWorkingId(null); }
  };

  const cards=[['Total Tagihan',data?.stats.total??0,WalletCards],['Belum Bayar',data?.stats.unpaid??0,Clock3],['Lewat Jatuh Tempo',data?.stats.overdue??0,ShieldOff],['Sudah Bayar',data?.stats.paid??0,CheckCircle2]] as const;

  return <div className="space-y-6 p-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm text-gray-500">Keuangan & layanan pelanggan</p>
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold text-gray-950">Billing & Isolir</h1>{data?.mikrotik.mode&&<Badge variant="outline" className={data.mikrotik.mode==='LIVE'?'border-emerald-200 bg-emerald-50 text-emerald-700':'border-amber-200 bg-amber-50 text-amber-700'}>{data.mikrotik.mode}</Badge>}</div>
        <p className="mt-1 text-sm text-gray-500">Tagihan, status layanan, PPPoE dan sinkronisasi MikroTik dalam satu tampilan.</p>
      </div>
      <Button onClick={generate} disabled={refreshing} className="bg-[#e10b17] hover:bg-[#c70914]">{refreshing?<Loader2 className="mr-2 h-4 w-4 animate-spin"/>:<RefreshCw className="mr-2 h-4 w-4"/>}Buat Tagihan Bulan Ini</Button>
    </div>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map(([t,v,I])=><div key={t} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">{t}</span><I className="h-5 w-5 text-[#e10b17]"/></div><p className="mt-3 text-3xl font-bold">{v}</p></div>)}<div className="rounded-2xl border bg-[#101114] p-5 text-white shadow-sm"><div className="flex items-center justify-between"><span className="text-sm text-gray-300">Pendapatan</span><Banknote className="h-5 w-5 text-red-400"/></div><p className="mt-3 text-xl font-bold">{rupiah(data?.stats.revenue??0)}</p></div></div>

    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2 text-sm font-semibold"><Wifi className="h-4 w-4 text-emerald-600"/>Status Router</div><p className="mt-2 text-sm text-gray-500">{data?.mikrotik.routerStatus==='ONLINE'?'MikroTik terhubung':'MikroTik belum terhubung'}</p></div>
      <div className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2 text-sm font-semibold"><RefreshCw className="h-4 w-4 text-blue-600"/>Mode Sinkronisasi</div><p className="mt-2 text-sm text-gray-500">{data?.mikrotik.mode||'Belum tersedia'}</p></div>
      <div className="rounded-xl border bg-white p-4"><div className="flex items-center gap-2 text-sm font-semibold">{data?.mikrotik.error?<AlertTriangle className="h-4 w-4 text-red-600"/>:<CheckCircle2 className="h-4 w-4 text-emerald-600"/>}Kesehatan Sinkronisasi</div><p className="mt-2 text-sm text-gray-500">{data?.mikrotik.error?'Provider MikroTik bermasalah':'Provider siap digunakan'}</p></div>
    </div>

    <div className="rounded-2xl border bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b p-4"><div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"/><Input value={search} onChange={e=>changeSearch(e.target.value)} placeholder="Cari pelanggan / PPPoE..." className="pl-9"/></div>{['','UNPAID','OVERDUE','PAID'].map(s=><Button key={s||'ALL'} variant={status===s?'default':'outline'} onClick={()=>changeStatus(s)} className={status===s?'bg-[#e10b17] hover:bg-[#c70914]':''}>{s||'Semua'}</Button>)}{refreshing&&data&&<span className="inline-flex items-center gap-1 text-xs text-gray-400"><Loader2 className="h-3.5 w-3.5 animate-spin"/>Sinkronisasi</span>}</div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="p-4">Pelanggan</th><th className="p-4">Paket</th><th className="p-4">Jatuh Tempo</th><th className="p-4">Tagihan</th><th className="p-4">Pembayaran</th><th className="p-4">Layanan</th><th className="p-4">PPPoE</th><th className="p-4">Sinkronisasi</th><th className="p-4 text-right">Aksi</th></tr></thead><tbody>{loading?<tr><td colSpan={9} className="p-10 text-center text-gray-500"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin"/>Memuat billing...</td></tr>:data?.invoices.length?data.invoices.map(i=><tr key={i.id} className="border-t"><td className="p-4"><p className="font-semibold">{i.customer.fullName}</p><p className="text-xs text-gray-500">{i.customer.customerNumber||'-'} · PPPoE: {i.customer.pppoeUsername||'belum diatur'}</p></td><td className="p-4">{i.customer.package?.name||i.customer.packageExcel||'-'}</td><td className="p-4"><span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4 text-gray-400"/>{new Date(i.dueDate).toLocaleDateString('id-ID')}</span></td><td className="p-4 font-semibold">{rupiah(i.amount)}</td><td className="p-4"><Badge variant="outline" className={i.status==='PAID'?'border-green-200 bg-green-50 text-green-700':i.status==='OVERDUE'?'border-red-200 bg-red-50 text-red-700':'border-amber-200 bg-amber-50 text-amber-700'}>{i.status}</Badge></td><td className="p-4"><Badge className={i.customer.serviceStatus==='ISOLIR'?'bg-red-600':'bg-emerald-600'}>{i.customer.serviceStatus||'ACTIVE'}</Badge></td><td className="p-4">{pppoeBadge(i.networkSync.pppoeStatus)}</td><td className="p-4"><div className="space-y-1">{syncBadge(i.networkSync)}<p className="max-w-[210px] text-[11px] leading-4 text-gray-400">{i.networkSync.message}</p></div></td><td className="p-4"><div className="flex justify-end gap-2">{i.status!=='PAID'&&<Button size="sm" disabled={workingId===i.id} onClick={()=>action(i,'PAY')} className="bg-emerald-600 hover:bg-emerald-700">{workingId===i.id?<Loader2 className="h-4 w-4 animate-spin"/>:'Bayar'}</Button>}{i.customer.serviceStatus==='ISOLIR'?<Button size="sm" variant="outline" disabled={workingId===i.id} onClick={()=>action(i,'ACTIVATE')}>Aktifkan</Button>:<Button size="sm" variant="outline" disabled={workingId===i.id} onClick={()=>action(i,'ISOLATE')}>Isolir</Button>}</div></td></tr>):<tr><td colSpan={9} className="p-12 text-center text-gray-500">Tidak ada tagihan pada filter ini.</td></tr>}</tbody></table></div>
      {data&&data.pagination.totalPages>1&&<div className="flex items-center justify-between border-t px-4 py-3"><p className="text-sm text-gray-500">Menampilkan {((data.pagination.page-1)*data.pagination.pageSize)+1}–{Math.min(data.pagination.page*data.pagination.pageSize,data.pagination.total)} dari {data.pagination.total}</p><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page<=1||refreshing} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft className="mr-1 h-4 w-4"/>Sebelumnya</Button><span className="px-2 text-sm font-medium">{data.pagination.page} / {data.pagination.totalPages}</span><Button variant="outline" size="sm" disabled={page>=data.pagination.totalPages||refreshing} onClick={()=>setPage(p=>p+1)}>Berikutnya<ChevronRight className="ml-1 h-4 w-4"/></Button></div></div>}
    </div>
  </div>;
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search, MapPin, Users, Navigation, X,
  ExternalLink, Eye, Pencil, ChevronLeft, Loader2, Wifi,
} from 'lucide-react';
import type { CustomerStatus } from '@/types';
import { CUSTOMER_STATUS_LABELS } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────

interface MapCustomer {
  id: string;
  customerNumber: string | null;
  fullName: string;
  address: string | null;
  phone1: string | null;
  status: CustomerStatus;
  latitude: number;
  longitude: number;
  packageExcel: string | null;
  package: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  INSTALLATION: 'bg-orange-100 text-orange-800 border-orange-200',
  INACTIVE: 'bg-gray-100 text-gray-800 border-gray-200',
  TERMINATED: 'bg-red-100 text-red-800 border-red-200',
  SUSPENDED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  ISOLIR: 'bg-purple-100 text-purple-800 border-purple-200',
};

const MARKER_COLORS: Record<string, string> = {
  ACTIVE: '#16a34a',
  INSTALLATION: '#ea580c',
  INACTIVE: '#6b7280',
  TERMINATED: '#dc2626',
  SUSPENDED: '#eab308',
  ISOLIR: '#7c3aed',
};

// ─── Leaflet Icon Fix ───────────────────────────────────────────────────

function createIcon(color: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
    <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.268 21.732 0 14 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
    <circle cx="14" cy="13" r="6" fill="#fff"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: 'custom-marker',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -42],
  });
}

const markerIcons: Record<string, L.DivIcon> = {};
function getMarkerIcon(status: string) {
  if (!markerIcons[status]) {
    markerIcons[status] = createIcon(MARKER_COLORS[status] || '#6b7280');
  }
  return markerIcons[status];
}

// ─── Map Controllers ────────────────────────────────────────────────────

function FlyToController({ target, customer }: { target: [number, number] | null; customer: MapCustomer | null }) {
  const map = useMap();
  const prevTarget = useRef<[number, number] | null>(null);
  const popupRef = useRef<L.Popup | null>(null);

  useEffect(() => {
    if (target && (prevTarget.current?.[0] !== target[0] || prevTarget.current?.[1] !== target[1])) {
      map.flyTo(target, 17, { duration: 1.2 });
      prevTarget.current = target;

      // Open popup after fly
      setTimeout(() => {
        if (popupRef.current) map.closePopup(popupRef.current);
        if (customer) {
          const pkg = customer.packageExcel || customer.package?.name || '—';
          const html = `
            <div style="font-size:12px;">
              <strong>${customer.fullName}</strong><br>
              ${customer.customerNumber ? `No: ${customer.customerNumber}<br>` : ''}
              ${customer.phone1 ? `Telp: ${customer.phone1}<br>` : ''}
              Paket: ${pkg}<br>
              Koordinat: ${customer.latitude.toFixed(6)}, ${customer.longitude.toFixed(6)}
              <div style="margin-top:6px;display:flex;flex-direction:column;gap:4px;">
                <a href="/admin/customers/${customer.id}" style="font-size:11px;color:#2563eb;">Lihat Pelanggan</a>
                <a href="https://www.google.com/maps?q=${customer.latitude},${customer.longitude}" target="_blank" style="font-size:11px;color:#2563eb;">Buka Google Maps</a>
              </div>
            </div>
          `;
          popupRef.current = L.popup({ maxWidth: 280, minWidth: 220, offset: [0, -40] })
            .setLatLng(target)
            .setContent(html)
            .openOn(map);
        }
      }, 1500);
    }
  }, [target, customer, map]);

  return null;
}

function FitBoundsController({ customers }: { customers: MapCustomer[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current && customers.length > 0) {
      const bounds = L.latLngBounds(customers.map(c => [c.latitude, c.longitude]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      done.current = true;
    }
  }, [customers, map]);
  return null;
}

// ─── Main Component ────────────────────────────────────────────────────

export default function MapPage() {
  const [customers, setCustomers] = useState<MapCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<MapCustomer | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Edit coordinates dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editLat, setEditLat] = useState('');
  const [editLng, setEditLng] = useState('');
  const [isSavingCoord, setIsSavingCoord] = useState(false);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/customers/map');
      const json = await res.json();
      if (json.success && json.data) {
        setCustomers(json.data);
      } else {
        setError(json.error || 'Gagal memuat data pelanggan');
      }
    } catch {
      setError('Terjadi kesalahan saat mengambil data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  // Filter customers by search
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      (c.customerNumber || '').includes(q) ||
      (c.address || '').toLowerCase().includes(q) ||
      (c.phone1 || '').includes(q)
    );
  }, [customers, searchQuery]);

  // Click customer in list
  const handleCustomerClick = (c: MapCustomer) => {
    setSelectedCustomer(c);
    setFlyTarget([c.latitude, c.longitude]);
  };

  // Open edit coordinates
  const openEditCoord = (c: MapCustomer) => {
    setSelectedCustomer(c);
    setEditLat(String(c.latitude));
    setEditLng(String(c.longitude));
    setShowEditDialog(true);
  };

  // Save coordinates
  const handleSaveCoord = async () => {
    if (!selectedCustomer) return;
    const lat = Number(editLat);
    const lng = Number(editLng);
    if (isNaN(lat) || isNaN(lng)) { toast.error('Latitude dan longitude harus berupa angka'); return; }
    if (lat < -90 || lat > 90) { toast.error('Latitude harus antara -90 dan 90'); return; }
    if (lng < -180 || lng > 180) { toast.error('Longitude harus antara -180 dan 180'); return; }

    setIsSavingCoord(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}/coordinates`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: lat, longitude: lng }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Koordinat berhasil diperbarui');
        setShowEditDialog(false);
        // Update local state
        setCustomers(prev => prev.map(c =>
          c.id === selectedCustomer.id ? { ...c, latitude: lat, longitude: lng } : c
        ));
        setSelectedCustomer(prev => prev ? { ...prev, latitude: lat, longitude: lng } : null);
        setFlyTarget([lat, lng]);
      } else {
        toast.error(json.error || 'Gagal memperbarui koordinat');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setIsSavingCoord(false);
    }
  };

  // Package display
  const getPackage = (c: MapCustomer) => c.packageExcel || c.package?.name || '—';

  const withCoords = customers.length;
  const withoutCoords = 0; // This API only returns customers with coords

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Peta Pelanggan</h1>
          <p className="text-sm text-muted-foreground mt-1">Peta Lokasi Pelanggan Karputindo Net</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-green-600" /> <span className="text-muted-foreground">Dengan Koordinat:</span> <span className="font-semibold text-green-700">{withCoords}</span></div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">{error}</div>
      )}

      {/* Map + Sidebar layout */}
      <div className="relative flex gap-0 rounded-lg border border-border overflow-hidden bg-white" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-0'} border-r border-border bg-white flex flex-col transition-all duration-300 overflow-hidden shrink-0`}>
          {/* Search */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, no pelanggan, alamat..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <p className="text-xs text-muted-foreground px-1">
              {filteredCustomers.length} dari {customers.length} pelanggan
            </p>
          </div>

          {/* Customer list */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-3 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Tidak ditemukan</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredCustomers.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleCustomerClick(c)}
                    className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                      selectedCustomer?.id === c.id
                        ? 'bg-rose-50 border border-rose-200'
                        : 'hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 truncate">{c.fullName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground truncate flex-1">
                        {c.customerNumber || '—'} · {getPackage(c).split(' ').slice(0, 2).join(' ')}
                      </span>
                      <Badge variant="outline" className={`text-[9px] shrink-0 ${STATUS_COLORS[c.status] || ''}`}>
                        {CUSTOMER_STATUS_LABELS[c.status]}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Toggle sidebar button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-3 left-3 z-[1000] bg-white rounded-lg shadow-md p-1.5 hover:bg-gray-50 border border-border transition-colors"
          style={{ left: sidebarOpen ? '288px' : '12px' }}
          title={sidebarOpen ? 'Tutup daftar' : 'Buka daftar'}
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Users className="w-4 h-4" />}
        </button>

        {/* Map */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : withCoords === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
              <MapPin className="w-16 h-16 text-muted-foreground/30" />
              <h3 className="text-lg font-medium mt-4">Belum ada pelanggan dengan koordinat</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">Tambahkan koordinat pada data pelanggan.</p>
            </div>
          ) : (
            <MapContainer
              center={[-6.813, 107.231]}
              zoom={13}
              className="w-full h-full"
              zoomControl={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBoundsController customers={customers} />
              <FlyToController target={flyTarget} customer={selectedCustomer} />
              <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={50}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
              >
                {customers.map(c => (
                  <Marker
                    key={c.id}
                    position={[c.latitude, c.longitude]}
                    icon={getMarkerIcon(c.status)}
                    eventHandlers={{
                      click: () => {
                        setSelectedCustomer(c);
                      },
                    }}
                  >
                    <Popup maxWidth={300} minWidth={250}>
                      <div className="space-y-2 py-1">
                        <div className="flex items-start justify-between">
                          <h3 className="text-sm font-bold text-gray-900">{c.fullName}</h3>
                          <Badge variant="outline" className={`text-[9px] shrink-0 ml-2 ${STATUS_COLORS[c.status]}`}>
                            {CUSTOMER_STATUS_LABELS[c.status]}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-xs text-gray-600">
                          {c.customerNumber && <p><span className="text-muted-foreground">No Pelanggan:</span> {c.customerNumber}</p>}
                          {c.phone1 && <p><span className="text-muted-foreground">Telepon:</span> {c.phone1}</p>}
                          <p><span className="text-muted-foreground">Paket:</span> {getPackage(c)}</p>
                          {c.address && <p><span className="text-muted-foreground">Alamat:</span> {c.address}</p>}
                          <p><span className="text-muted-foreground">Koordinat:</span> {c.latitude.toFixed(6)}, {c.longitude.toFixed(6)}</p>
                        </div>
                        <div className="flex flex-col gap-1.5 pt-1 border-t border-gray-200">
                          <Button asChild size="sm" variant="outline" className="h-7 text-xs w-full">
                            <Link href={`/admin/customers/${c.id}`}><Eye className="w-3 h-3 mr-1" /> Lihat Pelanggan</Link>
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs w-full" onClick={() => openEditCoord(c)}>
                            <Pencil className="w-3 h-3 mr-1" /> Edit Koordinat
                          </Button>
                          <Button asChild size="sm" variant="outline" className="h-7 text-xs w-full">
                            <a href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" /> Buka Google Maps
                            </a>
                          </Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          )}
        </div>
      </div>

      {/* Edit Coordinates Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Koordinat</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pelanggan: <span className="font-medium text-gray-900">{selectedCustomer.fullName}</span>
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-lat">Latitude (-90 s/d 90)</Label>
                  <Input
                    id="edit-lat"
                    type="number"
                    step="any"
                    value={editLat}
                    onChange={e => setEditLat(e.target.value)}
                    placeholder="Contoh: -6.813196"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lng">Longitude (-180 s/d 180)</Label>
                  <Input
                    id="edit-lng"
                    type="number"
                    step="any"
                    value={editLng}
                    onChange={e => setEditLng(e.target.value)}
                    placeholder="Contoh: 107.231035"
                  />
                </div>
                <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Koordinat saat ini: {selectedCustomer.latitude.toFixed(6)}, {selectedCustomer.longitude.toFixed(6)}
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={isSavingCoord}>Batal</Button>
            <Button onClick={handleSaveCoord} disabled={isSavingCoord} className="bg-rose-600 hover:bg-rose-700 text-white">
              {isSavingCoord ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Simpan Koordinat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

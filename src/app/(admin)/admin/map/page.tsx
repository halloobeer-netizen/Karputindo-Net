'use client';

import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('@/components/map/map-client'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-border" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-rose-600 rounded-full mx-auto" />
        <p className="text-sm text-muted-foreground mt-3">Memuat peta pelanggan...</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return <MapClient />;
}

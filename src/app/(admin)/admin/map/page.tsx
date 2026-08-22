'use client';

import dynamic from 'next/dynamic';

const MapPage = dynamic(() => import('@/components/map/map-client'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-[500px] bg-white rounded-xl shadow-sm"><div className="animate-spin w-8 h-8 border-2 border-[#C51F2A] border-t-transparent rounded-full" /></div>,
});

export default function Page() {
  return <MapPage />;
}

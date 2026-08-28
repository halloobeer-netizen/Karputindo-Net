export type MikrotikMode = 'SIMULATION' | 'LIVE';
export type PppoeStatus = 'ONLINE' | 'OFFLINE' | 'ISOLATED';

export interface MikrotikRouterSummary {
  id: string;
  name: string;
  identity: string;
  host: string;
  routerOs: string;
  uptime: string;
  cpuLoad: number;
  memoryUsage: number;
  status: 'ONLINE' | 'OFFLINE';
  mode: MikrotikMode;
}

export interface MikrotikPppoeSession {
  id: string;
  username: string;
  customerName: string;
  profile: string;
  ipAddress: string | null;
  uptime: string | null;
  downloadMbps: number;
  uploadMbps: number;
  status: PppoeStatus;
}

export interface MikrotikSnapshot {
  router: MikrotikRouterSummary;
  sessions: MikrotikPppoeSession[];
  generatedAt: string;
}

export interface MikrotikProvider {
  getSnapshot(): Promise<MikrotikSnapshot>;
}

const simulationSessions: MikrotikPppoeSession[] = [
  {
    id: 'pppoe-001',
    username: 'kp001',
    customerName: 'Andi Saputra',
    profile: 'HOME 20 Mbps',
    ipAddress: '10.10.10.21',
    uptime: '2d 04:18:22',
    downloadMbps: 8.4,
    uploadMbps: 1.7,
    status: 'ONLINE',
  },
  {
    id: 'pppoe-002',
    username: 'kp002',
    customerName: 'Budi Hartono',
    profile: 'HOME 30 Mbps',
    ipAddress: '10.10.10.34',
    uptime: '08:43:10',
    downloadMbps: 12.8,
    uploadMbps: 2.3,
    status: 'ONLINE',
  },
  {
    id: 'pppoe-003',
    username: 'kp003',
    customerName: 'Citra Lestari',
    profile: 'GINESIA 10 Mbps',
    ipAddress: null,
    uptime: null,
    downloadMbps: 0,
    uploadMbps: 0,
    status: 'OFFLINE',
  },
  {
    id: 'pppoe-004',
    username: 'kp004',
    customerName: 'Dedi Firmansyah',
    profile: 'HOME 20 Mbps',
    ipAddress: null,
    uptime: null,
    downloadMbps: 0,
    uploadMbps: 0,
    status: 'ISOLATED',
  },
  {
    id: 'pppoe-005',
    username: 'kp005',
    customerName: 'Erna Wulandari',
    profile: 'WIRELESS 15 Mbps',
    ipAddress: '10.10.10.52',
    uptime: '1d 11:02:54',
    downloadMbps: 5.1,
    uploadMbps: 1.1,
    status: 'ONLINE',
  },
  {
    id: 'pppoe-006',
    username: 'kp006',
    customerName: 'Fajar Pratama',
    profile: 'HOME 50 Mbps',
    ipAddress: '10.10.10.67',
    uptime: '05:16:39',
    downloadMbps: 21.6,
    uploadMbps: 4.8,
    status: 'ONLINE',
  },
];

class SimulationMikrotikProvider implements MikrotikProvider {
  async getSnapshot(): Promise<MikrotikSnapshot> {
    return {
      router: {
        id: 'router-sim-01',
        name: 'Karputindo Core Router',
        identity: 'KARPUTINDO-SIMULATOR',
        host: '192.168.88.1',
        routerOs: 'RouterOS 7.x (Simulation)',
        uptime: '14d 08:31:12',
        cpuLoad: 17,
        memoryUsage: 42,
        status: 'ONLINE',
        mode: 'SIMULATION',
      },
      sessions: simulationSessions,
      generatedAt: new Date().toISOString(),
    };
  }
}

// Later, LiveMikrotikProvider can implement the same interface using RouterOS API.
// The dashboard/API will not need to change when switching providers.
export function getMikrotikProvider(): MikrotikProvider {
  return new SimulationMikrotikProvider();
}

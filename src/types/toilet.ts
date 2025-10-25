export interface Toilet {
  id: string;
  name: string;
  location: string;
  status: 'available' | 'occupied' | 'maintenance';
  isOccupied: boolean;
  doorOpen: boolean;
  lastFlushed?: string;
  lastCleaned?: string;
  settings: {
    autoDoor: boolean;
    autoFlush: boolean;
    perfumeEnabled: boolean;
    perfumeInterval: number; // minutes
  };
}

export interface PaymentMethod {
  type: 'card' | 'momo' | 'manual';
  enabled: boolean;
  price?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  approved: boolean;
  createdAt: string;
}

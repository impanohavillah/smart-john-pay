export interface Toilet {
  id: string;
  name: string;
  location: string;
  status: 'available' | 'occupied' | 'maintenance';
  is_occupied: boolean;
  door_open: boolean;
  last_flushed?: string;
  last_cleaned?: string;
  last_perfumed?: string;
  
  // GSM and WiFi configuration
  gsm_number?: string;
  wifi_ip?: string;
  control_mode: 'gsm' | 'wifi';
  
  // Settings
  auto_door: boolean;
  auto_flush: boolean;
  perfume_enabled: boolean;
  perfume_interval: number;
  
  created_at?: string;
  updated_at?: string;
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

export interface CommandLog {
  id: string;
  toilet_id: string;
  command_type: string;
  control_mode: 'gsm' | 'wifi';
  destination: string;
  status: 'sent' | 'failed' | 'success';
  error_message?: string;
  created_at: string;
}

export interface AdminSettings {
  id: string;
  setting_key: string;
  setting_value: string;
  created_at: string;
  updated_at: string;
}

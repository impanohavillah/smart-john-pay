-- Create enum for control modes
CREATE TYPE public.control_mode AS ENUM ('gsm', 'wifi');

-- Create toilets table to replace Firebase
CREATE TABLE public.toilets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  is_occupied BOOLEAN DEFAULT false,
  door_open BOOLEAN DEFAULT false,
  last_flushed TIMESTAMP WITH TIME ZONE,
  last_cleaned TIMESTAMP WITH TIME ZONE,
  last_perfumed TIMESTAMP WITH TIME ZONE,
  
  -- GSM and WiFi configuration
  gsm_number TEXT,
  wifi_ip TEXT,
  control_mode control_mode NOT NULL DEFAULT 'gsm',
  
  -- Settings
  auto_door BOOLEAN DEFAULT false,
  auto_flush BOOLEAN DEFAULT false,
  perfume_enabled BOOLEAN DEFAULT false,
  perfume_interval INTEGER DEFAULT 30,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin settings table for secret codes
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default secret code
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('secret_code', 'ACCESS123');

-- Create command logs table
CREATE TABLE public.command_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toilet_id UUID REFERENCES public.toilets(id) ON DELETE CASCADE,
  command_type TEXT NOT NULL,
  control_mode control_mode NOT NULL,
  destination TEXT NOT NULL, -- phone number or IP address
  status TEXT NOT NULL, -- 'sent', 'failed', 'success'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.toilets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.command_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we don't have auth yet)
CREATE POLICY "Allow all operations on toilets"
  ON public.toilets FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on admin_settings"
  ON public.admin_settings FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on command_logs"
  ON public.command_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_toilets_updated_at
  BEFORE UPDATE ON public.toilets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
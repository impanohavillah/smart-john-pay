import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin } from 'lucide-react';

const Settings = () => {
  const [globalSettings, setGlobalSettings] = useState({
    autoMode: true,
    motionSensorEnabled: true,
    occupancyLampEnabled: true,
    notificationsEnabled: true,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(false);
  const [esp32IpAddress, setEsp32IpAddress] = useState('');
  const [ipInputValue, setIpInputValue] = useState('');
  const { location, loading: locationLoading, getCurrentLocation, isNative } = useGeolocation();

  useEffect(() => {
    fetchSettings();
    fetchEsp32IpAddress();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['autoMode', 'motionSensorEnabled', 'occupancyLampEnabled', 'notificationsEnabled', 'maintenanceMode']);

      if (error) throw error;

      if (data && data.length > 0) {
        const settings: any = {};
        data.forEach((item) => {
          settings[item.setting_key] = item.setting_value === 'true';
        });
        setGlobalSettings((prev) => ({ ...prev, ...settings }));
      }
    } catch (error: any) {
      console.error('Error fetching settings');
    }
  };

  const fetchEsp32IpAddress = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'esp32_ip_address')
        .single();

      if (data) {
        setEsp32IpAddress(data.setting_value);
        setIpInputValue(data.setting_value);
      }
    } catch (error: any) {
      console.error('Error fetching ESP32 IP address');
    }
  };

  const handleSaveIpAddress = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'esp32_ip_address',
          setting_value: ipInputValue,
        });

      if (error) throw error;

      setEsp32IpAddress(ipInputValue);
      toast.success('ESP32 IP address saved successfully');
    } catch (error: any) {
      toast.error('Failed to save ESP32 IP address');
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = async () => {
    const loc = await getCurrentLocation();
    if (loc) {
      toast.success(`Location: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`);
    }
  };

  const handleSettingChange = async (key: string, value: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: key,
          setting_value: value.toString(),
        });

      if (error) throw error;

      setGlobalSettings({ ...globalSettings, [key]: value });
      toast.success('Setting updated successfully');
    } catch (error: any) {
      toast.error('Failed to update setting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure system-wide settings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ESP32 Configuration</CardTitle>
            <CardDescription>Configure direct IP connection to ESP32 device</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="esp32Ip">ESP32 IP Address</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Enter the IP address of your ESP32 device for direct WiFi control
              </p>
              <div className="flex gap-2">
                <Input
                  id="esp32Ip"
                  type="text"
                  placeholder="e.g., 192.168.1.100"
                  value={ipInputValue}
                  onChange={(e) => setIpInputValue(e.target.value)}
                  disabled={loading}
                />
                <Button 
                  onClick={handleSaveIpAddress} 
                  disabled={loading || !ipInputValue}
                >
                  Save
                </Button>
              </div>
              {esp32IpAddress && (
                <p className="text-sm text-success mt-2">
                  Current IP: {esp32IpAddress}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {isNative && (
          <Card>
            <CardHeader>
              <CardTitle>Device Location</CardTitle>
              <CardDescription>Access device GPS location</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleGetLocation} 
                disabled={locationLoading}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {locationLoading ? 'Getting Location...' : 'Get Current Location'}
              </Button>
              {location && (
                <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                  <p><strong>Latitude:</strong> {location.latitude.toFixed(6)}</p>
                  <p><strong>Longitude:</strong> {location.longitude.toFixed(6)}</p>
                  <p><strong>Accuracy:</strong> {location.accuracy.toFixed(2)}m</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
            <CardDescription>Global settings for all smart toilets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <Label htmlFor="autoMode">Automatic Mode</Label>
                <p className="text-sm text-muted-foreground">Enable auto door, flush, and perfume</p>
              </div>
              <Switch
                id="autoMode"
                checked={globalSettings.autoMode}
                onCheckedChange={(checked) => handleSettingChange('autoMode', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <Label htmlFor="motionSensor">Motion Sensor</Label>
                <p className="text-sm text-muted-foreground">Detect occupancy with motion sensor</p>
              </div>
              <Switch
                id="motionSensor"
                checked={globalSettings.motionSensorEnabled}
                onCheckedChange={(checked) => handleSettingChange('motionSensorEnabled', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <Label htmlFor="occupancyLamp">Occupancy Lamp</Label>
                <p className="text-sm text-muted-foreground">Turn on lamp when occupied</p>
              </div>
              <Switch
                id="occupancyLamp"
                checked={globalSettings.occupancyLampEnabled}
                onCheckedChange={(checked) => handleSettingChange('occupancyLampEnabled', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <Label htmlFor="notifications">Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive system alerts and updates</p>
              </div>
              <Switch
                id="notifications"
                checked={globalSettings.notificationsEnabled}
                onCheckedChange={(checked) => handleSettingChange('notificationsEnabled', checked)}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <Label htmlFor="maintenance">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Disable all toilets for maintenance</p>
              </div>
              <Switch
                id="maintenance"
                checked={globalSettings.maintenanceMode}
                onCheckedChange={(checked) => handleSettingChange('maintenanceMode', checked)}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;

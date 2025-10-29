import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const Settings = () => {
  const [globalSettings, setGlobalSettings] = useState({
    autoMode: true,
    motionSensorEnabled: true,
    occupancyLampEnabled: true,
    notificationsEnabled: true,
    maintenanceMode: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
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

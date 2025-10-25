import { useState, useEffect } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

const Settings = () => {
  const [globalSettings, setGlobalSettings] = useState({
    autoMode: true,
    motionSensorEnabled: true,
    occupancyLampEnabled: true,
    notificationsEnabled: true,
    maintenanceMode: false,
  });
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    const settingsRef = ref(database, 'global_settings');
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setGlobalSettings(snapshot.val());
      }
    });

    if (isAdmin) {
      const approvalsRef = ref(database, 'pending_approvals');
      const unsubscribeApprovals = onValue(approvalsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const approvalList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setPendingApprovals(approvalList);
        } else {
          setPendingApprovals([]);
        }
      });

      return () => {
        unsubscribe();
        unsubscribeApprovals();
      };
    }

    return () => unsubscribe();
  }, [isAdmin]);

  const handleSettingChange = async (key: string, value: boolean) => {
    try {
      await update(ref(database, 'global_settings'), { [key]: value });
      toast.success('Setting updated successfully');
    } catch (error) {
      console.error('Error updating setting:', error);
      toast.error('Failed to update setting');
    }
  };

  const handleApproval = async (userId: string, approve: boolean) => {
    try {
      if (approve) {
        await update(ref(database, `users/${userId}`), { approved: true });
        toast.success('User approved successfully');
      } else {
        // Optionally delete the user or just remove from pending
        toast.success('User rejected');
      }
      // Remove from pending approvals
      await update(ref(database, `pending_approvals/${userId}`), null);
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
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
              />
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Pending User Approvals</CardTitle>
              <CardDescription>Review and approve new user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No pending approvals</p>
              ) : (
                <div className="space-y-4">
                  {pendingApprovals.map((approval) => (
                    <div key={approval.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-warning" />
                        <div>
                          <p className="font-semibold">{approval.username}</p>
                          <p className="text-sm text-muted-foreground">{approval.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Requested: {new Date(approval.requestedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApproval(approval.userId, true)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(approval.userId, false)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Hardware Specifications</CardTitle>
            <CardDescription>Connected devices and components</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Microcontroller</span>
                <Badge variant="outline">Arduino Uno</Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Communication</span>
                <Badge variant="outline">GSM Module + SIM</Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Payment</span>
                <Badge variant="outline">RFID Reader</Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Sensors</span>
                <Badge variant="outline">Motion Sensor (PIR)</Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Servo 1</span>
                <Badge variant="outline">Door Control</Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Servo 2</span>
                <Badge variant="outline">Flush Mechanism</Badge>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Servo 3</span>
                <Badge variant="outline">Perfume Dispenser</Badge>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Indicator</span>
                <Badge variant="outline">Occupancy Lamp</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Settings;

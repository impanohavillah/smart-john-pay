import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Toilet } from '@/types/toilet';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DoorOpen, Droplet, Wind, AlertTriangle, Wifi, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const Control = () => {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [selectedToiletId, setSelectedToiletId] = useState<string>('');
  const [loading, setLoading] = useState<string>('');
  const [secretCode, setSecretCode] = useState<string>('');

  useEffect(() => {
    fetchToilets();
    fetchSecretCode();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('toilets-control')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'toilets'
        },
        () => {
          fetchToilets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchToilets = async () => {
    const { data, error } = await supabase
      .from('toilets')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching toilets:', error);
      toast.error('Failed to fetch toilets');
    } else {
      setToilets((data as Toilet[]) || []);
      if (!selectedToiletId && data && data.length > 0) {
        setSelectedToiletId(data[0].id);
      }
    }
  };

  const fetchSecretCode = async () => {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'secret_code')
      .single();

    if (error) {
      console.error('Error fetching secret code:', error);
    } else if (data) {
      setSecretCode(data.setting_value);
    }
  };

  const selectedToilet = toilets.find((t) => t.id === selectedToiletId);

  const sendCommand = async (command: string) => {
    if (!selectedToilet || !secretCode) {
      toast.error('Missing toilet or secret code configuration');
      return;
    }

    const endpoint = selectedToilet.control_mode === 'gsm' 
      ? 'send-gsm-command' 
      : 'send-wifi-command';

    const payload = selectedToilet.control_mode === 'gsm'
      ? {
          toiletId: selectedToilet.id,
          command: command,
          phoneNumber: selectedToilet.gsm_number,
          secretCode: secretCode
        }
      : {
          toiletId: selectedToilet.id,
          command: command,
          ipAddress: selectedToilet.wifi_ip,
          secretCode: secretCode
        };

    try {
      const { data, error } = await supabase.functions.invoke(endpoint, {
        body: payload
      });

      if (error) throw error;

      if (data?.success) {
        return true;
      } else {
        throw new Error(data?.error || 'Command failed');
      }
    } catch (error) {
      console.error('Error sending command:', error);
      throw error;
    }
  };

  const handleDoorToggle = async () => {
    if (!selectedToilet) return;
    setLoading('door');
    
    try {
      const command = selectedToilet.door_open ? 'CLOSE' : 'OPEN';
      await sendCommand(command);

      // Update local database
      await supabase
        .from('toilets')
        .update({ door_open: !selectedToilet.door_open })
        .eq('id', selectedToiletId);

      toast.success(`Door ${command.toLowerCase()}ed successfully`);
    } catch (error) {
      console.error('Error toggling door:', error);
      toast.error('Failed to control door');
    } finally {
      setLoading('');
    }
  };

  const handleFlush = async () => {
    if (!selectedToilet) return;
    setLoading('flush');
    
    try {
      await sendCommand('FLUSH');

      // Update local database
      await supabase
        .from('toilets')
        .update({ last_flushed: new Date().toISOString() })
        .eq('id', selectedToiletId);

      toast.success('Toilet flushed successfully');
    } catch (error) {
      console.error('Error flushing:', error);
      toast.error('Failed to flush toilet');
    } finally {
      setLoading('');
    }
  };

  const handlePerfume = async () => {
    if (!selectedToilet) return;
    setLoading('perfume');
    
    try {
      await sendCommand('PERFUME');

      // Update local database
      await supabase
        .from('toilets')
        .update({ last_perfumed: new Date().toISOString() })
        .eq('id', selectedToiletId);

      toast.success('Perfume dispensed successfully');
    } catch (error) {
      console.error('Error dispensing perfume:', error);
      toast.error('Failed to dispense perfume');
    } finally {
      setLoading('');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Manual Control</h1>
          <p className="text-muted-foreground mt-1">Control toilet hardware remotely via GSM or WiFi</p>
        </div>

        {toilets.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No toilets available. Please add toilets first.</p>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Select Toilet</CardTitle>
                <CardDescription>Choose which toilet to control</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedToiletId} onValueChange={setSelectedToiletId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {toilets.map((toilet) => (
                      <SelectItem key={toilet.id} value={toilet.id}>
                        {toilet.name} - {toilet.location} ({toilet.control_mode.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedToilet && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    {selectedToilet.control_mode === 'gsm' ? (
                      <>
                        <Smartphone className="w-4 h-4" />
                        <span>GSM: {selectedToilet.gsm_number || 'Not configured'}</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-4 h-4" />
                        <span>WiFi: {selectedToilet.wifi_ip || 'Not configured'}</span>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedToilet && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <DoorOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Door Control</CardTitle>
                        <CardDescription>Servo 1</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <div className={`inline-block px-4 py-2 rounded-full ${selectedToilet.door_open ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {selectedToilet.door_open ? 'Open' : 'Closed'}
                      </div>
                    </div>
                    <Button 
                      onClick={handleDoorToggle} 
                      disabled={loading === 'door'}
                      className="w-full"
                      variant={selectedToilet.door_open ? 'destructive' : 'default'}
                    >
                      {loading === 'door' ? 'Processing...' : selectedToilet.door_open ? 'Close Door' : 'Open Door'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Droplet className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Flush Control</CardTitle>
                        <CardDescription>Servo 2</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedToilet.last_flushed && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        Last flushed:<br />
                        {new Date(selectedToilet.last_flushed).toLocaleString()}
                      </div>
                    )}
                    <Button 
                      onClick={handleFlush} 
                      disabled={loading === 'flush'}
                      className="w-full"
                    >
                      {loading === 'flush' ? 'Flushing...' : 'Flush Now'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <Wind className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle>Perfume</CardTitle>
                        <CardDescription>Servo 3</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <div className={`inline-block px-4 py-2 rounded-full ${selectedToilet.perfume_enabled ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {selectedToilet.perfume_enabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <Button 
                      onClick={handlePerfume} 
                      disabled={loading === 'perfume' || !selectedToilet.perfume_enabled}
                      className="w-full"
                    >
                      {loading === 'perfume' ? 'Dispensing...' : 'Dispense Perfume'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Control;

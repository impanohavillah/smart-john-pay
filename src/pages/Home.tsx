import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Toilet } from '@/types/toilet';
import Layout from '@/components/Layout';
import ToiletCard from '@/components/ToiletCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

const Home = () => {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingToilet, setEditingToilet] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    status: 'available' as Toilet['status'],
    gsmNumber: '',
    wifiIp: '',
    controlMode: 'gsm' as 'gsm' | 'wifi',
    autoDoor: true,
    autoFlush: true,
    perfumeEnabled: true,
    perfumeInterval: 30,
  });

  useEffect(() => {
    fetchToilets();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('toilets-changes')
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching toilets:', error);
      toast.error('Failed to fetch toilets');
    } else {
      setToilets((data as Toilet[]) || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const toiletData = {
        name: formData.name,
        location: formData.location,
        status: formData.status,
        is_occupied: false,
        door_open: false,
        gsm_number: formData.gsmNumber || null,
        wifi_ip: formData.wifiIp || null,
        control_mode: formData.controlMode,
        auto_door: formData.autoDoor,
        auto_flush: formData.autoFlush,
        perfume_enabled: formData.perfumeEnabled,
        perfume_interval: formData.perfumeInterval,
      };

      if (editingToilet) {
        const { error } = await supabase
          .from('toilets')
          .update(toiletData)
          .eq('id', editingToilet);

        if (error) throw error;
        toast.success('Toilet updated successfully');
      } else {
        const { error } = await supabase
          .from('toilets')
          .insert(toiletData);

        if (error) throw error;
        toast.success('Toilet added successfully');
      }
      
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving toilet:', error);
      toast.error('Failed to save toilet');
    }
  };

  const handleEdit = (toilet: Toilet) => {
    setEditingToilet(toilet.id);
    setFormData({
      name: toilet.name,
      location: toilet.location,
      status: toilet.status,
      gsmNumber: toilet.gsm_number || '',
      wifiIp: toilet.wifi_ip || '',
      controlMode: toilet.control_mode,
      autoDoor: toilet.auto_door,
      autoFlush: toilet.auto_flush,
      perfumeEnabled: toilet.perfume_enabled,
      perfumeInterval: toilet.perfume_interval,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this toilet?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('toilets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Toilet deleted successfully');
    } catch (error) {
      console.error('Error deleting toilet:', error);
      toast.error('Failed to delete toilet');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      status: 'available',
      gsmNumber: '',
      wifiIp: '',
      controlMode: 'gsm',
      autoDoor: true,
      autoFlush: true,
      perfumeEnabled: true,
      perfumeInterval: 30,
    });
    setEditingToilet(null);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Toilet Status Dashboard</h1>
            <p className="text-muted-foreground mt-1">Monitor and manage all smart toilets</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Plus className="w-5 h-5" />
                Add Toilet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingToilet ? 'Edit Toilet' : 'Add New Toilet'}</DialogTitle>
                <DialogDescription>
                  Configure the toilet settings, location, and control methods
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Floor Toilet"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Building A, Floor 1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Control Configuration</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="controlMode">Control Mode</Label>
                    <Select value={formData.controlMode} onValueChange={(value: any) => setFormData({ ...formData, controlMode: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gsm">GSM (SMS)</SelectItem>
                        <SelectItem value="wifi">WiFi (HTTP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 mt-3">
                    <Label htmlFor="gsmNumber">GSM Phone Number</Label>
                    <Input
                      id="gsmNumber"
                      value={formData.gsmNumber}
                      onChange={(e) => setFormData({ ...formData, gsmNumber: e.target.value })}
                      placeholder="+1234567890"
                      type="tel"
                    />
                    <p className="text-xs text-muted-foreground">
                      SIM card number for SMS commands
                    </p>
                  </div>

                  <div className="space-y-2 mt-3">
                    <Label htmlFor="wifiIp">WiFi IP Address</Label>
                    <Input
                      id="wifiIp"
                      value={formData.wifiIp}
                      onChange={(e) => setFormData({ ...formData, wifiIp: e.target.value })}
                      placeholder="192.168.4.101"
                    />
                    <p className="text-xs text-muted-foreground">
                      Local IP address for WiFi module
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <h3 className="font-semibold">Automation Settings</h3>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoDoor">Auto Door</Label>
                    <Switch
                      id="autoDoor"
                      checked={formData.autoDoor}
                      onCheckedChange={(checked) => setFormData({ ...formData, autoDoor: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoFlush">Auto Flush</Label>
                    <Switch
                      id="autoFlush"
                      checked={formData.autoFlush}
                      onCheckedChange={(checked) => setFormData({ ...formData, autoFlush: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="perfume">Perfume System</Label>
                    <Switch
                      id="perfume"
                      checked={formData.perfumeEnabled}
                      onCheckedChange={(checked) => setFormData({ ...formData, perfumeEnabled: checked })}
                    />
                  </div>
                  {formData.perfumeEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="interval">Perfume Interval (minutes)</Label>
                      <Input
                        id="interval"
                        type="number"
                        min="1"
                        value={formData.perfumeInterval}
                        onChange={(e) => setFormData({ ...formData, perfumeInterval: parseInt(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  {editingToilet ? 'Update Toilet' : 'Add Toilet'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {toilets.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">No toilets added yet. Click "Add Toilet" to get started!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toilets.map((toilet) => (
              <ToiletCard
                key={toilet.id}
                toilet={toilet}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Home;

import { useState, useEffect } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { database } from '@/lib/firebase';
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
  const [editingToilet, setEditingToilet] = useState<Toilet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    status: 'available' as Toilet['status'],
    autoDoor: true,
    autoFlush: true,
    perfumeEnabled: true,
    perfumeInterval: 30,
  });

  useEffect(() => {
    const toiletsRef = ref(database, 'toilets');
    const unsubscribe = onValue(toiletsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const toiletList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setToilets(toiletList);
      } else {
        setToilets([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const toiletId = editingToilet?.id || Date.now().toString();
    const toiletData: Toilet = {
      id: toiletId,
      name: formData.name,
      location: formData.location,
      status: formData.status,
      isOccupied: formData.status === 'occupied',
      doorOpen: false,
      settings: {
        autoDoor: formData.autoDoor,
        autoFlush: formData.autoFlush,
        perfumeEnabled: formData.perfumeEnabled,
        perfumeInterval: formData.perfumeInterval,
      },
    };

    try {
      await set(ref(database, `toilets/${toiletId}`), toiletData);
      toast.success(editingToilet ? 'Toilet updated!' : 'Toilet added!');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving toilet:', error);
      toast.error('Failed to save toilet');
    }
  };

  const handleEdit = (toilet: Toilet) => {
    setEditingToilet(toilet);
    setFormData({
      name: toilet.name,
      location: toilet.location,
      status: toilet.status,
      autoDoor: toilet.settings.autoDoor,
      autoFlush: toilet.settings.autoFlush,
      perfumeEnabled: toilet.settings.perfumeEnabled,
      perfumeInterval: toilet.settings.perfumeInterval,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this toilet?')) {
      try {
        await remove(ref(database, `toilets/${id}`));
        toast.success('Toilet deleted!');
      } catch (error) {
        console.error('Error deleting toilet:', error);
        toast.error('Failed to delete toilet');
      }
    }
  };

  const resetForm = () => {
    setEditingToilet(null);
    setFormData({
      name: '',
      location: '',
      status: 'available',
      autoDoor: true,
      autoFlush: true,
      perfumeEnabled: true,
      perfumeInterval: 30,
    });
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
                  Configure the toilet settings and location
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
                <div className="space-y-3 pt-2">
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

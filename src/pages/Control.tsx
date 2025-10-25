import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Toilet } from '@/types/toilet';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DoorOpen, Droplet, Wind } from 'lucide-react';
import { toast } from 'sonner';

const Control = () => {
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [selectedToiletId, setSelectedToiletId] = useState<string>('');
  const [loading, setLoading] = useState<string>('');

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
        if (!selectedToiletId && toiletList.length > 0) {
          setSelectedToiletId(toiletList[0].id);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const selectedToilet = toilets.find((t) => t.id === selectedToiletId);

  const handleDoorToggle = async () => {
    if (!selectedToilet) return;
    setLoading('door');
    
    try {
      await update(ref(database, `toilets/${selectedToiletId}`), {
        doorOpen: !selectedToilet.doorOpen,
      });
      toast.success(`Door ${!selectedToilet.doorOpen ? 'opened' : 'closed'} successfully`);
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
      await update(ref(database, `toilets/${selectedToiletId}`), {
        lastFlushed: new Date().toISOString(),
      });
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
      await update(ref(database, `toilets/${selectedToiletId}`), {
        lastPerfumed: new Date().toISOString(),
      });
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
          <p className="text-muted-foreground mt-1">Control toilet hardware remotely</p>
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
                        {toilet.name} - {toilet.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                      <div className={`inline-block px-4 py-2 rounded-full ${selectedToilet.doorOpen ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {selectedToilet.doorOpen ? 'Open' : 'Closed'}
                      </div>
                    </div>
                    <Button 
                      onClick={handleDoorToggle} 
                      disabled={loading === 'door'}
                      className="w-full"
                      variant={selectedToilet.doorOpen ? 'destructive' : 'default'}
                    >
                      {loading === 'door' ? 'Processing...' : selectedToilet.doorOpen ? 'Close Door' : 'Open Door'}
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
                    {selectedToilet.lastFlushed && (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        Last flushed:<br />
                        {new Date(selectedToilet.lastFlushed).toLocaleString()}
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
                      <div className={`inline-block px-4 py-2 rounded-full ${selectedToilet.settings.perfumeEnabled ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {selectedToilet.settings.perfumeEnabled ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <Button 
                      onClick={handlePerfume} 
                      disabled={loading === 'perfume' || !selectedToilet.settings.perfumeEnabled}
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

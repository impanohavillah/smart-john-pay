import { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Smartphone, HandCoins } from 'lucide-react';
import { toast } from 'sonner';
import { PaymentMethod } from '@/types/toilet';

const Payment = () => {
  const [paymentMethods, setPaymentMethods] = useState<{ [key: string]: PaymentMethod }>({
    card: { type: 'card', enabled: true, price: 200 },
    momo: { type: 'momo', enabled: true, price: 200 },
    manual: { type: 'manual', enabled: true },
  });

  useEffect(() => {
    const paymentRef = ref(database, 'payment_settings');
    const unsubscribe = onValue(paymentRef, (snapshot) => {
      if (snapshot.exists()) {
        setPaymentMethods(snapshot.val());
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = async (type: string, enabled: boolean) => {
    try {
      await update(ref(database, `payment_settings/${type}`), { enabled });
      toast.success(`${type.toUpperCase()} payment ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating payment method:', error);
      toast.error('Failed to update payment method');
    }
  };

  const handlePriceUpdate = async (type: string, price: number) => {
    try {
      await update(ref(database, `payment_settings/${type}`), { price });
      toast.success(`${type.toUpperCase()} price updated`);
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error('Failed to update price');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Payment Configuration</h1>
          <p className="text-muted-foreground mt-1">Manage payment methods and pricing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>RFID Card</CardTitle>
                  <CardDescription>Card Payment</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="card-enabled">Enable Card Payment</Label>
                <Switch
                  id="card-enabled"
                  checked={paymentMethods.card.enabled}
                  onCheckedChange={(checked) => handleToggle('card', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-price">Price (RWF)</Label>
                <Input
                  id="card-price"
                  type="number"
                  value={paymentMethods.card.price || 0}
                  onChange={(e) => {
                    const newPrice = parseInt(e.target.value) || 0;
                    setPaymentMethods({
                      ...paymentMethods,
                      card: { ...paymentMethods.card, price: newPrice },
                    });
                  }}
                  onBlur={(e) => handlePriceUpdate('card', parseInt(e.target.value) || 0)}
                  disabled={!paymentMethods.card.enabled}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Smartphone className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Mobile Money</CardTitle>
                  <CardDescription>MoMo Payment</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="momo-enabled">Enable MoMo Payment</Label>
                <Switch
                  id="momo-enabled"
                  checked={paymentMethods.momo.enabled}
                  onCheckedChange={(checked) => handleToggle('momo', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="momo-price">Price (RWF)</Label>
                <Input
                  id="momo-price"
                  type="number"
                  value={paymentMethods.momo.price || 0}
                  onChange={(e) => {
                    const newPrice = parseInt(e.target.value) || 0;
                    setPaymentMethods({
                      ...paymentMethods,
                      momo: { ...paymentMethods.momo, price: newPrice },
                    });
                  }}
                  onBlur={(e) => handlePriceUpdate('momo', parseInt(e.target.value) || 0)}
                  disabled={!paymentMethods.momo.enabled}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <HandCoins className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Manual Open</CardTitle>
                  <CardDescription>App Control</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="manual-enabled">Enable Manual Open</Label>
                <Switch
                  id="manual-enabled"
                  checked={paymentMethods.manual.enabled}
                  onCheckedChange={(checked) => handleToggle('manual', checked)}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Free for authenticated app users
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Building Cost Estimate</CardTitle>
            <CardDescription>Modern toilet construction using 40,000 RWF</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span>Cement (2 bags @ 10,000 RWF)</span>
                <span className="font-semibold">20,000 RWF</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Sand & Aggregate</span>
                <span className="font-semibold">8,000 RWF</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Bricks/Blocks</span>
                <span className="font-semibold">7,000 RWF</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Labor (Basic)</span>
                <span className="font-semibold">5,000 RWF</span>
              </div>
              <div className="flex justify-between py-2 font-bold text-lg">
                <span>Total Estimated Cost</span>
                <span className="text-primary">40,000 RWF</span>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                Note: Additional costs for plumbing, fixtures, and electronics not included. This is a basic structure estimate.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Payment;

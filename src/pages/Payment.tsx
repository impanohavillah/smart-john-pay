import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['payment_card', 'payment_momo', 'payment_manual']);

      if (error) throw error;

      if (data && data.length > 0) {
        const settings: any = {};
        data.forEach((item) => {
          try {
            const parsed = JSON.parse(item.setting_value);
            const type = item.setting_key.replace('payment_', '');
            settings[type] = parsed;
          } catch {
            // Handle invalid JSON
          }
        });
        setPaymentMethods((prev) => ({ ...prev, ...settings }));
      }
    } catch (error: any) {
      console.error('Error fetching payment settings');
    }
  };

  const updatePaymentSetting = async (type: string, data: PaymentMethod) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: `payment_${type}`,
          setting_value: JSON.stringify(data),
        });

      if (error) throw error;
      toast.success(`${type.toUpperCase()} payment updated`);
    } catch (error: any) {
      toast.error('Failed to update payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (type: string, enabled: boolean) => {
    const updated = { ...paymentMethods[type], enabled };
    setPaymentMethods({ ...paymentMethods, [type]: updated });
    updatePaymentSetting(type, updated);
  };

  const handlePriceUpdate = (type: string, price: number) => {
    const updated = { ...paymentMethods[type], price };
    setPaymentMethods({ ...paymentMethods, [type]: updated });
    updatePaymentSetting(type, updated);
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
                  disabled={loading}
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
                  disabled={!paymentMethods.card.enabled || loading}
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
                  disabled={loading}
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
                  disabled={!paymentMethods.momo.enabled || loading}
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
                  disabled={loading}
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
            <CardTitle>Payment Messages</CardTitle>
            <CardDescription>Recent payment transactions and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-3 border-b">
                <div className="bg-success/10 p-2 rounded-lg">
                  <CreditCard className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">RFID Card Payment Successful</p>
                  <p className="text-xs text-muted-foreground">Card payment method is active and ready</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3 border-b">
                <div className="bg-success/10 p-2 rounded-lg">
                  <Smartphone className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">MoMo Payment Configured</p>
                  <p className="text-xs text-muted-foreground">Mobile money payments are enabled</p>
                </div>
              </div>
              <div className="flex items-center gap-3 py-3 border-b">
                <div className="bg-success/10 p-2 rounded-lg">
                  <HandCoins className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Manual Access Available</p>
                  <p className="text-xs text-muted-foreground">App users can access via manual open</p>
                </div>
              </div>
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  All payment methods are operational. Transaction logs will appear here.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Payment;

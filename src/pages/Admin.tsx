import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CommandLog, AdminSettings } from '@/types/toilet';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, History, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const Admin = () => {
  const [secretCode, setSecretCode] = useState('');
  const [newSecretCode, setNewSecretCode] = useState('');
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSecretCode();
    fetchCommandLogs();

    // Subscribe to realtime updates for logs
    const channel = supabase
      .channel('command-logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'command_logs'
        },
        () => {
          fetchCommandLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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
      setNewSecretCode(data.setting_value);
    }
  };

  const fetchCommandLogs = async () => {
    const { data, error } = await supabase
      .from('command_logs')
      .select(`
        *,
        toilets:toilet_id (
          name,
          location
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching command logs:', error);
      toast.error('Failed to fetch command logs');
    } else {
      setCommandLogs((data as any) || []);
    }
  };

  const handleUpdateSecretCode = async () => {
    if (!newSecretCode || newSecretCode.length < 6) {
      toast.error('Secret code must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ setting_value: newSecretCode })
        .eq('setting_key', 'secret_code');

      if (error) throw error;

      setSecretCode(newSecretCode);
      toast.success('Secret code updated successfully');
    } catch (error) {
      console.error('Error updating secret code:', error);
      toast.error('Failed to update secret code');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'sent':
        return <Clock className="w-4 h-4 text-warning" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      success: 'default',
      failed: 'destructive',
      sent: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">Manage security settings and view command logs</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Secret Code Management</CardTitle>
                <CardDescription>
                  Update the secret code required for all commands
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentCode">Current Secret Code</Label>
              <Input
                id="currentCode"
                value={secretCode}
                disabled
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCode">New Secret Code</Label>
              <Input
                id="newCode"
                value={newSecretCode}
                onChange={(e) => setNewSecretCode(e.target.value)}
                placeholder="Enter new secret code (min 6 characters)"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                This code will be required for all GSM and WiFi commands
              </p>
            </div>
            <Button 
              onClick={handleUpdateSecretCode}
              disabled={loading || newSecretCode === secretCode}
            >
              {loading ? 'Updating...' : 'Update Secret Code'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-lg">
                <History className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle>Command Logs</CardTitle>
                <CardDescription>
                  Recent commands sent to toilets (last 50)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {commandLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No command logs yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Toilet</TableHead>
                      <TableHead>Command</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commandLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {(log as any).toilets?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(log as any).toilets?.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.command_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {log.control_mode.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.destination}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            {getStatusBadge(log.status)}
                          </div>
                          {log.error_message && (
                            <div className="text-xs text-destructive mt-1">
                              {log.error_message}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;

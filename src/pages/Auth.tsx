import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ref, set, get } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Droplet } from 'lucide-react';

const ADMIN_EMAIL = 'impanohavillah@gmail.com';
const ADMIN_PASSWORD = '!Fulgence0';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if admin login
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        const adminUser = {
          id: 'admin',
          username: 'Admin',
          email: ADMIN_EMAIL,
          role: 'admin',
          approved: true,
        };
        localStorage.setItem('user', JSON.stringify(adminUser));
        toast.success('Admin login successful!');
        navigate('/');
        return;
      }

      // Regular user login
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        const userEntry = Object.entries(users).find(
          ([_, user]: any) => user.email === email && user.password === password
        );

        if (userEntry) {
          const [userId, userData]: any = userEntry;
          
          if (!userData.approved) {
            toast.error('Your account is pending admin approval');
            return;
          }

          const user = {
            id: userId,
            username: userData.username,
            email: userData.email,
            role: userData.role,
            approved: userData.approved,
          };
          localStorage.setItem('user', JSON.stringify(user));
          toast.success('Login successful!');
          navigate('/');
        } else {
          toast.error('Invalid credentials');
        }
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userId = Date.now().toString();
      const userRef = ref(database, `users/${userId}`);
      const pendingRef = ref(database, `pending_approvals/${userId}`);

      const userData = {
        username,
        email,
        password,
        role: 'user',
        approved: false,
        createdAt: new Date().toISOString(),
      };

      await set(userRef, userData);
      await set(pendingRef, {
        userId,
        username,
        email,
        requestedAt: new Date().toISOString(),
      });

      toast.success('Account created! Waiting for admin approval.');
      setIsLogin(true);
      setUsername('');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-lg animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <Droplet className="w-12 h-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Smart Toilet System</CardTitle>
          <CardDescription>Intelligent Sanitation Management</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your account will require admin approval before you can login.
                </p>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

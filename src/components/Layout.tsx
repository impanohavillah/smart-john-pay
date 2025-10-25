import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Settings, CreditCard, Wrench, LogOut, Droplet } from 'lucide-react';
import { toast } from 'sonner';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/auth');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/control', icon: Wrench, label: 'Control' },
    { path: '/payment', icon: CreditCard, label: 'Payment' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Droplet className="w-6 h-6 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Smart Toilet
              </span>
            </Link>
            
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    asChild
                    className="gap-2"
                  >
                    <Link to={item.path}>
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </Link>
                  </Button>
                );
              })}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Zap, Shield, TrendingUp, Smartphone, DollarSign, BarChart3, MapPin, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const LandingPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ toilets: 0, transactions: 0, revenue: 0 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const fetchStats = async () => {
      const { data: toiletData } = await supabase.from('toilets').select('id', { count: 'exact' });
      const { data: paymentData } = await supabase.from('payments').select('amount');
      
      const totalRevenue = paymentData?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      
      setStats({
        toilets: toiletData?.length || 0,
        transactions: paymentData?.length || 0,
        revenue: totalRevenue
      });
    };
    
    fetchStats();
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
        
        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/50 px-4 py-2 backdrop-blur-sm">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Next-Generation Smart Sanitation</span>
            </div>
            
            <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
              Smart Toilet
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"> Management</span>
              <br />Revolutionized
            </h1>
            
            <p className="mb-10 text-xl text-muted-foreground md:text-2xl">
              IoT-powered sanitation management with real-time control, AI analytics, and seamless payment integration. Transform public restrooms into revenue-generating smart assets.
            </p>
            
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={handleGetStarted} className="text-lg shadow-lg hover:shadow-xl transition-all">
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
              <Button size="lg" variant="outline" onClick={handleGetStarted} className="text-lg">
                {isAuthenticated ? 'View Analytics' : 'View Demo'}
              </Button>
            </div>

            {/* Stats Counter */}
            <div className="mt-16 grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{stats.toilets}+</div>
                <div className="text-sm text-muted-foreground">Smart Toilets</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{stats.transactions.toLocaleString()}+</div>
                <div className="text-sm text-muted-foreground">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">${(stats.revenue / 100).toFixed(0)}+</div>
                <div className="text-sm text-muted-foreground">Revenue</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold">Powerful Features for Modern Management</h2>
          <p className="text-xl text-muted-foreground">Everything you need to operate smart sanitation facilities</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Smartphone,
              title: "IoT Control",
              description: "Real-time remote control via GSM/WiFi. Manage doors, flush, and perfume dispensers instantly.",
              gradient: "from-primary/10 to-primary/5"
            },
            {
              icon: DollarSign,
              title: "Payment Integration",
              description: "Accept card, mobile money, and cash payments. Automated revenue tracking and reconciliation.",
              gradient: "from-accent/10 to-accent/5"
            },
            {
              icon: BarChart3,
              title: "AI Analytics",
              description: "Smart insights on usage patterns, revenue optimization, and predictive maintenance scheduling.",
              gradient: "from-warning/10 to-warning/5"
            },
            {
              icon: Shield,
              title: "Enterprise Security",
              description: "Bank-level encryption, role-based access control, and complete audit trails for compliance.",
              gradient: "from-destructive/10 to-destructive/5"
            }
          ].map((feature, i) => (
            <Card key={i} className="group relative overflow-hidden border-2 transition-all hover:border-primary hover:shadow-lg">
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
              <CardContent className="relative p-6">
                <feature.icon className="mb-4 h-12 w-12 text-primary transition-transform group-hover:scale-110" />
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold">Why Choose SmartMe?</h2>
            <p className="text-xl text-muted-foreground">Built for scale, designed for efficiency</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: TrendingUp, title: "Increase Revenue", value: "40%", description: "Average revenue increase within 3 months" },
              { icon: Users, title: "Improve Satisfaction", value: "95%", description: "User satisfaction rate with smart facilities" },
              { icon: MapPin, title: "Reduce Costs", value: "30%", description: "Lower maintenance costs through predictive analytics" }
            ].map((benefit, i) => (
              <Card key={i} className="text-center">
                <CardContent className="p-8">
                  <benefit.icon className="mx-auto mb-4 h-16 w-16 text-primary" />
                  <div className="mb-2 text-5xl font-bold text-primary">{benefit.value}</div>
                  <h3 className="mb-2 text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-12 text-center">
            <h2 className="mb-4 text-4xl font-bold">Ready to Transform Your Facilities?</h2>
            <p className="mb-8 text-xl text-muted-foreground">Join leading operators using SmartMe to revolutionize sanitation management</p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" onClick={handleGetStarted} className="text-lg">
                {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
              </Button>
              <Button size="lg" variant="outline" onClick={handleGetStarted}>
                {isAuthenticated ? 'View Business Intel' : 'Schedule Demo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default LandingPage;

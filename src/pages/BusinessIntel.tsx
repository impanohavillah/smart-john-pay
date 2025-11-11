import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, DollarSign, Target, Users, Calendar, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

interface BusinessMetrics {
  totalRevenue: number;
  monthlyGrowth: number;
  avgTransactionValue: number;
  revenuePerToilet: number;
  utilizationRate: number;
  projectedAnnual: number;
}

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

const BusinessIntel = () => {
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    totalRevenue: 0,
    monthlyGrowth: 0,
    avgTransactionValue: 0,
    revenuePerToilet: 0,
    utilizationRate: 0,
    projectedAnnual: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [toiletPerformance, setToiletPerformance] = useState<any[]>([]);

  useEffect(() => {
    fetchBusinessMetrics();
  }, []);

  const fetchBusinessMetrics = async () => {
    // Fetch payments
    const { data: payments } = await supabase
      .from('payments')
      .select('amount, created_at, toilet_id')
      .order('created_at', { ascending: true });

    // Fetch toilets
    const { data: toilets } = await supabase
      .from('toilets')
      .select('id, name, location');

    if (!payments || !toilets) return;

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
    const avgTransaction = payments.length > 0 ? totalRevenue / payments.length : 0;
    const revenuePerToilet = toilets.length > 0 ? totalRevenue / toilets.length : 0;

    // Calculate monthly growth (comparing last 30 days to previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentRevenue = payments
      .filter(p => new Date(p.created_at) > thirtyDaysAgo)
      .reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

    const previousRevenue = payments
      .filter(p => new Date(p.created_at) > sixtyDaysAgo && new Date(p.created_at) <= thirtyDaysAgo)
      .reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

    const growth = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Revenue trend by month
    const monthlyData = payments.reduce((acc: any, payment) => {
      const month = new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!acc[month]) acc[month] = 0;
      acc[month] += (payment.amount || 0) / 100;
      return acc;
    }, {});

    const revenueChartData = Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue: Number((revenue as number).toFixed(2))
    }));

    // Toilet performance
    const toiletStats = toilets.map(toilet => {
      const toiletPayments = payments.filter(p => p.toilet_id === toilet.id);
      const toiletRevenue = toiletPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100;
      return {
        name: toilet.name,
        revenue: Number(toiletRevenue.toFixed(2)),
        transactions: toiletPayments.length
      };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    setMetrics({
      totalRevenue,
      monthlyGrowth: Number(growth.toFixed(1)),
      avgTransactionValue: Number(avgTransaction.toFixed(2)),
      revenuePerToilet: Number(revenuePerToilet.toFixed(2)),
      utilizationRate: 78, // Mock utilization rate
      projectedAnnual: Number((recentRevenue * 12).toFixed(2))
    });

    setRevenueData(revenueChartData);
    setToiletPerformance(toiletStats);
  };

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      change: `+${metrics.monthlyGrowth}%`,
      icon: DollarSign,
      positive: metrics.monthlyGrowth >= 0
    },
    {
      title: "Projected Annual",
      value: `$${metrics.projectedAnnual.toLocaleString()}`,
      change: "Based on current",
      icon: Target,
      positive: true
    },
    {
      title: "Avg Transaction",
      value: `$${metrics.avgTransactionValue.toFixed(2)}`,
      change: "Per use",
      icon: TrendingUp,
      positive: true
    },
    {
      title: "Revenue/Toilet",
      value: `$${metrics.revenuePerToilet.toLocaleString()}`,
      change: "Per unit",
      icon: Zap,
      positive: true
    },
    {
      title: "Utilization Rate",
      value: `${metrics.utilizationRate}%`,
      change: "Avg capacity",
      icon: Users,
      positive: metrics.utilizationRate > 70
    },
    {
      title: "Monthly Growth",
      value: `${metrics.monthlyGrowth}%`,
      change: "vs last month",
      icon: Calendar,
      positive: metrics.monthlyGrowth >= 0
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Business Intelligence</h1>
          <p className="mt-2 text-muted-foreground">
            Comprehensive financial metrics and performance analysis
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kpiCards.map((kpi, i) => (
            <Card key={i} className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.value}</div>
                <p className={`text-xs ${kpi.positive ? 'text-success' : 'text-destructive'}`}>
                  {kpi.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 60%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performing Toilets */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Locations</CardTitle>
              <CardDescription>Revenue by toilet location</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={toiletPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(217, 91%, 60%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Distribution</CardTitle>
              <CardDescription>Transactions per location</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={toiletPerformance}
                    dataKey="transactions"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {toiletPerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ROI Calculator */}
        <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
          <CardHeader>
            <CardTitle>ROI Analysis</CardTitle>
            <CardDescription>Investment return calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Investment Cost</p>
                <p className="text-2xl font-bold">$5,000</p>
                <p className="text-xs text-muted-foreground">Per toilet unit</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly ROI</p>
                <p className="text-2xl font-bold text-success">{metrics.revenuePerToilet > 0 ? ((metrics.revenuePerToilet / 5000) * 100).toFixed(1) : 0}%</p>
                <p className="text-xs text-muted-foreground">Return rate</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Break-even</p>
                <p className="text-2xl font-bold">{metrics.revenuePerToilet > 0 ? Math.ceil(5000 / metrics.revenuePerToilet) : 0} mo</p>
                <p className="text-xs text-muted-foreground">Time to ROI</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BusinessIntel;

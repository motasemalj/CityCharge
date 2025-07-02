import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Fab,
  Avatar,
  Stack,
  Chip,
  LinearProgress,
  BottomNavigation,
  BottomNavigationAction,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Bolt,
  MapOutlined,
  AccountBalanceWallet,
  Person,
  QrCodeScanner,
  LocationOn,
  History,
  Settings,
  Notifications,
  Add,
  TrendingUp,
  LocalFlorist,
  Speed,
} from '@mui/icons-material';
import api from '../lib/api';

interface DashboardStats {
  totalSessions: number;
  energyConsumed: number;
  activeSessions: number;
  walletBalance: number;
}

interface RecentSession {
  id: string;
  chargerName: string;
  duration: number;
  cost: number;
  status: string;
  date: string;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    energyConsumed: 0,
    activeSessions: 0,
    walletBalance: 0,
  });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
      return;
    }

    // Redirect admins to admin dashboard
    if (user.role === 'admin') {
      if (typeof window !== 'undefined') {
        router.push('/admin');
      }
      return;
    }

    fetchDashboardData();
  }, [user, loading, router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch dashboard data using new wallet endpoint
      const [sessionsRes, walletRes] = await Promise.all([
        api.get('/session'),
        api.get('/wallet')
      ]);

      const sessions = sessionsRes.data as any[];
      const wallet = walletRes.data as any;

      const stats: DashboardStats = {
        totalSessions: sessions.length,
        energyConsumed: sessions.reduce((sum: number, session: { kwhConsumed?: number }) => sum + (session.kwhConsumed || 0), 0),
        activeSessions: sessions.filter((s: { status: string }) => s.status === 'active').length,
        walletBalance: Number(wallet.balance) || 0
      };

      setStats(stats);

      // Mock recent sessions with real data
      const recent = sessions.slice(0, 5).map((session: { id: string; chargerId?: string; endTime?: string; startTime: string; cost?: number; status: string }) => ({
        id: session.id,
        chargerName: `Charger #${session.chargerId?.slice(-4) || '0001'}`,
        duration: Math.floor((new Date(session.endTime || Date.now()).getTime() - new Date(session.startTime).getTime()) / 60000),
        cost: session.cost || 0,
        status: session.status,
        date: new Date(session.startTime).toLocaleDateString()
      }));

      setRecentSessions(recent);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  // Helper function for role-based dashboard redirection
  const navigateToDashboard = () => {
    if (user?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: 'background.default'
      }}>
        <LinearProgress sx={{ width: 200 }} />
      </Box>
    );
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  const StatCard = ({ icon, title, value, color }: { 
    icon: React.ReactNode; 
    title: string; 
    value: string | number; 
    color: string; 
  }) => (
    <Card className="glassmorphism" sx={{ textAlign: 'center', height: '100%' }}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ color, mb: 1 }}>
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.1rem' }}>
          {value}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ icon, title, subtitle, color, onClick }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    color: string;
    onClick: () => void;
  }) => (
    <Card 
      className="glassmorphism" 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 32px ${color}30`,
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2, textAlign: 'center' }}>
        <Box sx={{ color, mb: 1 }}>
          {icon}
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      pb: 10, // Space for bottom navigation
    }}>
      {/* Background Gradient */}
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 107, 53, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, #000000 0%, #1a1a1a 100%)
          `,
          zIndex: -1,
        }}
      />

      <Box sx={{ p: 3, pt: 6 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                Dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Welcome back, {user.name}
              </Typography>
            </Box>
            <IconButton
              sx={{
                bgcolor: 'rgba(28, 28, 30, 0.8)',
                backdropFilter: 'blur(20px)',
                color: 'white',
              }}
            >
              <Badge badgeContent={2} color="primary">
                <Notifications />
              </Badge>
            </IconButton>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3
        }}>
          <StatCard
            icon={<TrendingUp />}
            title="Total Sessions"
            value={stats.totalSessions}
            color="#30D158"
          />
          <StatCard
            icon={<LocalFlorist />}
            title="Energy Used"
            value={`${stats.energyConsumed.toFixed(1)} kWh`}
            color="#00D4FF"
          />
          <StatCard
            icon={<AccountBalanceWallet />}
            title="Wallet"
            value={`AED ${(Number(stats.walletBalance) || 0).toFixed(0)}`}
            color="#FFD60A"
          />
          <StatCard
            icon={<Bolt />}
            title="Active Sessions"
            value={stats.activeSessions}
            color="#FF6B35"
          />
        </Box>

        {/* Quick Actions */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Actions
        </Typography>
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3
        }}>
          <QuickActionCard
            icon={<MapOutlined sx={{ fontSize: '2rem' }} />}
            title="Find Chargers"
            subtitle="Locate nearby stations"
            color="#00D4FF"
            onClick={() => router.push('/map')}
          />
          <QuickActionCard
            icon={<QrCodeScanner sx={{ fontSize: '2rem' }} />}
            title="Scan QR"
            subtitle="Start charging quickly"
            color="#30D158"
            onClick={() => router.push('/qr')}
          />
          <QuickActionCard
            icon={<AccountBalanceWallet sx={{ fontSize: '2rem' }} />}
            title="Top Up"
            subtitle="Add credit to wallet"
            color="#FFD60A"
            onClick={() => router.push('/wallet')}
          />
          <QuickActionCard
            icon={<History sx={{ fontSize: '2rem' }} />}
            title="History"
            subtitle="View past sessions"
            color="#FF6B35"
            onClick={() => router.push('/profile')}
          />
        </Box>

        {/* Recent Activity */}
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Recent Sessions
        </Typography>
        <Stack spacing={2}>
          {recentSessions.length > 0 ? (
            recentSessions.map((session) => (
              <Card key={session.id} className="glassmorphism">
                <CardContent sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {session.chargerName}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {session.date} • {session.duration} min
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        AED {session.cost.toFixed(2)}
                      </Typography>
                      <Chip 
                        label={session.status} 
                        size="small"
                        color={session.status === 'completed' ? 'success' : 'warning'}
                        sx={{ fontSize: '0.7rem' }}
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="glassmorphism">
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No recent sessions. Start your first charging session!
                </Typography>
              </CardContent>
            </Card>
          )}
        </Stack>
      </Box>

      {/* Bottom Navigation */}
      <BottomNavigation
        value={activeTab}
        onChange={(event, newValue) => setActiveTab(newValue)}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          height: 80,
        }}
        className="safe-area-bottom"
      >
        <BottomNavigationAction
          label="Dashboard"
          icon={<Bolt />}
          onClick={navigateToDashboard}
        />
        <BottomNavigationAction
          label="Map"
          icon={<MapOutlined />}
          onClick={() => router.push('/map')}
        />
        <BottomNavigationAction
          label="Wallet"
          icon={<AccountBalanceWallet />}
          onClick={() => router.push('/wallet')}
        />
        <BottomNavigationAction
          label="Profile"
          icon={<Person />}
          onClick={() => router.push('/profile')}
        />
      </BottomNavigation>
    </Box>
  );
} 
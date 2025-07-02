import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Button, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  TextField, 
  Stack, 
  MenuItem, 
  Alert, 
  Tabs, 
  Tab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Card, 
  Chip,
  CardContent,
  Grid,
  Paper,
  Avatar,
  Divider,
  Badge,
  IconButton,
  Tooltip as MuiTooltip,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  LocationOn, 
  Add, 
  MapOutlined, 
  Dashboard,
  AccountBalanceWallet,
  People,
  TrendingUp,
  PowerSettingsNew,
  Settings,
  Notifications,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Visibility,
  AccountBalance,
  ElectricCar,
  BatteryChargingFull,
  Analytics,
  Warning,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const AdminMapView = ({ chargers, onAddCharger }: { chargers: any[], onAddCharger: (lat: number, lng: number) => void }) => {
  const [viewState, setViewState] = useState({
    longitude: 55.2708,
    latitude: 25.2048,
    zoom: 11
  });

  const handleMapClick = (event: any) => {
    const { lng, lat } = event.lngLat;
    onAddCharger(lat, lng);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="#000">Charger Map View</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => onAddCharger(25.2048, 55.2708)} // Default Dubai coordinates
          sx={{ color: '#fff' }}
        >
          Add Charger
        </Button>
      </Box>
      
      <Box 
        height={500} 
        border="1px solid #ddd" 
        borderRadius={2}
        overflow="hidden"
      >
        <Map
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          style={{ width: '100%', height: '100%' }}
          {...viewState}
          onMove={(evt: any) => setViewState(evt.viewState)}
          onClick={handleMapClick}
        >
          <NavigationControl />
          
          {chargers.map((charger) => (
            <Marker
              key={charger.id}
              longitude={charger.lng}
              latitude={charger.lat}
            >
              <Box
                bgcolor={charger.status === 'available' ? '#4caf50' : charger.status === 'charging' ? '#ff9800' : '#f44336'}
                borderRadius="50%"
                width={24}
                height={24}
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow={2}
                sx={{ cursor: 'pointer' }}
                title={`${charger.vendor} - ${charger.status}`}
              >
                <LocationOn sx={{ fontSize: 16, color: '#fff' }} />
              </Box>
            </Marker>
          ))}
        </Map>
      </Box>
      
      <Box mt={2}>
        <Typography variant="body2" color="#666">
          • Green markers: Available chargers
        </Typography>
        <Typography variant="body2" color="#666">
          • Orange markers: Charging
        </Typography>
        <Typography variant="body2" color="#666">
          • Red markers: Out of service
        </Typography>
        <Typography variant="body2" color="#888" mt={1}>
          Click on the map to add a new charger at that location
        </Typography>
      </Box>
    </Box>
  );
};

export default function AdminPage() {
  const { user } = useAuth();
  const [chargers, setChargers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [analytics, setAnalytics] = useState({ sessions: 0, energy: 0, revenue: 0 });
  const [reservations, setReservations] = useState<any[]>([]);
  const [maxLoad] = useState(100); // kW, can be made configurable
  const { notify } = useNotification();
  const [addChargerDialog, setAddChargerDialog] = useState(false);
  const [newCharger, setNewCharger] = useState({
    vendor: '',
    model: '',
    powerKW: '',
    address: '',
    latitude: '',
    longitude: '',
    connectorType: 'Type2',
    pricePerKwh: ''
  });
  const [editCharger, setEditCharger] = useState<any>(null);
  const [editChargerDialog, setEditChargerDialog] = useState(false);
  const [totalPurchases, setTotalPurchases] = useState({ totalPurchases: 0, totalUsers: 0, totalTransactions: 0 });
  const [walletDialog, setWalletDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newBalance, setNewBalance] = useState('');
  const [transactionsDialog, setTransactionsDialog] = useState(false);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/charger').then(res => setChargers(res.data as any[]));
      api.get('/admin/users').then(res => setUsers(res.data as any[]));
      api.get('/admin/analytics/purchases').then(res => setTotalPurchases(res.data as any));
      api.get('/session').then(res => {
        const sessions = res.data as any[];
        setAnalytics(a => ({ ...a, sessions: sessions.length, energy: sessions.reduce((sum: number, s: any) => sum + (s.kwhConsumed || 0), 0) }));
        // Sessions per day
        const byDay: Record<string, number> = {};
        sessions.forEach((s: any) => {
          const day = new Date(s.startTime).toLocaleDateString();
          byDay[day] = (byDay[day] || 0) + 1;
        });
        // Removed unused chart states
      });
      api.get('/payment').then(res => {
        const payments = res.data as any[];
        setAnalytics(a => ({ ...a, revenue: payments.filter((p: any) => p.status === 'completed').reduce((sum: number, p: any) => sum + (p.amount || 0), 0) }));
        // Revenue per day
        const byDay: Record<string, number> = {};
        payments.filter((p: any) => p.status === 'completed').forEach((p: any) => {
          const day = new Date(p.createdAt).toLocaleDateString();
          byDay[day] = (byDay[day] || 0) + p.amount;
        });
        // Removed unused chart states
      });
      api.get('/reservation/all').then(res => setReservations(res.data as any[]));
    }
  }, [user]);

  const deactivateUser = async (id: string) => {
    setError(''); setSuccess('');
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users => users.filter(u => u.id !== id));
      setSuccess('User deactivated');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const changeRole = async (id: string, role: 'user' | 'admin') => {
    setError(''); setSuccess('');
    try {
      await api.patch(`/admin/users/${id}/role`, { role });
      setUsers(users => users.map(u => u.id === id ? { ...u, role } : u));
      setSuccess('Role updated');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const cancelReservation = async (id: string) => {
    try {
      await api.delete(`/reservation/${id}`);
      setReservations(reservations => reservations.filter(r => r.id !== id));
      notify('Reservation cancelled', 'success');
    } catch (err: any) {
      notify(err.response?.data?.message || 'Failed to cancel reservation', 'error');
    }
  };

  const handleAddCharger = (lat: number, lng: number) => {
    setNewCharger(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }));
    setAddChargerDialog(true);
  };

  const createCharger = async () => {
    setError(''); setSuccess('');
    try {
      const chargerData = {
        vendor: newCharger.vendor,
        model: newCharger.model,
        powerKW: parseFloat(newCharger.powerKW),
        lat: parseFloat(newCharger.latitude),
        lng: parseFloat(newCharger.longitude),
        address: newCharger.address,
        connectorTypes: [newCharger.connectorType],
        status: 'available',
        pricePerKwh: parseFloat(newCharger.pricePerKwh)
      };
      
      const response = await api.post('/charger', chargerData);
      setChargers(prev => [...prev, response.data]);
      setAddChargerDialog(false);
      setNewCharger({
        vendor: '',
        model: '',
        powerKW: '',
        address: '',
        latitude: '',
        longitude: '',
        connectorType: 'Type2',
        pricePerKwh: ''
      });
      setSuccess('Charger added successfully');
      notify('Charger added successfully', 'success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add charger');
      notify(err.response?.data?.message || 'Failed to add charger', 'error');
    }
  };

  const deactivateCharger = async (id: string) => {
    setError(''); setSuccess('');
    try {
      await api.delete(`/charger/${id}`);
      setChargers(chargers => chargers.filter(c => c.id !== id));
      setSuccess('Charger deactivated');
      notify('Charger deactivated', 'success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to deactivate charger');
      notify(err.response?.data?.message || 'Failed to deactivate charger', 'error');
    }
  };

  const handleEditCharger = (charger: any) => {
    setEditCharger({
      ...charger,
      connectorType: charger.connectorTypes?.[0] || 'Type2'
    });
    setEditChargerDialog(true);
  };

  const updateCharger = async () => {
    setError(''); setSuccess('');
    try {
      const chargerData = {
        vendor: editCharger.vendor,
        model: editCharger.model,
        powerKW: parseFloat(editCharger.powerKW),
        lat: parseFloat(editCharger.lat),
        lng: parseFloat(editCharger.lng),
        address: editCharger.address,
        connectorTypes: [editCharger.connectorType],
        pricePerKwh: parseFloat(editCharger.pricePerKwh)
      };
      
      const response = await api.patch(`/charger/${editCharger.id}`, chargerData);
      setChargers(prev => prev.map(c => c.id === editCharger.id ? response.data : c));
      setEditChargerDialog(false);
      setEditCharger(null);
      setSuccess('Charger updated successfully');
      notify('Charger updated successfully', 'success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update charger');
      notify(err.response?.data?.message || 'Failed to update charger', 'error');
    }
  };

  const handleAdjustBalance = (user: any) => {
    setSelectedUser(user);
    setNewBalance(user.walletBalance?.toString() || '0');
    setWalletDialog(true);
  };

  const adjustUserBalance = async () => {
    setError(''); setSuccess('');
    try {
      await api.post(`/admin/users/${selectedUser.id}/adjust-balance`, {
        amount: parseFloat(newBalance),
        description: `Admin balance adjustment - Set to AED ${newBalance}`
      });
      
      // Refresh users list to show updated balance
      const res = await api.get('/admin/users');
      setUsers(res.data as any[]);
      
      setWalletDialog(false);
      setSelectedUser(null);
      setNewBalance('');
      setSuccess('User balance updated successfully');
      notify('User balance updated successfully', 'success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update balance');
      notify(err.response?.data?.message || 'Failed to update balance', 'error');
    }
  };

  const viewUserTransactions = async (user: { id: string }) => {
    setSelectedUser(user);
    try {
      const res = await api.get(`/admin/users/${user.id}/transactions`);
      setUserTransactions(res.data as any[]);
      setTransactionsDialog(true);
    } catch {
      setError('Failed to load user transactions');
      notify('Failed to load user transactions', 'error');
    }
  };

  // Calculate current and reserved load
  const currentLoad = chargers.filter(c => c.status === 'charging').reduce((sum, c) => sum + (c.powerKW || 0), 0);
  const reservedLoad = reservations.filter(r => r.status === 'active').reduce((sum, r) => {
    const charger = chargers.find(c => c.id === r.chargerId);
    return sum + (charger?.powerKW || 0);
  }, 0);
  const totalLoad = currentLoad + reservedLoad;
  const loadWarning = totalLoad > maxLoad * 0.9;
  const loadExceeded = totalLoad > maxLoad;

  if (!user || user.role !== 'admin') {
    return (
      <Box 
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Paper
          elevation={24}
          sx={{
            p: 6,
            borderRadius: 4,
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            bgcolor: 'rgba(255,255,255,0.95)'
          }}
        >
          <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'error.main', width: 64, height: 64 }}>
            <Warning sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography variant="h5" color="text.primary" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You must be an admin to view this page.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50vh',
          background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.1) 0%, rgba(203, 213, 225, 0.1) 100%)',
          zIndex: 0,
        },
        pb: 4
      }}
    >
      {/* Professional Header */}
      <Box 
        sx={{
          position: 'relative',
          zIndex: 1,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          py: 3,
          px: 3,
          mb: 4
        }}
      >
        <Box maxWidth={1400} mx="auto">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" sx={{ 
                fontWeight: 600, 
                mb: 0.5,
                color: '#1e293b',
                letterSpacing: '-0.025em'
              }}>
                Admin Dashboard
              </Typography>
              <Typography variant="body1" sx={{ 
                color: '#64748b',
                fontWeight: 400
              }}>
                Manage your EV charging platform with powerful insights
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Badge badgeContent={3} color="error">
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    background: 'rgba(148, 163, 184, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'rgba(148, 163, 184, 0.2)',
                    }
                  }}
                >
                  <Notifications sx={{ color: '#64748b', fontSize: 20 }} />
                </Box>
              </Badge>
              <Avatar sx={{ 
                bgcolor: 'linear-gradient(135deg, #64748b, #475569)',
                width: 44,
                height: 44,
                border: '2px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                fontWeight: 600
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </Avatar>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box maxWidth={1400} mx="auto" px={3} sx={{ position: 'relative', zIndex: 1 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              '& .MuiAlert-message': { fontWeight: 500 }
            }}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              '& .MuiAlert-message': { fontWeight: 500 }
            }}
          >
            {success}
          </Alert>
        )}
        
        {/* Professional Tabs */}
        <Box 
          sx={{ 
            borderRadius: '20px',
            mb: 4,
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={(e, value) => setActiveTab(value)} 
            sx={{ 
              p: 1,
              '& .MuiTab-root': {
                minHeight: 60,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: '#64748b',
                borderRadius: '16px',
                mx: 0.5,
                transition: 'all 0.3s ease',
                '&.Mui-selected': {
                  color: '#1e293b',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(148, 163, 184, 0.2)'
                },
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.5)',
                }
              },
              '& .MuiTabs-indicator': {
                display: 'none'
              }
            }}
          >
            <Tab 
              icon={<Dashboard sx={{ fontSize: 20 }} />} 
              label="Overview" 
              iconPosition="start"
              sx={{ gap: 1.5, minWidth: 140 }}
            />
            <Tab 
              icon={<AccountBalanceWallet sx={{ fontSize: 20 }} />} 
              label="Wallet Management" 
              iconPosition="start"
              sx={{ gap: 1.5, minWidth: 180 }}
            />
            <Tab 
              icon={<MapOutlined sx={{ fontSize: 20 }} />} 
              label="Chargers & Map" 
              iconPosition="start"
              sx={{ gap: 1.5, minWidth: 160 }}
            />
          </Tabs>
        </Box>

      {activeTab === 0 && (
        <Box>
          {/* Professional Metrics Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3, 
            mb: 4 
          }}>
            <Box
              sx={{
                p: 3,
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <ElectricCar sx={{ fontSize: 24, color: '#3b82f6' }} />
                </Box>
                <Typography variant="h3" sx={{ 
                  fontWeight: 700, 
                  color: '#1e293b',
                  letterSpacing: '-0.02em'
                }}>
                  {analytics.sessions}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                Total Sessions
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Active charging sessions
              </Typography>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))',
                    border: '1px solid rgba(34, 197, 94, 0.2)'
                  }}
                >
                  <BatteryChargingFull sx={{ fontSize: 24, color: '#22c55e' }} />
                </Box>
                <Typography variant="h3" sx={{ 
                  fontWeight: 700, 
                  color: '#1e293b',
                  letterSpacing: '-0.02em'
                }}>
                  {analytics.energy.toFixed(0)}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                Energy Delivered
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                kWh consumed total
              </Typography>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(147, 51, 234, 0.1))',
                    border: '1px solid rgba(168, 85, 247, 0.2)'
                  }}
                >
                  <TrendingUp sx={{ fontSize: 24, color: '#a855f7' }} />
                </Box>
                <Typography variant="h3" sx={{ 
                  fontWeight: 700, 
                  color: '#1e293b',
                  letterSpacing: '-0.02em'
                }}>
                  AED {analytics.revenue.toFixed(0)}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                Total Revenue
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                AED earned from sessions
              </Typography>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
                }
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))',
                    border: '1px solid rgba(245, 158, 11, 0.2)'
                  }}
                >
                  <People sx={{ fontSize: 24, color: '#f59e0b' }} />
                </Box>
                <Typography variant="h3" sx={{ 
                  fontWeight: 700, 
                  color: '#1e293b',
                  letterSpacing: '-0.02em'
                }}>
                  {totalPurchases.totalUsers}
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5, color: '#1e293b' }}>
                Active Users
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Users with wallets
              </Typography>
            </Box>
          </Box>

          {/* Professional Secondary Metrics */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 3,
            mb: 4
          }}>
            <Box
              sx={{
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ p: 4, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                  Platform Analytics
                </Typography>
                <Typography variant="body2" color="#64748b">
                  Real-time insights into platform performance
                </Typography>
              </Box>
              <Box sx={{ p: 4 }}>
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 4
                }}>
                  <Box textAlign="center">
                    <Box
                      sx={{
                        mx: 'auto',
                        mb: 2,
                        width: 64,
                        height: 64,
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.1))',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <AccountBalance sx={{ fontSize: 28, color: '#3b82f6' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6', mb: 0.5 }}>
                      AED {totalPurchases.totalPurchases.toFixed(0)}
                    </Typography>
                    <Typography variant="body2" color="#64748b">
                      Wallet Spending
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Box
                      sx={{
                        mx: 'auto',
                        mb: 2,
                        width: 64,
                        height: 64,
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.1))',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Analytics sx={{ fontSize: 28, color: '#22c55e' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#22c55e', mb: 0.5 }}>
                      {totalPurchases.totalTransactions}
                    </Typography>
                    <Typography variant="body2" color="#64748b">
                      Total Transactions
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Box
                      sx={{
                        mx: 'auto',
                        mb: 2,
                        width: 64,
                        height: 64,
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <PowerSettingsNew sx={{ fontSize: 28, color: '#f59e0b' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b', mb: 0.5 }}>
                      {currentLoad}
                    </Typography>
                    <Typography variant="body2" color="#64748b">
                      Current Load (kW)
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
                height: '100%'
              }}
            >
              <Box sx={{ p: 4, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                  Load Management
                </Typography>
              </Box>
              <Box sx={{ p: 4 }}>
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="#64748b" sx={{ fontWeight: 500 }}>
                      Current Load
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {currentLoad} / {maxLoad} kW
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(currentLoad / maxLoad) * 100}
                    sx={{ 
                      height: 8, 
                      borderRadius: '8px',
                      bgcolor: 'rgba(148, 163, 184, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: '8px',
                        bgcolor: currentLoad > maxLoad * 0.9 ? '#ef4444' : '#22c55e'
                      }
                    }}
                  />
                </Box>
                
                <Box mb={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="#64748b" sx={{ fontWeight: 500 }}>
                      Reserved Load
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      {reservedLoad} kW
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(reservedLoad / maxLoad) * 100}
                    sx={{ 
                      height: 8, 
                      borderRadius: '8px',
                      bgcolor: 'rgba(148, 163, 184, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: '8px',
                        bgcolor: '#f59e0b'
                      }
                    }}
                  />
                </Box>

                {loadExceeded && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 2, 
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    Site load exceeded!
                  </Alert>
                )}
                {!loadExceeded && loadWarning && (
                  <Alert 
                    severity="warning" 
                    sx={{ 
                      mb: 2, 
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}
                  >
                    Near capacity
                  </Alert>
                )}
              </Box>
            </Box>
          </Box>

          {/* Professional Quick User Overview */}
          <Box
            sx={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              mb: 4
            }}
          >
            <Box sx={{ p: 4, borderBottom: '1px solid rgba(148, 163, 184, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                  User Overview
                </Typography>
                <Typography variant="body2" color="#64748b">
                  Quick snapshot of platform users
                </Typography>
              </Box>
              <Button
                variant="contained"
                onClick={() => setActiveTab(1)}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  background: '#ffffff',
                  color: '#3b82f6',
                  border: '2px solid #e2e8f0',
                  px: 3,
                  py: 1.5,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    background: '#f8fafc',
                    border: '2px solid #cbd5e1',
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                View All Users
              </Button>
            </Box>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'rgba(148, 163, 184, 0.05)',
                  '& .MuiTableCell-root': {
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                  }
                }}>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 2 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 2 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 2 }}>Wallet Balance</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#1e293b', py: 2 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.slice(0, 5).map((u: any) => (
                  <TableRow 
                    key={u.id} 
                    sx={{ 
                      '&:hover': { 
                        background: 'rgba(148, 163, 184, 0.05)' 
                      },
                      '& .MuiTableCell-root': {
                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                        py: 2
                      }
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ 
                          width: 40, 
                          height: 40, 
                          background: '#ffffff',
                          color: '#3b82f6',
                          border: '2px solid #e2e8f0',
                          fontWeight: 600,
                          fontSize: '0.9rem'
                        }}>
                          {u.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {u.name}
                          </Typography>
                          <Typography variant="caption" color="#64748b">
                            {u.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={u.role} 
                        size="small"
                        sx={{
                          fontWeight: 500,
                          ...(u.role === 'admin' && {
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                          }),
                          ...(u.role === 'user' && {
                            background: 'rgba(148, 163, 184, 0.1)',
                            color: '#64748b',
                            border: '1px solid rgba(148, 163, 184, 0.2)'
                          })
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          fontWeight: 600,
                          color: (Number(u.walletBalance) || 0) > 0 ? '#22c55e' : '#64748b'
                        }}
                      >
                        AED {(Number(u.walletBalance) || 0).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={u.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          fontWeight: 500,
                          ...(u.isActive && {
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            border: '1px solid rgba(34, 197, 94, 0.2)'
                          }),
                          ...(!u.isActive && {
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.2)'
                          })
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {/* Wallet Management Tab */}
          <Typography variant="h6" mb={3} color="#000">Wallet Management Center</Typography>
          
          {/* Wallet Analytics Cards */}
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
              gap: 2,
              mb: 4
            }}
          >
            <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {totalPurchases.totalUsers}
              </Typography>
              <Typography variant="body2" color="#666">
                Total Users with Wallets
              </Typography>
            </Card>
            
            <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e8' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                AED {totalPurchases.totalPurchases.toFixed(0)}
              </Typography>
              <Typography variant="body2" color="#666">
                Total Wallet Spending
              </Typography>
            </Card>
            
            <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                {totalPurchases.totalTransactions}
              </Typography>
              <Typography variant="body2" color="#666">
                Total Transactions
              </Typography>
            </Card>
            
            <Card sx={{ p: 2, textAlign: 'center', backgroundColor: '#fce4ec' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#e91e63' }}>
                AED {users.reduce((sum, u) => sum + (Number(u.walletBalance) || 0), 0).toFixed(0)}
              </Typography>
              <Typography variant="body2" color="#666">
                Total Balance in System
              </Typography>
            </Card>
          </Box>

          {/* Professional User Management Table */}
          <Box
            sx={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              mb: 4
            }}
          >
            <Box sx={{ p: 4, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                User Wallet Management
              </Typography>
              <Typography variant="body2" color="#64748b">
                Manage user wallet balances and view transaction history
              </Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ 
                  background: 'rgba(148, 163, 184, 0.05)',
                  '& .MuiTableCell-root': {
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                  }
                }}>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>User Details</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Role</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Current Balance</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Total Deposited</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Total Spent</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u: any) => (
                  <TableRow 
                    key={u.id} 
                    sx={{ 
                      '&:hover': { 
                        background: 'rgba(148, 163, 184, 0.05)' 
                      },
                      '& .MuiTableCell-root': {
                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                        py: 2
                      }
                    }}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {u.name}
                        </Typography>
                        <Typography variant="caption" color="#64748b">
                          {u.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <TextField 
                        select 
                        value={u.role} 
                        onChange={e => changeRole(u.id, e.target.value as 'user' | 'admin')} 
                        size="small"
                        sx={{ 
                          minWidth: 100,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.8)',
                            '& fieldset': {
                              borderColor: 'rgba(148, 163, 184, 0.3)'
                            }
                          }
                        }}
                      >
                        <MenuItem value="user">User</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 600, 
                            color: (Number(u.walletBalance) || 0) > 0 ? '#22c55e' : '#64748b',
                            mr: 1
                          }}
                        >
                          AED {(Number(u.walletBalance) || 0).toFixed(2)}
                        </Typography>
                        {(Number(u.walletBalance) || 0) < 10 && (
                          <Chip 
                            label="Low" 
                            size="small" 
                            sx={{ 
                              fontSize: '0.7rem',
                              background: 'rgba(245, 158, 11, 0.1)',
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.2)'
                            }} 
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>
                      AED {(Number(u.totalDeposited) || 0).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>
                      AED {(Number(u.totalSpent) || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => handleAdjustBalance(u)}
                          sx={{ 
                            color: '#3b82f6',
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                            background: 'rgba(59, 130, 246, 0.05)',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            minWidth: 'auto',
                            px: 1.5,
                            fontWeight: 500,
                            '&:hover': {
                              background: 'rgba(59, 130, 246, 0.1)',
                              borderColor: 'rgba(59, 130, 246, 0.5)'
                            }
                          }}
                        >
                          Adjust
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => viewUserTransactions(u)}
                          sx={{ 
                            color: '#f59e0b',
                            borderColor: 'rgba(245, 158, 11, 0.3)',
                            background: 'rgba(245, 158, 11, 0.05)',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            minWidth: 'auto',
                            px: 1.5,
                            fontWeight: 500,
                            '&:hover': {
                              background: 'rgba(245, 158, 11, 0.1)',
                              borderColor: 'rgba(245, 158, 11, 0.5)'
                            }
                          }}
                        >
                          History
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="small"
                          onClick={() => deactivateUser(u.id)}
                          sx={{ 
                            color: '#ef4444',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.05)',
                            borderRadius: '12px',
                            fontSize: '0.75rem', 
                            minWidth: 'auto', 
                            px: 1.5,
                            fontWeight: 500,
                            '&:hover': {
                              background: 'rgba(239, 68, 68, 0.1)',
                              borderColor: 'rgba(239, 68, 68, 0.5)'
                            }
                          }}
                        >
                          Deactivate
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}

      {activeTab === 2 && (
        <Box>
          <AdminMapView chargers={chargers} onAddCharger={handleAddCharger} />
          
          {/* Professional Charger Management Table */}
          <Box
            sx={{
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              mt: 4
            }}
          >
            <Box sx={{ p: 4, borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                Charger Management
              </Typography>
              <Typography variant="body2" color="#64748b">
                Monitor and manage charging stations across your network
              </Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ 
                  background: 'rgba(148, 163, 184, 0.05)',
                  '& .MuiTableCell-root': {
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                  }
                }}>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Vendor</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Model</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Location</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Status</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Power</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Connector</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Rate (AED/kWh)</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Rating</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chargers.map((c: any) => (
                  <TableRow 
                    key={c.id}
                    sx={{ 
                      '&:hover': { 
                        background: 'rgba(148, 163, 184, 0.05)' 
                      },
                      '& .MuiTableCell-root': {
                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                        py: 2
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>{c.vendor}</TableCell>
                    <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>{c.model}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{c.address}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.status}
                        size="small"
                        sx={{
                          background: c.status === 'active' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: c.status === 'active' ? '#22c55e' : '#ef4444',
                          border: `1px solid ${c.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                          fontWeight: 500
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>{c.powerKW} kW</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>{c.connectorTypes?.join(', ') || 'N/A'}</TableCell>
                    <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>{c.pricePerKwh?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell sx={{ color: '#64748b' }}>
                      ⭐ {c.rating?.toFixed(1) || '0.0'} ({c.reviewCount || 0})
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={() => handleEditCharger(c)}
                          sx={{ 
                            color: '#3b82f6',
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                            background: 'rgba(59, 130, 246, 0.05)',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            minWidth: 'auto',
                            px: 1.5,
                            fontWeight: 500,
                            '&:hover': {
                              background: 'rgba(59, 130, 246, 0.1)',
                              borderColor: 'rgba(59, 130, 246, 0.5)'
                            }
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="outlined"
                          size="small"
                          onClick={() => deactivateCharger(c.id)}
                          sx={{ 
                            color: '#ef4444',
                            borderColor: 'rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.05)',
                            borderRadius: '12px',
                            fontSize: '0.75rem', 
                            minWidth: 'auto', 
                            px: 1.5,
                            fontWeight: 500,
                            '&:hover': {
                              background: 'rgba(239, 68, 68, 0.1)',
                              borderColor: 'rgba(239, 68, 68, 0.5)'
                            }
                          }}
                        >
                          Deactivate
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}

      {/* Add Charger Dialog */}
      <Dialog 
        open={addChargerDialog} 
        onClose={() => setAddChargerDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#1e293b', 
          fontWeight: 600,
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          pb: 2
        }}>
          Add New Charger
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Vendor"
              value={newCharger.vendor}
              onChange={(e) => setNewCharger(prev => ({ ...prev, vendor: e.target.value }))}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' }
                }
              }}
            />
            <TextField
              label="Model"
              value={newCharger.model}
              onChange={(e) => setNewCharger(prev => ({ ...prev, model: e.target.value }))}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' }
                }
              }}
            />
            <TextField
              label="Power (kW)"
              type="number"
              value={newCharger.powerKW}
              onChange={(e) => setNewCharger(prev => ({ ...prev, powerKW: e.target.value }))}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' }
                }
              }}
            />
            <TextField
              label="Address"
              value={newCharger.address}
              onChange={(e) => setNewCharger(prev => ({ ...prev, address: e.target.value }))}
              fullWidth
              multiline
              rows={2}
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' }
                }
              }}
            />
            <TextField
              label="Latitude"
              type="number"
              value={newCharger.latitude}
              onChange={(e) => setNewCharger(prev => ({ ...prev, latitude: e.target.value }))}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' }
                }
              }}
            />
            <TextField
              label="Longitude"
              type="number"
              value={newCharger.longitude}
              onChange={(e) => setNewCharger(prev => ({ ...prev, longitude: e.target.value }))}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' }
                }
              }}
            />
            <TextField
              select
              label="Connector Type"
              value={newCharger.connectorType}
              onChange={(e) => setNewCharger(prev => ({ ...prev, connectorType: e.target.value }))}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' }
                }
              }}
            >
              <MenuItem value="Type2">Type 2</MenuItem>
              <MenuItem value="CCS">CCS</MenuItem>
              <MenuItem value="CHAdeMO">CHAdeMO</MenuItem>
              <MenuItem value="Tesla">Tesla</MenuItem>
            </TextField>
            <TextField
              label="Rate per kWh (AED)"
              type="number"
              value={newCharger.pricePerKwh}
              onChange={(e) => setNewCharger(prev => ({ ...prev, pricePerKwh: e.target.value }))}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' }
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <Button 
            onClick={() => setAddChargerDialog(false)} 
            sx={{ 
              color: '#64748b',
              borderRadius: '12px',
              px: 3,
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={createCharger} 
            variant="contained"
            disabled={!newCharger.vendor || !newCharger.model || !newCharger.powerKW || !newCharger.address || !newCharger.pricePerKwh}
            sx={{ 
              background: '#ffffff',
              color: '#3b82f6',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              px: 3,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              '&:hover': {
                background: '#f8fafc',
                border: '2px solid #cbd5e1',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            Add Charger
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Charger Dialog */}
      <Dialog open={editChargerDialog} onClose={() => setEditChargerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#000' }}>Edit Charger</DialogTitle>
        <DialogContent>
          {editCharger && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Vendor"
                value={editCharger.vendor}
                onChange={(e) => setEditCharger((prev: any) => ({ ...prev, vendor: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="Model"
                value={editCharger.model || ''}
                onChange={(e) => setEditCharger((prev: any) => ({ ...prev, model: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="Power (kW)"
                type="number"
                value={editCharger.powerKW}
                onChange={(e) => setEditCharger((prev: any) => ({ ...prev, powerKW: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="Address"
                value={editCharger.address}
                onChange={(e) => setEditCharger((prev: any) => ({ ...prev, address: e.target.value }))}
                fullWidth
                multiline
                rows={2}
                required
              />
              <TextField
                label="Latitude"
                type="number"
                value={editCharger.lat}
                onChange={(e) => setEditCharger((prev: any) => ({ ...prev, lat: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                label="Longitude"
                type="number"
                value={editCharger.lng}
                onChange={(e) => setEditCharger((prev: any) => ({ ...prev, lng: e.target.value }))}
                fullWidth
                required
              />
              <TextField
                select
                label="Connector Type"
                value={editCharger.connectorType}
                onChange={(e) => setEditCharger((prev: any) => ({ ...prev, connectorType: e.target.value }))}
                fullWidth
              >
                <MenuItem value="Type2">Type 2</MenuItem>
                <MenuItem value="CCS">CCS</MenuItem>
                <MenuItem value="CHAdeMO">CHAdeMO</MenuItem>
                <MenuItem value="Tesla">Tesla</MenuItem>
              </TextField>
              <TextField
                label="Rate per kWh (AED)"
                type="number"
                value={editCharger.pricePerKwh}
                onChange={(e) => setEditCharger((prev: any) => ({ ...prev, pricePerKwh: e.target.value }))}
                fullWidth
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditChargerDialog(false)} sx={{ color: '#000' }}>
            Cancel
          </Button>
          <Button 
            onClick={updateCharger} 
            variant="contained"
            disabled={!editCharger?.vendor || !editCharger?.model || !editCharger?.powerKW || !editCharger?.address || !editCharger?.pricePerKwh}
            sx={{ color: '#fff' }}
          >
            Update Charger
          </Button>
        </DialogActions>
      </Dialog>

      {/* Professional Wallet Balance Adjustment Dialog */}
      <Dialog 
        open={walletDialog} 
        onClose={() => setWalletDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#1e293b', 
          fontWeight: 600,
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          pb: 2
        }}>
          Adjust User Wallet Balance
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Adjusting balance for: {selectedUser?.email}
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Current balance: AED {(Number(selectedUser?.walletBalance) || 0).toFixed(2)}
          </Typography>
          <TextField
            label="New Balance (AED)"
            type="number"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
            fullWidth
            required
            inputProps={{ min: 0, step: 0.01 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.8)',
                '& fieldset': { borderColor: 'rgba(148, 163, 184, 0.3)' }
              }
            }}
          />
          <Typography variant="caption" sx={{ color: '#64748b', mt: 2, display: 'block' }}>
            This will set the user's wallet balance to the exact amount specified.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
          <Button 
            onClick={() => setWalletDialog(false)} 
            sx={{ 
              color: '#64748b',
              borderRadius: '12px',
              px: 3,
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={adjustUserBalance} 
            variant="contained"
            disabled={!newBalance || parseFloat(newBalance) < 0}
            sx={{ 
              background: '#ffffff',
              color: '#3b82f6',
              border: '2px solid #e2e8f0',
              borderRadius: '12px',
              px: 3,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              '&:hover': {
                background: '#f8fafc',
                border: '2px solid #cbd5e1',
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            Update Balance
          </Button>
        </DialogActions>
      </Dialog>

      {/* Professional User Transactions History Dialog */}
      <Dialog 
        open={transactionsDialog} 
        onClose={() => setTransactionsDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#1e293b', 
          fontWeight: 600,
          borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          pb: 2
        }}>
          Transaction History - {selectedUser?.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            User: {selectedUser?.email} | Current Balance: AED {(Number(selectedUser?.walletBalance) || 0).toFixed(2)}
          </Typography>
          
          {userTransactions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="#64748b">
                No transactions found for this user.
              </Typography>
            </Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ 
                  background: 'rgba(148, 163, 184, 0.05)',
                  '& .MuiTableCell-root': {
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
                  }
                }}>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Date & Time</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Type</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Amount</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Description</TableCell>
                  <TableCell sx={{ color: '#1e293b', fontWeight: 600, py: 2 }}>Balance After</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userTransactions.map((transaction: any) => (
                  <TableRow 
                    key={transaction.id} 
                    sx={{ 
                      '&:hover': { 
                        background: 'rgba(148, 163, 184, 0.05)' 
                      },
                      '& .MuiTableCell-root': {
                        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                        py: 2
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#1e293b', fontWeight: 500 }}>
                      {new Date(transaction.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          transaction.type === 'credit' ? 'Credit' :
                          transaction.type === 'debit' ? 'Payment' :
                          transaction.type === 'admin_adjustment' ? 'Admin Adj.' : 
                          transaction.type
                        }
                        size="small"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          ...(transaction.type === 'credit' && {
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#22c55e',
                            border: '1px solid rgba(34, 197, 94, 0.2)'
                          }),
                          ...(transaction.type === 'debit' && {
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.2)'
                          }),
                          ...(transaction.type === 'admin_adjustment' && {
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                          })
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ 
                      color: transaction.type === 'debit' ? '#ef4444' : '#22c55e',
                      fontWeight: 600
                    }}>
                      {transaction.type === 'debit' ? '-' : '+'}AED {Number(transaction.amount).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ color: '#1e293b', maxWidth: 200 }}>
                      <Typography variant="body2" sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 500
                      }}>
                        {transaction.description || 'No description'}
                      </Typography>
                      {transaction.reference && (
                        <Typography variant="caption" color="#64748b">
                          Ref: {transaction.reference}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ color: '#1e293b', fontWeight: 600 }}>
                      AED {Number(transaction.balanceAfter).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransactionsDialog(false)} sx={{ color: '#000' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      </Box>
    </Box>
  );
}
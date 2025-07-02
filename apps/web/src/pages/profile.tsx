import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  Paper,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';
import {
  Person,
  Email,
  Edit,
  History,
  Receipt,
  Bolt,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  Schedule,
  BatteryChargingFull,
  MapOutlined,
  AccountBalanceWallet,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(3); // Profile is active

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
      return;
    }

    fetchProfileData();
  }, [user, authLoading, router]);

  const fetchProfileData = async () => {
    try {
      const [profileRes, sessionsRes, paymentsRes] = await Promise.all([
        api.get('/user/profile'),
        api.get('/session'),
        api.get('/payment')
      ]);
      
      setProfile(profileRes.data);
      setName(profileRes.data.name);
      setEmail(profileRes.data.email);
      setSessions(sessionsRes.data);
      setPayments(paymentsRes.data);
    } catch (err) {
      setError('Failed to load profile data');
    }
  };

  const handleUpdate = async () => {
    setError(''); 
    setSuccess('');
    setLoading(true);
    
    try {
      await api.patch('/user/profile', { name });
      setSuccess('Profile updated successfully!');
      // Update the local profile
      setProfile({ ...profile, name });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle sx={{ color: '#30D158', fontSize: 20 }} />;
      case 'active':
      case 'pending':
        return <Pending sx={{ color: '#FFD60A', fontSize: 20 }} />;
      case 'failed':
      case 'error':
        return <ErrorIcon sx={{ color: '#FF453A', fontSize: 20 }} />;
      default:
        return <Pending sx={{ color: '#8E8E93', fontSize: 20 }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'success';
      case 'active':
      case 'pending':
        return 'warning';
      case 'failed':
      case 'error':
        return 'error';
      default:
        return 'default';
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

  if (authLoading) {
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

  if (!user) return null;

  const totalSessions = sessions.length;
  const totalSpent = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalEnergy = sessions.reduce((sum, s) => sum + (Number(s.kwhConsumed) || 0), 0);

  return (
    <Box sx={{ 
      minHeight: ['100vh', '100dvh'], // Use dynamic viewport height for mobile
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      maxHeight: ['100vh', '100dvh'],
      overflow: 'hidden', // Prevent body scroll
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

      {/* Scrollable Content Container */}
      <Box sx={{ 
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        height: '100%',
        position: 'relative',
        '-webkit-overflow-scrolling': 'touch', // Smooth scrolling on iOS
        WebkitOverflowScrolling: 'touch', // Alternative syntax
        pb: 'env(safe-area-inset-bottom)', // Safe area for iOS
        paddingBottom: { xs: '100px', sm: '90px' }, // Space for bottom nav + safe area
      }}>
        <Box sx={{ 
          p: { xs: 2, sm: 3 }, 
          pt: { xs: 'calc(env(safe-area-inset-top) + 24px)', sm: 6 } // Safe area for notched phones
        }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
              Profile
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Manage your account and view activity
            </Typography>
          </Box>

          <Box 
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' },
              gap: 3
            }}
          >
            {/* Profile Info Card */}
            <Card className="glassmorphism">
              <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                <Avatar 
                  sx={{ 
                    width: { xs: 100, sm: 120 }, 
                    height: { xs: 100, sm: 120 }, 
                    mx: 'auto', 
                    mb: 3,
                    bgcolor: 'primary.main',
                    fontSize: { xs: '2.5rem', sm: '3rem' },
                    fontWeight: 600,
                  }}
                >
                  {name && name.charAt(0).toUpperCase()}
                </Avatar>
                
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {name || 'User'}
                </Typography>
                
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  {email}
                </Typography>

                {/* Statistics */}
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: { xs: 1.5, sm: 2 },
                  mb: 3
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#00D4FF', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      {totalSessions}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      Sessions
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#30D158', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      {totalEnergy.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      kWh Used
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF6B35', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      AED {totalSpent.toFixed(0)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      Total Spent
                    </Typography>
                  </Box>
                </Box>

                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={handleLogout}
                  sx={{ 
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    py: { xs: 1, sm: 1.25 },
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                  }}
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Main Content */}
            <Card className="glassmorphism">
              <Tabs 
                value={tabValue} 
                onChange={(e, newValue) => setTabValue(newValue)}
                sx={{
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  px: { xs: 2, sm: 3 },
                  pt: 2,
                  '& .MuiTab-root': {
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    minWidth: { xs: 'auto', sm: 160 },
                    textTransform: 'none',
                    fontWeight: 600,
                  }
                }}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
              >
                <Tab 
                  icon={<Edit sx={{ fontSize: { xs: 18, sm: 20 } }} />} 
                  label="Edit Profile"
                />
                <Tab 
                  icon={<History sx={{ fontSize: { xs: 18, sm: 20 } }} />} 
                  label="Sessions"
                />
                <Tab 
                  icon={<Receipt sx={{ fontSize: { xs: 18, sm: 20 } }} />} 
                  label="Payments"
                />
              </Tabs>

              {/* Edit Profile Tab */}
              <TabPanel value={tabValue} index={0}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <Stack spacing={3}>
                    {error && <Alert severity="error" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>{success}</Alert>}
                    
                    <TextField
                      fullWidth
                      label="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        }
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Email"
                      value={email}
                      disabled
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        },
                        '& .MuiInputLabel-root': {
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        }
                      }}
                    />
                    
                    <Button
                      variant="contained"
                      onClick={handleUpdate}
                      disabled={loading}
                      size="large"
                      sx={{
                        borderRadius: 3,
                        py: { xs: 1.25, sm: 1.5 },
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                      }}
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                  </Stack>
                </CardContent>
              </TabPanel>

              {/* Sessions Tab */}
              <TabPanel value={tabValue} index={1}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <Stack spacing={2}>
                    {sessions.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <BatteryChargingFull sx={{ fontSize: { xs: '3rem', sm: '4rem' }, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                          No charging sessions yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          Start your first charging session to see it here
                        </Typography>
                      </Box>
                    ) : (
                      sessions.map((session) => (
                        <Card key={session.id} className="glassmorphism">
                          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
                              <Box sx={{ flex: 1, width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                  {getStatusIcon(session.status)}
                                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    Session #{session.id?.slice(-6) || 'Unknown'}
                                  </Typography>
                                  <Chip 
                                    label={session.status} 
                                    size="small"
                                    color={getStatusColor(session.status) as any}
                                    sx={{ 
                                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                      height: { xs: 20, sm: 24 }
                                    }}
                                  />
                                </Box>
                                
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 3 }} sx={{ mt: 2 }}>
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                      Energy
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                      {session.kwhConsumed?.toFixed(1) || '0'} kWh
                                    </Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                      Duration
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                      {Math.floor((new Date(session.endTime || Date.now()).getTime() - new Date(session.startTime).getTime()) / 60000)} min
                                    </Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                                      Date
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                                      {new Date(session.startTime).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                </Stack>
                              </Box>
                              
                              <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, alignSelf: { xs: 'flex-start', sm: 'flex-start' } }}>
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 700, 
                                  color: 'primary.main',
                                  fontSize: { xs: '1rem', sm: '1.25rem' }
                                }}>
                                  AED {session.cost?.toFixed(2) || '0.00'}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Stack>
                </CardContent>
              </TabPanel>

              {/* Payments Tab */}
              <TabPanel value={tabValue} index={2}>
                <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                  <Stack spacing={2}>
                    {payments.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Receipt sx={{ fontSize: { xs: '3rem', sm: '4rem' }, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                          No payments yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          Your payment history will appear here
                        </Typography>
                      </Box>
                    ) : (
                      payments.map((payment) => (
                        <Card key={payment.id} className="glassmorphism">
                          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 } }}>
                              <Box sx={{ flex: 1, width: '100%' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                  {getStatusIcon(payment.status)}
                                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                    Payment #{payment.id?.slice(-6) || 'Unknown'}
                                  </Typography>
                                  <Chip 
                                    label={payment.status} 
                                    size="small"
                                    color={getStatusColor(payment.status) as any}
                                    sx={{ 
                                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                      height: { xs: 20, sm: 24 }
                                    }}
                                  />
                                </Box>
                                
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                  {new Date(payment.createdAt).toLocaleDateString()} at {new Date(payment.createdAt).toLocaleTimeString()}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, alignSelf: { xs: 'flex-start', sm: 'flex-start' } }}>
                                <Typography variant="h6" sx={{ 
                                  fontWeight: 700, 
                                  color: 'primary.main',
                                  fontSize: { xs: '1rem', sm: '1.25rem' }
                                }}>
                                  AED {payment.amount?.toFixed(2) || '0.00'}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Stack>
                </CardContent>
              </TabPanel>
            </Card>
          </Box>
        </Box>
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
          height: { xs: 70, sm: 80 },
          bgcolor: 'rgba(28, 28, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(84, 84, 88, 0.3)',
          pb: 'env(safe-area-inset-bottom)', // Safe area for iOS
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
        }}
        className="safe-area-bottom"
      >
        <BottomNavigationAction
          label="Dashboard"
          icon={<Bolt sx={{ fontSize: { xs: 20, sm: 24 } }} />}
          onClick={navigateToDashboard}
        />
        <BottomNavigationAction
          label="Map"
          icon={<MapOutlined sx={{ fontSize: { xs: 20, sm: 24 } }} />}
          onClick={() => router.push('/map')}
        />
        <BottomNavigationAction
          label="Wallet"
          icon={<AccountBalanceWallet sx={{ fontSize: { xs: 20, sm: 24 } }} />}
          onClick={() => router.push('/wallet')}
        />
        <BottomNavigationAction
          label="Profile"
          icon={<Person sx={{ fontSize: { xs: 20, sm: 24 } }} />}
          onClick={() => router.push('/profile')}
        />
      </BottomNavigation>
    </Box>
  );
} 
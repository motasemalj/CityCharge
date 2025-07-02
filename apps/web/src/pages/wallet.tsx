import { useAuth } from '../context/AuthContext';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Alert, 
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  Divider,
  Paper,
  LinearProgress,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useNotification } from '../context/NotificationContext';
import { useRouter } from 'next/router';
import {
  AccountBalanceWallet,
  AddCard,
  History,
  TrendingUp,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  Person,
  MapOutlined,
  Bolt,
  Add,
} from '@mui/icons-material';
import dayjs from 'dayjs';

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const [wallet, setWallet] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(2); // Wallet is active
  const { notify } = useNotification();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
      return;
    }

    fetchWalletData();
    
    if (router.query.success) {
      notify('Wallet top-up successful!', 'success');
      // Force multiple refreshes to ensure data updates
      fetchWalletData();
      setTimeout(() => fetchWalletData(), 1000);
      setTimeout(() => fetchWalletData(), 2000);
      router.replace('/wallet', undefined, { shallow: true });
    }
  }, [user, authLoading, router, router.query.success]);

  const fetchWalletData = async () => {
    try {
      const [walletRes, transactionsRes] = await Promise.all([
        api.get(`/wallet`),
        api.get(`/wallet/transactions`)
      ]);
      console.log('Wallet response:', walletRes.data);
      console.log('Wallet balance from API:', walletRes.data.balance);
      setWallet(Number(walletRes.data.balance));
      setHistory(
        transactionsRes.data
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      );
    } catch (err) {
      console.error('Failed to fetch wallet data:', err);
    }
  };

  const handleTopUp = async () => {
    setError('');
    setLoading(true);
    try {
      // Add credit directly to wallet (simulating successful payment)
      await api.post('/wallet/add-credit', { 
        amount: parseFloat(amount),
        description: 'Wallet top-up via app',
        reference: `topup-${Date.now()}`
      });
      
      // Refresh wallet data to show updated balance
      await fetchWalletData();
      
      // Clear amount and show success
      setAmount('');
      notify('Credit added successfully!', 'success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add credit');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (type: string) => {
    if (!type) return <CheckCircle sx={{ color: '#30D158', fontSize: 20 }} />;
    
    switch (type.toLowerCase()) {
      case 'credit':
        return <CheckCircle sx={{ color: '#30D158', fontSize: 20 }} />;
      case 'debit':
        return <CheckCircle sx={{ color: '#FF6B35', fontSize: 20 }} />;
      case 'admin_adjustment':
        return <CheckCircle sx={{ color: '#007AFF', fontSize: 20 }} />;
      default:
        return <CheckCircle sx={{ color: '#30D158', fontSize: 20 }} />;
    }
  };

  const getStatusColor = (type: string) => {
    if (!type) return 'success';
    
    switch (type.toLowerCase()) {
      case 'credit':
        return 'success';
      case 'debit':
        return 'warning';
      case 'admin_adjustment':
        return 'info';
      default:
        return 'success';
    }
  };

  const getTransactionLabel = (type: string) => {
    if (!type) return 'Transaction';
    
    switch (type.toLowerCase()) {
      case 'credit':
        return 'Credit Added';
      case 'debit':
        return 'Payment';
      case 'admin_adjustment':
        return 'Admin Adjustment';
      default:
        return 'Transaction';
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
              Wallet
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
              Manage your charging credits and payments
            </Typography>
          </Box>

          <Box 
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
              mb: 3
            }}
          >
            {/* Balance Card */}
            <Card className="glassmorphism">
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ 
                    bgcolor: 'primary.main', 
                    mr: 2,
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 }
                  }}>
                    <AccountBalanceWallet sx={{ fontSize: { xs: 24, sm: 28 } }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Current Balance
                    </Typography>
                    <Typography variant="h4" sx={{ 
                      fontWeight: 700, 
                      color: 'primary.main',
                      fontSize: { xs: '1.5rem', sm: '2.125rem' }
                    }}>
                      AED {wallet?.toFixed(2) ?? '0.00'}
                    </Typography>
                    <Button 
                      size="small" 
                      onClick={fetchWalletData}
                      sx={{ mt: 1, fontSize: '0.75rem' }}
                    >
                      🔄 Refresh
                    </Button>
                  </Box>
                </Box>
                
                <Box 
                  className="glassmorphism"
                  sx={{ 
                    p: 2, 
                    borderRadius: 2,
                  }}
                >
                  <Box display="flex" alignItems="center" mb={2}>
                    <TrendingUp sx={{ mr: 1, color: '#30D158', fontSize: { xs: 20, sm: 24 } }} />
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Ready for charging sessions
                    </Typography>
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    Average session cost: AED 25-50
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Top-up Card */}
            <Card className="glassmorphism">
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ 
                    bgcolor: 'secondary.main', 
                    mr: 2,
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 }
                  }}>
                    <Add sx={{ fontSize: { xs: 24, sm: 28 } }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      Add Credit
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Top up your wallet
                    </Typography>
                  </Box>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    {error}
                  </Alert>
                )}

                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Amount (AED)"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    variant="outlined"
                    inputProps={{ min: 10, max: 1000 }}
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

                  {/* Quick Amount Buttons */}
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Quick amounts:
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      {[50, 100, 200, 500].map((quickAmount) => (
                        <Chip
                          key={quickAmount}
                          label={`AED ${quickAmount}`}
                          onClick={() => setAmount(quickAmount.toString())}
                          color={amount === quickAmount.toString() ? 'primary' : 'default'}
                          variant={amount === quickAmount.toString() ? 'filled' : 'outlined'}
                          clickable
                          sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                            height: { xs: 28, sm: 32 }
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                  
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleTopUp}
                    disabled={loading || !amount || parseFloat(amount) < 10}
                    sx={{
                      borderRadius: 3,
                      py: { xs: 1.25, sm: 1.5 },
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                    }}
                  >
                    {loading ? 'Processing...' : 'Add to Wallet'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>

          {/* Transaction History */}
          <Card className="glassmorphism">
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ 
                  bgcolor: 'rgba(255, 107, 53, 0.2)', 
                  mr: 2,
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 },
                  color: '#FF6B35'
                }}>
                  <History sx={{ fontSize: { xs: 24, sm: 28 } }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    Transaction History
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Your recent wallet activity
                  </Typography>
                </Box>
              </Box>

              <Stack spacing={2}>
                {history.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AccountBalanceWallet sx={{ fontSize: { xs: '3rem', sm: '4rem' }, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      No transactions yet
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Your wallet transactions will appear here
                    </Typography>
                  </Box>
                ) : (
                  (history as any[]).map((transaction, idx) => (
                    <Card key={transaction.id} className="glassmorphism">
                      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                          <Box display="flex" alignItems="center">
                            {getStatusIcon(transaction.type)}
                            <Box ml={2}>
                              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                                {getTransactionLabel(transaction.type)}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {dayjs(transaction.createdAt).format('MMM DD, YYYY at hh:mm A')}
                              </Typography>
                              {transaction.description && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' }, display: 'block' }}>
                                  {transaction.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 700, 
                              color: transaction.type === 'debit' ? 'error.main' : 'primary.main',
                              fontSize: { xs: '1rem', sm: '1.25rem' }
                            }}>
                              {transaction.type === 'debit' ? '-' : '+'}AED {Number(transaction.amount).toFixed(2)}
                            </Typography>
                            <Chip
                              label={getTransactionLabel(transaction.type)}
                              color={getStatusColor(transaction.type) as any}
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                height: { xs: 20, sm: 24 }
                              }}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
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
          onClick={() => navigateToDashboard()}
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
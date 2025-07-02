import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Alert, 
  Card,
  CardContent,
  Avatar,
  Link,
  Stack,
  IconButton,
  InputAdornment,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import {
  Bolt,
  PersonAdd,
  Visibility,
  VisibilityOff,
  Email,
  Person,
  ArrowBack,
  MapOutlined,
  AccountBalanceWallet,
  QrCodeScanner,
  History,
} from '@mui/icons-material';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // No active tab for signup

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(email, name, password);
      
      // Get the user data from the AuthContext after signup
      // We need to check the user role and redirect accordingly
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userRole = payload.role;
          
          if (userRole === 'admin') {
            router.push('/admin');
          } else {
            router.push('/map');
          }
        } catch (error) {
          // Fallback to map if we can't decode the token
          router.push('/map');
        }
      } else {
        // Fallback to map if no token
        router.push('/map');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Header */}
        <Box sx={{ 
          p: { xs: 2, sm: 3 }, 
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          pt: { xs: 'calc(env(safe-area-inset-top) + 16px)', sm: 3 }, // Safe area for notched phones
        }}>
          <IconButton
            onClick={() => router.push('/login')}
            sx={{
              color: 'text.primary',
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
              Create Account
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
              Join the future of electric charging
            </Typography>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
          <Stack spacing={3}>
            {/* Signup Form Card */}
            <Card className="glassmorphism">
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                {/* Header */}
                <Box textAlign="center" mb={3}>
                  <Avatar sx={{ 
                    width: { xs: 64, sm: 80 }, 
                    height: { xs: 64, sm: 80 }, 
                    mx: 'auto', 
                    mb: 2,
                    bgcolor: 'primary.main',
                    background: 'linear-gradient(135deg, #00D4FF 0%, #FF6B35 100%)',
                  }}>
                    <Bolt sx={{ fontSize: { xs: 32, sm: 40 } }} />
                  </Avatar>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      fontSize: { xs: '1.1rem', sm: '1.25rem' }
                    }}
                  >
                    Start Your Electric Journey
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    Create your account to access charging stations worldwide
                  </Typography>
                </Box>

                {error && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      bgcolor: 'rgba(244, 67, 54, 0.1)',
                      color: 'error.main',
                      border: '1px solid rgba(244, 67, 54, 0.2)',
                      borderRadius: 2,
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      '& .MuiAlert-icon': {
                        color: 'error.main'
                      }
                    }}
                  >
                    {error}
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    <TextField
                      label="Full Name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      fullWidth
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255,255,255,0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 2,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          '& fieldset': {
                            border: 'none',
                          },
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.2)',
                          },
                          '&.Mui-focused': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(0, 212, 255, 0.5)',
                            boxShadow: '0 0 0 2px rgba(0, 212, 255, 0.1)',
                          },
                          '& input': {
                            color: 'text.primary',
                            '&::placeholder': {
                              color: 'text.disabled',
                              opacity: 1,
                            }
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'text.secondary',
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          '&.Mui-focused': {
                            color: 'primary.main'
                          }
                        }
                      }}
                    />

                    <TextField
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      fullWidth
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255,255,255,0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 2,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          '& fieldset': {
                            border: 'none',
                          },
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.2)',
                          },
                          '&.Mui-focused': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(0, 212, 255, 0.5)',
                            boxShadow: '0 0 0 2px rgba(0, 212, 255, 0.1)',
                          },
                          '& input': {
                            color: 'text.primary',
                            '&::placeholder': {
                              color: 'text.disabled',
                              opacity: 1,
                            }
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'text.secondary',
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          '&.Mui-focused': {
                            color: 'primary.main'
                          }
                        }
                      }}
                    />
                    
                    <TextField
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      fullWidth
                      required
                      variant="outlined"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              sx={{ color: 'text.secondary' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'rgba(255,255,255,0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 2,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          '& fieldset': {
                            border: 'none',
                          },
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.2)',
                          },
                          '&.Mui-focused': {
                            bgcolor: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(0, 212, 255, 0.5)',
                            boxShadow: '0 0 0 2px rgba(0, 212, 255, 0.1)',
                          },
                          '& input': {
                            color: 'text.primary',
                            '&::placeholder': {
                              color: 'text.disabled',
                              opacity: 1,
                            }
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: 'text.secondary',
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                          '&.Mui-focused': {
                            color: 'primary.main'
                          }
                        }
                      }}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      disabled={loading}
                      startIcon={<PersonAdd />}
                      sx={{
                        background: 'linear-gradient(135deg, #00D4FF 0%, #FF6B35 100%)',
                        color: 'white',
                        py: { xs: 1.5, sm: 2 },
                        fontSize: { xs: '0.95rem', sm: '1.1rem' },
                        fontWeight: 600,
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #00B8E6 0%, #E55A2B 100%)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 25px rgba(0, 212, 255, 0.4)'
                        },
                        '&:disabled': {
                          background: 'rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.5)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  </Stack>
                </form>

                {/* Footer */}
                <Box textAlign="center" mt={3}>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: 'text.secondary',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    Already have an account?{' '}
                    <Link 
                      href="/login"
                      sx={{ 
                        color: 'primary.main',
                        fontWeight: 600,
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline'
                        }
                      }}
                    >
                      Sign in here
                    </Link>
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      color: 'text.disabled', 
                      mt: 2, 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      lineHeight: 1.4
                    }}
                  >
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Features Preview Card */}
            <Card className="glassmorphism">
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 600, 
                    mb: 2,
                    fontSize: { xs: '1rem', sm: '1.1rem' }
                  }}
                >
                  What You'll Get
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(0, 212, 255, 0.2)', 
                      width: { xs: 36, sm: 40 }, 
                      height: { xs: 36, sm: 40 } 
                    }}>
                      <MapOutlined sx={{ color: 'primary.main', fontSize: { xs: 18, sm: 20 } }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                        Find Nearby Chargers
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                        Locate available charging stations in real-time
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(255, 107, 53, 0.2)', 
                      width: { xs: 36, sm: 40 }, 
                      height: { xs: 36, sm: 40 } 
                    }}>
                      <QrCodeScanner sx={{ color: '#FF6B35', fontSize: { xs: 18, sm: 20 } }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                        Quick QR Scanning
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                        Start charging instantly with QR codes
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(76, 175, 80, 0.2)', 
                      width: { xs: 36, sm: 40 }, 
                      height: { xs: 36, sm: 40 } 
                    }}>
                      <AccountBalanceWallet sx={{ color: '#4CAF50', fontSize: { xs: 18, sm: 20 } }} />
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.9rem' } }}>
                        Digital Wallet
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                        Seamless payments and transaction history
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>

      {/* Bottom Navigation */}
      <BottomNavigation
        value={activeTab}
        onChange={(event, newValue) => {
          setActiveTab(newValue);
          switch(newValue) {
            case 0:
              router.push('/map');
              break;
            case 1:
              router.push('/wallet');
              break;
            case 2:
              router.push('/qr');
              break;
            case 3:
              router.push('/history');
              break;
            case 4:
              router.push('/profile');
              break;
          }
        }}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: { xs: 70, sm: 80 },
          bgcolor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          pb: 'env(safe-area-inset-bottom)',
          '& .MuiBottomNavigationAction-root': {
            color: 'rgba(255,255,255,0.6)',
            minWidth: 0,
            '&.Mui-selected': {
              color: 'primary.main'
            }
          }
        }}
      >
        <BottomNavigationAction label="Map" icon={<MapOutlined sx={{ fontSize: { xs: 20, sm: 24 } }} />} />
        <BottomNavigationAction label="Wallet" icon={<AccountBalanceWallet sx={{ fontSize: { xs: 20, sm: 24 } }} />} />
        <BottomNavigationAction label="QR" icon={<QrCodeScanner sx={{ fontSize: { xs: 20, sm: 24 } }} />} />
        <BottomNavigationAction label="History" icon={<History sx={{ fontSize: { xs: 20, sm: 24 } }} />} />
        <BottomNavigationAction label="Profile" icon={<Person sx={{ fontSize: { xs: 20, sm: 24 } }} />} />
      </BottomNavigation>
    </Box>
  );
} 
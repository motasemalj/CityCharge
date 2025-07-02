import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Alert, 
  Card,
  CardContent,
  Avatar,
  TextField,
  Stack,
  IconButton,
  BottomNavigation,
  BottomNavigationAction,
} from '@mui/material';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import {
  QrCodeScanner,
  Search,
  ArrowBack,
  CameraAlt,
  MapOutlined,
  AccountBalanceWallet,
  Person,
  History,
  Bolt,
} from '@mui/icons-material';

export default function QRPage() {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [chargerInput, setChargerInput] = useState('');
  const [activeTab, setActiveTab] = useState(2); // QR tab is active
  const router = useRouter();
  const { user } = useAuth();

  const handleScan = (data: string) => {
    if (data) {
      setResult(data);
      // Assume QR contains charger ID, redirect to map with query param
      router.push(`/map?charger=${encodeURIComponent(data)}`);
    }
  };

  const handleManualInput = () => {
    if (chargerInput.trim()) {
      handleScan(chargerInput.trim());
    }
  };

  const handleError = (err: string) => {
    setError('QR Scanner Error: ' + err);
  };

  // Helper function for role-based dashboard redirection
  const navigateToDashboard = () => {
    if (user?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
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
            onClick={() => router.push('/map')}
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
              QR Scanner
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
              Scan or enter a charger ID to get started
            </Typography>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
          <Stack spacing={3}>
            {/* QR Scanner Card */}
            <Card className="glassmorphism">
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Box textAlign="center" mb={3}>
                  <Avatar sx={{ 
                    width: { xs: 56, sm: 64 }, 
                    height: { xs: 56, sm: 64 }, 
                    mx: 'auto', 
                    mb: 2,
                    bgcolor: 'primary.main',
                  }}>
                    <QrCodeScanner sx={{ fontSize: { xs: 28, sm: 32 } }} />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    Scan QR Code
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Point your camera at the QR code on the charging station
                  </Typography>
                </Box>

                {/* QR Scanner Area */}
                <Box 
                  sx={{ 
                    position: 'relative',
                    width: '100%',
                    height: { xs: 250, sm: 300 },
                    bgcolor: 'rgba(255,255,255,0.05)',
                    border: '2px dashed rgba(255,255,255,0.2)',
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                    overflow: 'hidden'
                  }}
                >
                  <CameraAlt sx={{ fontSize: { xs: 40, sm: 48 }, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    Camera Preview
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Tap to enable camera access
                  </Typography>
                  
                  {/* Scanning Frame */}
                  <Box
                    sx={{
                      position: 'absolute',
                      width: { xs: 160, sm: 200 },
                      height: { xs: 160, sm: 200 },
                      border: '3px solid rgba(0, 212, 255, 0.6)',
                      borderRadius: 2,
                      '&::before, &::after': {
                        content: '""',
                        position: 'absolute',
                        width: 20,
                        height: 20,
                        border: '3px solid #00D4FF'
                      },
                      '&::before': {
                        top: -3,
                        left: -3,
                        borderRight: 'none',
                        borderBottom: 'none'
                      },
                      '&::after': {
                        bottom: -3,
                        right: -3,
                        borderLeft: 'none',
                        borderTop: 'none'
                      }
                    }}
                  />
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<CameraAlt />}
                  sx={{
                    py: { xs: 1.25, sm: 1.5 },
                    borderRadius: 3,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                  }}
                >
                  Enable Camera
                </Button>
              </CardContent>
            </Card>

            {/* Manual Input Card */}
            <Card className="glassmorphism">
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  Enter Manually
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                  Can't scan? Enter the charger ID manually
                </Typography>
                
                <Stack spacing={2}>
                  <Box>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'text.primary', 
                        mb: 1, 
                        fontWeight: 600,
                        fontSize: { xs: '0.85rem', sm: '0.875rem' },
                      }}
                    >
                      Charger ID
                    </Typography>
                    <TextField
                      value={chargerInput}
                      onChange={(e) => setChargerInput(e.target.value)}
                      placeholder="e.g., CHR-001 or Station ID"
                      fullWidth
                      variant="outlined"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleManualInput();
                        }
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 3,
                          fontSize: { xs: '0.9rem', sm: '1rem' },
                        }
                      }}
                    />
                  </Box>
                  
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Search />}
                    onClick={handleManualInput}
                    disabled={!chargerInput.trim()}
                    sx={{
                      py: { xs: 1.25, sm: 1.5 },
                      borderRadius: 3,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                    }}
                  >
                    Find Charger
                  </Button>
                </Stack>
              </CardContent>
            </Card>

            {/* Alert Messages */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  bgcolor: 'rgba(244, 67, 54, 0.1)',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                  borderRadius: 3,
                  fontSize: { xs: '0.85rem', sm: '0.875rem' },
                  '& .MuiAlert-icon': {
                    color: '#ff6b6b'
                  }
                }}
              >
                {error}
              </Alert>
            )}

            {result && (
              <Alert 
                severity="success" 
                sx={{ 
                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                  borderRadius: 3,
                  fontSize: { xs: '0.85rem', sm: '0.875rem' },
                  '& .MuiAlert-icon': {
                    color: '#4caf50'
                  }
                }}
              >
                Successfully scanned: {result}
              </Alert>
            )}

            {/* Instructions Card */}
            <Card className="glassmorphism">
              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  How to Use
                </Typography>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: { xs: 28, sm: 32 }, 
                      height: { xs: 28, sm: 32 }, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      1
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Find the QR code on the charging station display
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: { xs: 28, sm: 32 }, 
                      height: { xs: 28, sm: 32 }, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      2
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Scan the code or enter the ID manually below
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: { xs: 28, sm: 32 }, 
                      height: { xs: 28, sm: 32 }, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 600,
                      flexShrink: 0,
                    }}>
                      3
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Connect and start charging your vehicle
                    </Typography>
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
          switch (newValue) {
            case 0:
              router.push('/map');
              break;
            case 1:
              navigateToDashboard();
              break;
            case 2:
              // Current page
              break;
            case 3:
              router.push('/wallet');
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
          bgcolor: 'rgba(28, 28, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(84, 84, 88, 0.3)',
          zIndex: 1000,
          height: { xs: 70, sm: 80 },
          pb: 'env(safe-area-inset-bottom)', // Safe area for iOS
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            '&.Mui-selected': {
              color: 'primary.main',
            },
          },
        }}
      >
        <BottomNavigationAction 
          label="Map" 
          icon={<MapOutlined sx={{ fontSize: { xs: 20, sm: 24 } }} />} 
        />
        <BottomNavigationAction 
          label="Dashboard" 
          icon={<Bolt sx={{ fontSize: { xs: 20, sm: 24 } }} />} 
        />
        <BottomNavigationAction 
          label="QR Scan" 
          icon={<QrCodeScanner sx={{ fontSize: { xs: 20, sm: 24 } }} />} 
        />
        <BottomNavigationAction 
          label="Wallet" 
          icon={<AccountBalanceWallet sx={{ fontSize: { xs: 20, sm: 24 } }} />} 
        />
        <BottomNavigationAction 
          label="Profile" 
          icon={<Person sx={{ fontSize: { xs: 20, sm: 24 } }} />} 
        />
      </BottomNavigation>
    </Box>
  );
} 
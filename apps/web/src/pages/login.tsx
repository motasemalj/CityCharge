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
  Link,
  Stack
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';

// Custom CityCharge Logo Component
const CityChargeLogo = ({ size = 280 }: { size?: number }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
    <svg width={size} height={size * 0.4} viewBox="0 0 320 120" xmlns="http://www.w3.org/2000/svg">
      {/* Diamond Pattern - centered horizontally */}
      <g transform="translate(50, 15)">
        {/* Top diamonds - larger and more detailed */}
        <polygon points="30,0 45,15 30,30 15,15" fill="#00D4FF" />
        <polygon points="45,0 60,15 45,30 30,15" fill="#3A9BDC" />
        
        {/* Middle row */}
        <polygon points="15,15 30,30 15,45 0,30" fill="#00D4FF" />
        <polygon points="30,15 45,30 30,45 15,30" fill="#1976D2" />
        <polygon points="45,15 60,30 45,45 30,30" fill="#00D4FF" />
        <polygon points="60,15 75,30 60,45 45,30" fill="#3A9BDC" />
        
        {/* Bottom diamonds */}
        <polygon points="30,30 45,45 30,60 15,45" fill="#3A9BDC" />
        <polygon points="45,30 60,45 45,60 30,45" fill="#00D4FF" />
        
        {/* Green leaves/eco elements - larger */}
        <ellipse cx="22" cy="37" rx="8" ry="4" fill="#4CAF50" transform="rotate(-45 22 37)" />
        <ellipse cx="53" cy="37" rx="8" ry="4" fill="#66BB6A" transform="rotate(45 53 37)" />
        
        {/* Lightning bolt in center - larger */}
        <path d="M37 20 L42 35 L39 35 L44 50 L36 35 L39 35 Z" fill="#FFD700" stroke="#FFA000" strokeWidth="1.5"/>
      </g>
      
      {/* Text positioned horizontally to the right of graphic */}
      <g transform="translate(140, 60)">
        <text x="0" y="-10" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="#FFFFFF" textAnchor="start">
          CITY
        </text>
        <text x="0" y="20" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="bold" fill="#00D4FF" textAnchor="start">
          CHARGE
        </text>
      </g>
    </svg>
  </Box>
);

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      
      // Get the user data from the AuthContext after login
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
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: ['100vh', '100dvh'], // Use dynamic viewport height for mobile
      bgcolor: 'background.default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: { xs: 2, sm: 3 }, // More compact padding for mobile
      position: 'relative',
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

      <Stack spacing={3} alignItems="center" sx={{ width: '100%', maxWidth: { xs: 360, sm: 400 } }}>
        {/* Logo positioned above the card */}
        <CityChargeLogo size={280} />
        
        <Card 
          className="glassmorphism"
          sx={{ 
            width: '100%',
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}> {/* Reduced padding for mobile */}
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom 
              align="center"
              sx={{ 
                fontWeight: 'bold',
                color: 'white',
                mb: { xs: 2, sm: 3 }, // Reduced margin for mobile
                fontSize: { xs: '1.75rem', sm: '2.125rem' } // Responsive font size
              }}
            >
              Sign In
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{
                  mb: { xs: 1.5, sm: 2 }, // Reduced margin for mobile
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00d4ff',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: { xs: 2, sm: 3 }, // Reduced margin for mobile
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00d4ff',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  },
                  '& .MuiInputBase-input': {
                    color: 'white',
                  },
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: { xs: 1, sm: 2 }, // Reduced margin for mobile
                  mb: { xs: 2, sm: 3 },
                  py: { xs: 1.2, sm: 1.5 }, // Responsive padding
                  background: 'linear-gradient(135deg, #00d4ff 0%, #1976d2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00b8e6 0%, #1565c0 100%)',
                  },
                  fontWeight: 'bold',
                  fontSize: { xs: '0.95rem', sm: '1rem' }, // Responsive font size
                }}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
              <Stack 
                direction="row" 
                justifyContent="center" 
                spacing={1}
                sx={{ mt: { xs: 1, sm: 2 } }}
              >
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Don&apos;t have an account?
                </Typography>
                <Link 
                  href="/signup" 
                  variant="body2"
                  sx={{ 
                    color: '#00d4ff',
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Sign Up
                </Link>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
} 
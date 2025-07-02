import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme, CssBaseline, GlobalStyles } from '@mui/material';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

// Apple-inspired dark theme for EV charging app
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00D4FF', // Electric blue - EV charging color
      light: '#33DDFF',
      dark: '#0099CC',
      contrastText: '#000000',
    },
    secondary: {
      main: '#FF6B35', // Energy orange
      light: '#FF8A65',
      dark: '#E64A19',
    },
    background: {
      default: '#000000', // Pure black like iPhone
      paper: '#1C1C1E', // Dark gray cards
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8E8E93', // iOS secondary text
    },
    success: {
      main: '#30D158', // iOS green
    },
    warning: {
      main: '#FFD60A', // iOS yellow
    },
    error: {
      main: '#FF453A', // iOS red
    },
    divider: 'rgba(84, 84, 88, 0.6)',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#8E8E93',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 16, // More rounded like iOS
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#000000',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(142, 142, 147, 0.3)',
          borderRadius: '4px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1C1C1E',
          border: '1px solid rgba(84, 84, 88, 0.3)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontSize: '1rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #33DDFF 0%, #00B8E6 100%)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#2C2C2E',
            borderRadius: 12,
            '& fieldset': {
              borderColor: 'rgba(84, 84, 88, 0.5)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 212, 255, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00D4FF',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#2C2C2E',
          border: '1px solid rgba(84, 84, 88, 0.3)',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(28, 28, 30, 0.8)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(84, 84, 88, 0.3)',
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #00D4FF 0%, #0099CC 100%)',
          boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #33DDFF 0%, #00B8E6 100%)',
          },
        },
      },
    },
  },
});

const globalStyles = (
  <GlobalStyles
    styles={{
      '.glassmorphism': {
        background: 'rgba(28, 28, 30, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(84, 84, 88, 0.3)',
        borderRadius: '20px',
      },
      '.gradient-text': {
        background: 'linear-gradient(135deg, #00D4FF 0%, #FF6B35 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      },
      '.energy-glow': {
        boxShadow: '0 0 30px rgba(0, 212, 255, 0.3)',
      },
      '.charging-animation': {
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      '@keyframes pulse': {
        '0%, 100%': {
          opacity: 1,
        },
        '50%': {
          opacity: 0.7,
        },
      },
      '.safe-area-top': {
        paddingTop: 'env(safe-area-inset-top)',
      },
      '.safe-area-bottom': {
        paddingBottom: 'env(safe-area-inset-bottom)',
      },
    }}
  />
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {globalStyles}
      <AuthProvider>
        <NotificationProvider>
          <Component {...pageProps} />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 
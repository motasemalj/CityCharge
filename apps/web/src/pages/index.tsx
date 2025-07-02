import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Wait for auth check to complete
    
    if (user) {
      // User is authenticated, redirect to map
      router.replace('/map');
    } else {
      // User is not authenticated, redirect to login
      router.replace('/login');
    }
  }, [user, loading, router]);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: 'background.default'
    }}>
      <CircularProgress />
    </Box>
  );
}
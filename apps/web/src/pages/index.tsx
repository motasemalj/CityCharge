import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, CircularProgress } from '@mui/material';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to map page immediately
    router.replace('/map');
  }, [router]);

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
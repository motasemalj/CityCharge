import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Dialog,
  DialogContent,
  Chip,
  Stack,
  IconButton,
  Slide,
  Divider,
  LinearProgress,
  BottomNavigation,
  BottomNavigationAction,
  SwipeableDrawer,
  Drawer,
  Rating,
  Fab,
  InputAdornment,
} from '@mui/material';
import {
  LocationOn,
  FilterList,
  MyLocation,
  Star,
  Close,
  Bolt,
  MapOutlined,
  AccountBalanceWallet,
  Person,
  EvStation,
  Navigation,
  QrCodeScanner,
  Search,
  Clear,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import api from '../lib/api';
import io from 'socket.io-client';

const Transition = React.forwardRef<unknown, TransitionProps & { children: React.ReactElement }>(
  function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  }
);

interface Charger {
  id: string;
  vendor: string;
  lat: number;
  lng: number;
  address: string;
  connectorTypes: string[];
  powerKW: number;
  status: 'available' | 'charging' | 'out_of_service';
  pricePerKwh: number;
  rating?: number;
  distance?: string;
}

export default function MapPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const mapRef = useRef(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [filteredChargers, setFilteredChargers] = useState<Charger[]>([]);
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fetchingChargers, setFetchingChargers] = useState(true);
  const [activeTab, setActiveTab] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filterForm, setFilterForm] = useState({
    status: 'all',
    connectorType: 'all',
  });
  const [viewState, setViewState] = useState({
    longitude: 55.2708, // Dubai longitude
    latitude: 25.2048,  // Dubai latitude
    zoom: 12,
  });

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      if (typeof window !== 'undefined') {
        router.push('/login');
      }
      return;
    }

    fetchChargers();
  }, [user, loading, router]);

  const fetchChargers = async () => {
    try {
      const response = await api.get('/charger');
      const chargersData = response.data.map((charger: any) => ({
        ...charger,
        rating: 4.2 + Math.random() * 0.8,
        distance: (Math.random() * 10 + 0.5).toFixed(1),
      }));
      setChargers(chargersData);
      setFilteredChargers(chargersData);
    } catch (error) {
      console.error('Failed to fetch chargers:', error);
    } finally {
      setFetchingChargers(false);
    }
  };

  // Filter and search functionality
  useEffect(() => {
    let filtered = chargers;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(charger => 
        charger.vendor.toLowerCase().includes(query) ||
        charger.address.toLowerCase().includes(query) ||
        charger.connectorTypes.some(type => type.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (filterForm.status !== 'all') {
      filtered = filtered.filter(charger => charger.status === filterForm.status);
    }

    // Apply connector type filter
    if (filterForm.connectorType !== 'all') {
      filtered = filtered.filter(charger => 
        charger.connectorTypes.includes(filterForm.connectorType)
      );
    }

    setFilteredChargers(filtered);
  }, [chargers, searchQuery, filterForm]);

  // WebSocket for real-time charger status updates
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:43219');
    socket.on('charger-update', (data: any) => {
      setChargers((prev) => prev.map((c) => c.id === data.id ? { ...c, status: data.status } : c));
    });
    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    // If a charger ID is present in the query param, auto-select it
    if (router.query.charger && chargers.length > 0) {
      const chargerId = router.query.charger as string;
      const found = chargers.find(c => c.id === chargerId);
      if (found) {
        setSelectedCharger(found);
        setShowDetails(true);
      }
    }
  }, [router.query.charger, chargers]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#30D158';
      case 'charging': return '#FFD60A';
      case 'out_of_service': return '#FF453A';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'charging': return 'In Use';
      case 'out_of_service': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  const handleChargerClick = (charger: Charger) => {
    setSelectedCharger(charger);
    setShowDetails(true);
  };

  // Helper function for role-based dashboard redirection
  const navigateToDashboard = () => {
    if (user?.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  // Handler for Start Charging button
  const handleStartCharging = async () => {
    if (!selectedCharger) return;
    try {
      await api.post('/session', {
        chargerId: selectedCharger.id,
        startTime: new Date().toISOString(),
        status: 'active',
      });
      setChargers((prev) => prev.map((c) => c.id === selectedCharger.id ? { ...c, status: 'charging' } : c));
      setShowDetails(false);
    } catch (err) {
      alert('Failed to start charging: ' + ((err as any).response?.data?.message || (err as any).message));
    }
  };

  const ChargerMarker = ({ charger }: { charger: Charger }) => {
    // Create consistent positions based on charger ID for realistic placement
    const getPosition = (id: string) => {
      const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const top = 20 + (hash % 60);
      const left = 15 + ((hash * 7) % 70);
      return { top: `${top}%`, left: `${left}%` };
    };

    const position = getPosition(charger.id);

    return (
      <Box
        onClick={() => handleChargerClick(charger)}
        sx={{
          position: 'absolute',
          ...position,
          transform: 'translate(-50%, -50%)',
          cursor: 'pointer',
          zIndex: 5,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translate(-50%, -50%) scale(1.15)',
            zIndex: 10,
          },
        }}
      >
        {/* Marker Pin */}
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Pin Circle */}
          <Box
            className={charger.status === 'available' ? 'pulse' : ''}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: getStatusColor(charger.status),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 6px 24px ${getStatusColor(charger.status)}40, 0 2px 8px rgba(0,0,0,0.4)`,
              border: '3px solid rgba(255,255,255,0.9)',
              color: charger.status === 'charging' ? 'black' : 'white',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: `12px solid ${getStatusColor(charger.status)}`,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
              },
            }}
          >
            <EvStation sx={{ fontSize: '1.6rem' }} />
          </Box>
          {/* Status Badge */}
          <Chip
            label={charger.status === 'available' ? '●' : charger.status === 'charging' ? '⚡' : '⚠'}
            size="small"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              minWidth: 20,
              height: 20,
              bgcolor: charger.status === 'available' ? '#30D158' : 
                      charger.status === 'charging' ? '#FFD60A' : '#FF453A',
              color: charger.status === 'charging' ? 'black' : 'white',
              fontSize: '0.7rem',
              fontWeight: 600,
              '& .MuiChip-label': {
                px: 0.5,
              },
            }}
          />
        </Box>
      </Box>
    );
  };

  const ChargerDetailModal = () => (
    <Dialog
      open={showDetails}
      onClose={() => setShowDetails(false)}
      TransitionComponent={Transition}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid rgba(84, 84, 88, 0.3)',
          backdropFilter: 'blur(10px)',
          m: 2,
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {selectedCharger && (
          <Box>
            {/* Header Image */}
            <Box
              sx={{
                height: 120,
                background: `linear-gradient(135deg, ${getStatusColor(selectedCharger.status)}20 0%, ${getStatusColor(selectedCharger.status)}10 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <EvStation sx={{ fontSize: '2.5rem', color: getStatusColor(selectedCharger.status) }} />
              <IconButton
                onClick={() => setShowDetails(false)}
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                  width: 32,
                  height: 32,
                }}
              >
                <Close fontSize="small" />
              </IconButton>
              <Chip
                label={getStatusText(selectedCharger.status)}
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: getStatusColor(selectedCharger.status),
                  color: selectedCharger.status === 'charging' ? 'black' : 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                }}
              />
            </Box>
            {/* Content */}
            <Box sx={{ p: 2, pt: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                  {selectedCharger.vendor}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Star sx={{ color: '#FFD60A', fontSize: '1rem' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {selectedCharger.rating?.toFixed(1) || '4.5'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                <LocationOn sx={{ color: 'text.secondary', fontSize: '1rem' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                  {selectedCharger.address}
                </Typography>
              </Box>

              {/* Quick Stats */}
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 1,
                mb: 2
              }}>
                <Card className="glassmorphism" sx={{ p: 1, textAlign: 'center' }}>
                  <Bolt sx={{ color: 'primary.main', mb: 0.5, fontSize: '1.2rem' }} />
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}>
                    {selectedCharger.powerKW}kW
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Power
                  </Typography>
                </Card>
                <Card className="glassmorphism" sx={{ p: 1, textAlign: 'center' }}>
                  <AccountBalanceWallet sx={{ color: 'warning.main', mb: 0.5, fontSize: '1.2rem' }} />
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}>
                    AED {selectedCharger.pricePerKwh}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    per kWh
                  </Typography>
                </Card>
                <Card className="glassmorphism" sx={{ p: 1, textAlign: 'center' }}>
                  <EvStation sx={{ color: 'success.main', mb: 0.5, fontSize: '1.2rem' }} />
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.2 }}>
                    {selectedCharger.connectorTypes.join(', ')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    Connector
                  </Typography>
                </Card>
              </Box>

              {/* Action Buttons */}
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={selectedCharger.status !== 'available'}
                  onClick={handleStartCharging}
                  sx={{ 
                    borderRadius: 3,
                    py: 1.2,
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {selectedCharger.status === 'available' ? 'Start Charging' : 'Currently Unavailable'}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedCharger.lat},${selectedCharger.lng}`;
                    window.open(mapsUrl, '_blank');
                  }}
                  sx={{ borderRadius: 3, py: 1.2 }}
                  startIcon={<Navigation />}
                >
                  Navigate
                </Button>
              </Stack>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  const FilterDrawer = () => (
    <SwipeableDrawer
      anchor="bottom"
      open={showFilters}
      onClose={() => setShowFilters(false)}
      onOpen={() => setShowFilters(true)}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          bgcolor: 'background.paper',
          border: '1px solid rgba(84, 84, 88, 0.3)',
          backdropFilter: 'blur(10px)',
        }
      }}
    >
      <Box sx={{ p: 3, minHeight: 300 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filter Stations
          </Typography>
          <IconButton onClick={() => setShowFilters(false)}>
            <Close />
          </IconButton>
        </Box>
        
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['all', 'available', 'charging'].map((status) => (
                <Chip
                  key={status}
                  label={status === 'all' ? 'All' : getStatusText(status)}
                  variant={filterForm.status === status ? 'filled' : 'outlined'}
                  onClick={() => setFilterForm(f => ({ ...f, status }))}
                  sx={{ textTransform: 'capitalize' }}
                />
              ))}
            </Box>
          </Box>
          
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Connector Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {['all', 'Type 2', 'CCS', 'CHAdeMO'].map((type) => (
                <Chip
                  key={type}
                  label={type === 'all' ? 'All Types' : type}
                  variant={filterForm.connectorType === type ? 'filled' : 'outlined'}
                  onClick={() => setFilterForm(f => ({ ...f, connectorType: type }))}
                />
              ))}
            </Box>
          </Box>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Mapbox Map Container */}
      <Box sx={{ height: '100vh', width: '100%', position: 'relative' }}>
        <Map
          ref={mapRef}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          style={{ width: '100%', height: '100vh' }}
          {...viewState}
          onMove={(evt: any) => setViewState(evt.viewState)}
        >
          {/* Charger Markers */}
          {filteredChargers.map((charger) => (
            <Marker
              key={charger.id}
              longitude={charger.lng}
              latitude={charger.lat}
            >
              <Box
                onClick={() => handleChargerClick(charger)}
                className={charger.status === 'available' ? 'pulse' : ''}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: getStatusColor(charger.status),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 6px 24px ${getStatusColor(charger.status)}40, 0 2px 8px rgba(0,0,0,0.4)`,
                  border: '3px solid rgba(255,255,255,0.9)',
                  color: charger.status === 'charging' ? 'black' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.15)',
                    zIndex: 10,
                  },
                }}
              >
                <EvStation sx={{ fontSize: '1.6rem' }} />
              </Box>
            </Marker>
          ))}

          {/* Current Location Marker */}
          {currentLocation && (
            <Marker
              longitude={currentLocation.lng}
              latitude={currentLocation.lat}
            >
              <Box
                className="pulse"
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: '#007AFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 6px 24px rgba(0, 122, 255, 0.4), 0 2px 8px rgba(0,0,0,0.4)',
                  border: '4px solid rgba(255,255,255,0.95)',
                  color: 'white',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: -6,
                    left: -6,
                    right: -6,
                    bottom: -6,
                    borderRadius: '50%',
                    border: '2px solid rgba(0, 122, 255, 0.3)',
                    animation: 'locationPulse 2s infinite',
                  },
                }}
              >
                <LocationOn sx={{ fontSize: '1.4rem' }} />
              </Box>
            </Marker>
          )}
        </Map>
        
        {fetchingChargers && (
          <Box sx={{ 
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 1000,
            background: 'rgba(0,0,0,0.8)',
            borderRadius: 3,
            p: 3,
          }}>
            <LinearProgress sx={{ width: 200, mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Loading charging stations...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Controls and Stats at Top */}
      <Box
        sx={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          zIndex: 10,
          mb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <TextField
            placeholder="Search stations..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setSearchQuery('')}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(28, 28, 30, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                height: 36,
                '& input': {
                  color: 'white',
                  fontSize: '0.875rem',
                },
                '& input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              },
            }}
          />
          <IconButton
            onClick={() => setShowFilters(true)}
            sx={{
              bgcolor: 'rgba(28, 28, 30, 0.9)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              width: 36,
              height: 36,
            }}
          >
            <FilterList fontSize="small" />
          </IconButton>
          <IconButton
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                  const newLocation = {
                    lng: position.coords.longitude,
                    lat: position.coords.latitude,
                  };
                  setCurrentLocation(newLocation);
                  setViewState({
                    longitude: position.coords.longitude,
                    latitude: position.coords.latitude,
                    zoom: 15,
                  });
                });
              }
            }}
            sx={{
              bgcolor: 'rgba(28, 28, 30, 0.9)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              width: 36,
              height: 36,
            }}
          >
            <MyLocation fontSize="small" />
          </IconButton>
        </Box>

        {/* Floating Stats */}
        <Card
          className="glassmorphism"
          sx={{
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', alignItems: 'center' }}>
              <Box sx={{ minWidth: 60, py: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main', fontSize: '1.1rem', lineHeight: 1.2, mb: 0.5 }}>
                  {filteredChargers.filter(c => c.status === 'available').length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  Available
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 1.5, height: 32 }} />
              <Box sx={{ minWidth: 60, py: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main', fontSize: '1.1rem', lineHeight: 1.2, mb: 0.5 }}>
                  {filteredChargers.filter(c => c.status === 'charging').length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  In Use
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem sx={{ mx: 1.5, height: 32 }} />
              <Box sx={{ minWidth: 60, py: 0.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '1.1rem', lineHeight: 1.2, mb: 0.5 }}>
                  {filteredChargers.length}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                  {searchQuery || filterForm.status !== 'all' || filterForm.connectorType !== 'all' ? 'Filtered' : 'Total'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Floating QR Button */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 100,
          right: 24,
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0, 212, 255, 0.3)',
        }}
        onClick={() => router.push('/qr')}
      >
        <QrCodeScanner />
      </Fab>

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
          onClick={() => navigateToDashboard()}
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

      {/* Modals */}
      <ChargerDetailModal />
      <FilterDrawer />
    </Box>
  );
} 
// User roles
export type UserRole = 'user' | 'admin';

// User
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  walletBalance: number;
}

// Charger status
export type ChargerStatus = 'available' | 'charging' | 'out_of_service';

// Charger
export interface Charger {
  id: string;
  vendor: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  connectorTypes: string[];
  powerKW: number;
  status: ChargerStatus;
  pricePerKwh: number;
}

// Charging session
export interface ChargingSession {
  id: string;
  userId: string;
  chargerId: string;
  startTime: string;
  endTime?: string;
  kwhConsumed?: number;
  cost?: number;
  status: 'active' | 'completed' | 'error';
} 
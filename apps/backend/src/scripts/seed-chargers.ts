import { DataSource } from 'typeorm';
import { Charger } from '../charger/entities/charger.entity';

// Sample charger data
const sampleChargers = [
  {
    chargePointId: 'JAAL34S021',
    serialNumber: 'JAAL34S021',
    catalogNumber: '8EM1310-3EJ04-0GA0',
    vendor: 'Siemens',
    model: 'VersiCharge 8EM1310',
    lat: 25.2048,
    lng: 55.2708,
    address: 'Dubai Marina, Dubai, UAE',
    connectorTypes: ['Type2', 'CCS'],
    powerKW: 7.7, // 240V * 32A / 1000
    ratedVolts: 240,
    ratedAmps: 32,
    maximumAmps: 32,
    ipAddress: '192.168.10.143',
    targetGroup: 'Production',
    status: 'available' as const,
    pricePerKwh: 0.35,
    isConnected: false,
    rating: 4.5,
    reviewCount: 12,
  },
  {
    chargePointId: 'CHG001',
    serialNumber: 'CHG001',
    catalogNumber: 'ABB-001',
    vendor: 'ABB',
    model: 'Terra AC',
    lat: 25.1972,
    lng: 55.2744,
    address: 'Downtown Dubai, Dubai, UAE',
    connectorTypes: ['Type2', 'CHAdeMO'],
    powerKW: 22,
    ratedVolts: 400,
    ratedAmps: 32,
    maximumAmps: 32,
    ipAddress: '192.168.10.144',
    targetGroup: 'Production',
    status: 'available' as const,
    pricePerKwh: 0.45,
    isConnected: false,
    rating: 4.2,
    reviewCount: 8,
  },
  {
    chargePointId: 'CHG002',
    serialNumber: 'CHG002',
    catalogNumber: 'TESLA-001',
    vendor: 'Tesla',
    model: 'Supercharger V3',
    lat: 25.2084,
    lng: 55.2719,
    address: 'Business Bay, Dubai, UAE',
    connectorTypes: ['Tesla', 'CCS'],
    powerKW: 150,
    ratedVolts: 480,
    ratedAmps: 400,
    maximumAmps: 400,
    ipAddress: '192.168.10.145',
    targetGroup: 'Production',
    status: 'charging' as const,
    pricePerKwh: 0.65,
    isConnected: true,
    rating: 4.8,
    reviewCount: 25,
  },
  {
    chargePointId: 'CHG003',
    serialNumber: 'CHG003',
    catalogNumber: 'EVB-001',
    vendor: 'EVBox',
    model: 'Troniq 100',
    lat: 25.2131,
    lng: 55.2731,
    address: 'DIFC, Dubai, UAE',
    connectorTypes: ['Type2', 'CCS'],
    powerKW: 100,
    ratedVolts: 400,
    ratedAmps: 250,
    maximumAmps: 250,
    ipAddress: '192.168.10.146',
    targetGroup: 'Production',
    status: 'out_of_service' as const,
    pricePerKwh: 0.55,
    isConnected: false,
    rating: 4.1,
    reviewCount: 15,
  },
];

export async function seedChargers() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Charger],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('🔌 Database connected for charger seeding');

    const chargerRepository = dataSource.getRepository(Charger);

    // Check if chargers already exist
    const existingChargers = await chargerRepository.count();
    if (existingChargers > 0) {
      console.log(`✅ Found ${existingChargers} existing chargers. Skipping seed.`);
      return;
    }

    // Insert sample chargers
    console.log('🌱 Seeding chargers...');
    for (const chargerData of sampleChargers) {
      const charger = chargerRepository.create(chargerData);
      await chargerRepository.save(charger);
      console.log(`✅ Created charger: ${chargerData.vendor} ${chargerData.model} (${chargerData.chargePointId})`);
    }

    console.log('🎉 Charger seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding chargers:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  seedChargers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} 
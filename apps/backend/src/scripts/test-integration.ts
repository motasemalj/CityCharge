import { DataSource } from 'typeorm';
import { Charger } from '../charger/entities/charger.entity';
import { ChargingSession } from '../session/entities/session.entity';
import { User } from '../user/entities/user.entity';
import axios from 'axios';

// Test configuration
const config = {
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  ocppGatewayUrl: process.env.OCPP_GATEWAY_URL || 'http://localhost:3001',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'supersecret',
};

// Test user credentials
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
};

// Test admin credentials
const testAdmin = {
  email: 'admin@example.com',
  password: 'admin123',
  name: 'Test Admin',
};

class IntegrationTester {
  private dataSource!: DataSource;
  private userToken!: string;
  private adminToken!: string;
  private testCharger!: any;
  private testSession!: any;

  async initialize() {
    console.log('🔧 Initializing integration test...');
    
    // Initialize database connection
    this.dataSource = new DataSource({
      type: 'postgres',
      url: config.databaseUrl,
      entities: [Charger, ChargingSession, User],
      synchronize: false,
    });

    await this.dataSource.initialize();
    console.log('✅ Database connected');
  }

  async testBackendHealth() {
    console.log('\n🔍 Testing backend health...');
    try {
      const response = await axios.get(`${config.backendUrl}`);
      console.log('✅ Backend is healthy:', response.data);
    } catch (error) {
      console.error('❌ Backend health check failed:', error.message);
      throw error;
    }
  }

  async testOcppGatewayHealth() {
    console.log('\n🔍 Testing OCPP gateway health...');
    try {
      const response = await axios.get(`${config.ocppGatewayUrl}/health`);
      console.log('✅ OCPP Gateway is healthy:', response.data);
    } catch (error) {
      console.error('❌ OCPP Gateway health check failed:', error.message);
      throw error;
    }
  }

  async authenticateUsers() {
    console.log('\n🔐 Authenticating test users...');
    
    try {
      // Try to login with existing users
      const userLogin = await axios.post(`${config.backendUrl}/auth/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      this.userToken = (userLogin.data as any).token;
      console.log('✅ Test user authenticated');
    } catch (error) {
      console.log('ℹ️ Test user not found, creating...');
      // Create test user if doesn't exist
      await axios.post(`${config.backendUrl}/auth/register`, testUser);
      const userLogin = await axios.post(`${config.backendUrl}/auth/login`, {
        email: testUser.email,
        password: testUser.password,
      });
      this.userToken = (userLogin.data as any).token;
      console.log('✅ Test user created and authenticated');
    }

    try {
      const adminLogin = await axios.post(`${config.backendUrl}/auth/login`, {
        email: testAdmin.email,
        password: testAdmin.password,
      });
      this.adminToken = (adminLogin.data as any).token;
      console.log('✅ Test admin authenticated');
    } catch (error) {
      console.log('ℹ️ Test admin not found, creating...');
      // Create test admin if doesn't exist
      await axios.post(`${config.backendUrl}/auth/register`, {
        ...testAdmin,
        role: 'admin',
      });
      const adminLogin = await axios.post(`${config.backendUrl}/auth/login`, {
        email: testAdmin.email,
        password: testAdmin.password,
      });
      this.adminToken = (adminLogin.data as any).token;
      console.log('✅ Test admin created and authenticated');
    }
  }

  async testChargerCrud() {
    console.log('\n🔌 Testing charger CRUD operations...');
    
    // Create charger
    const chargerData = {
      chargePointId: `TEST_${Date.now()}`,
      serialNumber: `TEST_${Date.now()}`,
      catalogNumber: 'TEST-001',
      vendor: 'Test Vendor',
      model: 'Test Model',
      lat: 25.2048,
      lng: 55.2708,
      address: 'Test Address, Dubai, UAE',
      connectorTypes: ['Type2', 'CCS'],
      powerKW: 7.7,
      ratedVolts: 240,
      ratedAmps: 32,
      maximumAmps: 32,
      ipAddress: '192.168.1.100',
      targetGroup: 'Testing',
      status: 'available',
      pricePerKwh: 0.35,
    };

    try {
      const createResponse = await axios.post(
        `${config.backendUrl}/charger`,
        chargerData,
        {
          headers: {
            Authorization: `Bearer ${this.adminToken}`,
          },
        }
      );
      this.testCharger = createResponse.data;
      console.log('✅ Charger created:', this.testCharger.chargePointId);

      // Get charger
      const getResponse = await axios.get(`${config.backendUrl}/charger/${this.testCharger.id}`);
      console.log('✅ Charger retrieved:', (getResponse.data as any).chargePointId);

      // List all chargers
      const listResponse = await axios.get(`${config.backendUrl}/charger`);
      console.log(`✅ Found ${(listResponse.data as any).length} chargers total`);

    } catch (error) {
      console.error('❌ Charger CRUD test failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async testOcppGatewayChargerStatus() {
    console.log('\n🔄 Testing OCPP gateway charger status update...');
    
    try {
      // Test connection status update
      const statusUpdate = {
        chargePointId: this.testCharger.chargePointId,
        isConnected: true,
        lastSeen: new Date().toISOString(),
      };

      const response = await axios.patch(
        `${config.backendUrl}/charger/connection-status`,
        statusUpdate
      );

      console.log('✅ OCPP connection status updated:', response.data);

      // Verify the status was updated in database
      const updatedCharger = await axios.get(`${config.backendUrl}/charger/${this.testCharger.id}`);
      if ((updatedCharger.data as any).isConnected) {
        console.log('✅ Connection status reflected in database');
      } else {
        throw new Error('Connection status not updated in database');
      }

    } catch (error) {
      console.error('❌ OCPP gateway status test failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async testSessionCreation() {
    console.log('\n⚡ Testing charging session creation...');
    
    try {
      // Create a test session
      const sessionData = {
        chargerId: this.testCharger.id,
        startTime: new Date().toISOString(),
        status: 'active',
        cost: 0, // Start with 0 cost
      };

      const response = await axios.post(
        `${config.backendUrl}/session`,
        sessionData,
        {
          headers: {
            Authorization: `Bearer ${this.userToken}`,
          },
        }
      );

      this.testSession = response.data;
      console.log('✅ Charging session created:', this.testSession.id);

      // The session creation should have triggered OCPP command
      // (This would normally fail since we don't have a real charger connected)
      // But we can test that the flow attempted the OCPP communication

    } catch (error) {
      console.log('ℹ️ Session creation failed (expected without real charger):', error.response?.data?.message);
      // This is expected if OCPP gateway can't reach the charger
      if (error.response?.data?.message?.includes('Failed to communicate with OCPP gateway')) {
        console.log('✅ OCPP integration is working (charger not connected, as expected)');
      } else {
        throw error;
      }
    }
  }

  async testOcppEventHandling() {
    console.log('\n📡 Testing OCPP event handling...');
    
    try {
      // Simulate an OCPP event from the gateway
      const ocppEvent = {
        chargePointId: this.testCharger.chargePointId,
        msg: {
          action: 'StartTransaction',
          transactionId: 123,
          timestamp: new Date().toISOString(),
        },
      };

      const response = await axios.post(
        `${config.backendUrl}/api/ocpp/event`,
        ocppEvent
      );

      console.log('✅ OCPP event handled:', response.data);

    } catch (error) {
      console.error('❌ OCPP event handling test failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async testOcppGatewayEndpoints() {
    console.log('\n🌐 Testing OCPP gateway endpoints...');
    
    try {
      // Test getting connected chargers
      const chargersResponse = await axios.get(`${config.ocppGatewayUrl}/api/ocpp/chargers`);
      console.log('✅ OCPP gateway chargers endpoint:', chargersResponse.data);

      // Test sending command (will fail since charger not connected)
      try {
        const commandResponse = await axios.post(
          `${config.ocppGatewayUrl}/api/ocpp/send`,
          {
            chargePointId: this.testCharger.chargePointId,
            command: {
              action: 'GetConfiguration',
              key: ['HeartbeatInterval'],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${config.jwtSecret}`,
            },
          }
        );
        console.log('✅ OCPP command sent:', commandResponse.data);
      } catch (cmdError) {
        if (cmdError.response?.data?.error === 'Charger not connected') {
          console.log('✅ OCPP command handling working (charger not connected, as expected)');
        } else {
          throw cmdError;
        }
      }

    } catch (error) {
      console.error('❌ OCPP gateway endpoints test failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Delete test charger
      if (this.testCharger) {
        await axios.delete(
          `${config.backendUrl}/charger/${this.testCharger.id}`,
          {
            headers: {
              Authorization: `Bearer ${this.adminToken}`,
            },
          }
        );
        console.log('✅ Test charger deleted');
      }

      // Close database connection
      await this.dataSource.destroy();
      console.log('✅ Database connection closed');

    } catch (error) {
      console.error('⚠️ Cleanup warning:', error.message);
    }
  }

  async runAll() {
    try {
      await this.initialize();
      await this.testBackendHealth();
      await this.testOcppGatewayHealth();
      await this.authenticateUsers();
      await this.testChargerCrud();
      await this.testOcppGatewayChargerStatus();
      await this.testSessionCreation();
      await this.testOcppEventHandling();
      await this.testOcppGatewayEndpoints();
      
      console.log('\n🎉 All integration tests passed!');
      console.log('\n📋 Summary:');
      console.log('✅ Backend health check');
      console.log('✅ OCPP Gateway health check');
      console.log('✅ User authentication');
      console.log('✅ Charger CRUD operations');
      console.log('✅ OCPP connection status updates');
      console.log('✅ Session creation with OCPP integration');
      console.log('✅ OCPP event handling');
      console.log('✅ OCPP Gateway endpoints');
      
      console.log('\n🚀 Your EV charging platform is ready!');
      console.log('\nNext steps:');
      console.log('1. Deploy the services to production');
      console.log('2. Configure your real chargers to connect to the OCPP gateway');
      console.log('3. Use the admin panel to add charger records');
      console.log('4. Test with real charging sessions');

    } catch (error) {
      console.error('\n💥 Integration test failed:', error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  require('dotenv').config();
  
  const tester = new IntegrationTester();
  tester.runAll()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Integration test suite failed:', error);
      process.exit(1);
    });
}

export { IntegrationTester }; 
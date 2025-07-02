import { DataSource } from 'typeorm';
import { User } from '../user/entities/user.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'ev_charging',
  entities: [User],
  synchronize: false,
});

async function makeAdmin(email: string) {
  try {
    await AppDataSource.initialize();
    
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { email } });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      return;
    }
    
    if (user.role === 'admin') {
      console.log(`✅ User ${email} is already an admin`);
      return;
    }
    
    await userRepository.update(user.id, { role: 'admin' });
    console.log(`✅ Successfully made ${email} an admin`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

// Get email from command line arguments
const email = process.argv[2];
if (!email) {
  console.log('Usage: npm run make-admin -- user@example.com');
  process.exit(1);
}

makeAdmin(email); 
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { ChargerModule } from './charger/charger.module';
import { SessionModule } from './session/session.module';
import { PaymentModule } from './payment/payment.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { User } from './user/entities/user.entity';
import { Wallet } from './user/entities/wallet.entity';
import { Transaction } from './user/entities/transaction.entity';
import { Charger } from './charger/entities/charger.entity';
import { ChargingSession } from './session/entities/session.entity';
import { Reservation } from './session/entities/reservation.entity';
import { Payment } from './payment/entities/payment.entity';
import { AppGateway } from './app.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        entities: [User, Wallet, Transaction, Charger, ChargingSession, Reservation, Payment],
        synchronize: true, // Set to false in production
      }),
      inject: [ConfigService],
    }),
    UserModule,
    ChargerModule,
    SessionModule,
    PaymentModule,
    AdminModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppGateway],
})
export class AppModule {}

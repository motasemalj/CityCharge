import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { ReservationController } from './reservation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargingSession } from './entities/session.entity';
import { User } from '../user/entities/user.entity';
import { Payment } from '../payment/entities/payment.entity';
import { Reservation } from './entities/reservation.entity';
import { Charger } from '../charger/entities/charger.entity';
import { AppGateway } from '../app.gateway';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChargingSession, User, Payment, Reservation, Charger]),
    UserModule,
  ],
  providers: [SessionService, AppGateway],
  controllers: [SessionController, ReservationController],
  exports: [SessionService],
})
export class SessionModule {}

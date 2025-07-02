import { Module } from '@nestjs/common';
import { ChargerService } from './charger.service';
import { ChargerController } from './charger.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Charger } from './entities/charger.entity';
import { AppGateway } from '../app.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([Charger])],
  providers: [ChargerService, AppGateway],
  controllers: [ChargerController],
  exports: [ChargerService],
})
export class ChargerModule {}

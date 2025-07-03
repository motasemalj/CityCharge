import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Charger } from './entities/charger.entity';
import { AppGateway } from '../app.gateway';

@Injectable()
export class ChargerService {
  private readonly logger = new Logger(ChargerService.name);
  constructor(
    @InjectRepository(Charger)
    private chargerRepository: Repository<Charger>,
    private readonly appGateway: AppGateway,
  ) {}

  async create(data: Partial<Charger>) {
    try {
      const charger = this.chargerRepository.create(data);
      const saved = await this.chargerRepository.save(charger);
      this.appGateway.emitChargerUpdate(saved);
      this.logger.log(`Created charger ${saved.id}`);
      return saved;
    } catch (err) {
      this.logger.error('Failed to create charger', err.stack);
      throw new BadRequestException('Failed to create charger');
    }
  }

  async findAll() {
    return this.chargerRepository.find();
  }

  async findOne(id: string) {
    return this.chargerRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<Charger>) {
    try {
      await this.chargerRepository.update(id, data);
      const updated = await this.chargerRepository.findOne({ where: { id } });
      this.appGateway.emitChargerUpdate(updated);
      this.logger.log(`Updated charger ${id}`);
      return updated;
    } catch (err) {
      this.logger.error(`Failed to update charger ${id}`, err.stack);
      throw new BadRequestException('Failed to update charger');
    }
  }

  async remove(id: string) {
    try {
      const charger = await this.chargerRepository.findOne({ where: { id } });
      await this.chargerRepository.delete(id);
      this.appGateway.emitChargerUpdate({ ...charger, deleted: true });
      this.logger.log(`Removed charger ${id}`);
      return { deleted: true };
    } catch (err) {
      this.logger.error(`Failed to remove charger ${id}`, err.stack);
      throw new BadRequestException('Failed to remove charger');
    }
  }

  async updateConnectionStatus(chargePointId: string, isConnected: boolean, lastSeen: Date) {
    try {
      await this.chargerRepository.update(
        { chargePointId },
        { isConnected, lastSeen }
      );
      
      const updatedCharger = await this.chargerRepository.findOne({ where: { chargePointId } });
      if (updatedCharger) {
        this.appGateway.emitChargerUpdate(updatedCharger);
        this.logger.log(`Updated charger ${chargePointId} connection status: ${isConnected}`);
      }
      
      return { success: true };
    } catch (err) {
      this.logger.error(`Failed to update charger ${chargePointId} connection status`, err.stack);
      throw new BadRequestException('Failed to update charger connection status');
    }
  }
}

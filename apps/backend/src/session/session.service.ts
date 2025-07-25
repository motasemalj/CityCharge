import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChargingSession } from './entities/session.entity';
import { User } from '../user/entities/user.entity';
import { Payment } from '../payment/entities/payment.entity';
import { Reservation } from './entities/reservation.entity';
import { Charger } from '../charger/entities/charger.entity';
import { AppGateway } from '../app.gateway';
import { WalletService } from '../user/wallet.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(ChargingSession)
    private sessionRepository: Repository<ChargingSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Charger)
    private chargerRepository: Repository<Charger>,
    private readonly appGateway: AppGateway,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {}

  async create(data: Partial<ChargingSession>) {
    // Validate required data
    if (!data.userId) throw new BadRequestException('User ID is required');
    if (!data.chargerId) throw new BadRequestException('Charger ID is required');
    
    // Get charger record to find chargePointId
    const charger = await this.chargerRepository.findOne({ where: { id: data.chargerId } });
    if (!charger) throw new BadRequestException('Charger not found');
    
    // Assume cost is provided in data
    const user = await this.userRepository.findOne({ where: { id: data.userId } });
    if (!user) throw new BadRequestException('User not found');
    
    // Get user's wallet and check balance
    const wallet = await this.walletService.getWallet(data.userId);
    if ((data.cost || 0) > Number(wallet.balance)) {
      throw new BadRequestException('Insufficient wallet balance');
    }
    
    // --- OCPP Gateway Integration ---
    const OCPP_GATEWAY_URL = this.configService.get<string>('OCPP_GATEWAY_URL') || 'http://localhost:3001';
    const JWT_SECRET = this.configService.get<string>('OCPP_GATEWAY_JWT') || 'supersecret';
    
    // Generate proper JWT token
    const token = jwt.sign(
      { 
        service: 'backend',
        timestamp: Date.now() 
      }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );
    
    try {
      console.log(`[OCPP] Sending command to ${OCPP_GATEWAY_URL} for charger ${charger.chargePointId}`);
      const ocppRes = await axios.post(
        `${OCPP_GATEWAY_URL}/api/ocpp/send`,
        {
          chargePointId: charger.chargePointId, // Use chargePointId from charger record
          command: {
            action: 'RemoteStartTransaction',
            userId: data.userId,
            sessionId: undefined, // Will be set after session is created
          },
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // 5 second timeout
        }
      );
      // Type assertion to safely access the response data
      const responseData = ocppRes.data as { status?: string };
      if (responseData.status !== 'sent') {
        throw new BadRequestException('Failed to start charging on charger');
      }
    } catch (err: any) {
      console.error('[OCPP] Gateway communication failed:', {
        url: OCPP_GATEWAY_URL,
        chargePointId: charger.chargePointId,
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      throw new BadRequestException(`Failed to communicate with OCPP gateway: ${err.message}`);
    }
    // --- End OCPP Gateway Integration ---
    
    // Create session first
    const session = this.sessionRepository.create(data);
    const savedSession = await this.sessionRepository.save(session);
    
    // Deduct from wallet using the wallet service
    await this.walletService.deductCredit(
      data.userId,
      data.cost || 0,
      `Charging session payment - Session ${savedSession.id}`,
      savedSession.id
    );
    
    // Record payment
    await this.paymentRepository.save({
      userId: user.id,
      amount: data.cost || 0,
      type: 'session_payment',
      status: 'completed',
      sessionId: savedSession.id,
    });
    
    this.appGateway.emitSessionUpdate(savedSession);
    return savedSession;
  }

  findAll() {
    return this.sessionRepository.find();
  }

  findOne(id: string) {
    return this.sessionRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<ChargingSession>) {
    await this.sessionRepository.update(id, data);
    const updated = await this.sessionRepository.findOne({ where: { id } });
    this.appGateway.emitSessionUpdate(updated);
    return updated;
  }

  remove(id: string) {
    return this.sessionRepository.delete(id);
  }

  async createReservation(data: Partial<Reservation>) {
    // Prevent overlapping reservations for the same charger
    const overlap = await this.reservationRepository.findOne({
      where: {
        chargerId: data.chargerId,
        status: 'active',
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });
    if (overlap) throw new BadRequestException('Charger already reserved for this time slot');
    const reservation = this.reservationRepository.create(data);
    const saved = await this.reservationRepository.save(reservation);
    this.appGateway.emitReservationUpdate(saved);
    return saved;
  }

  async getReservations(filter: Partial<Reservation> = {}) {
    return this.reservationRepository.find({ where: filter });
  }

  async cancelReservation(id: string) {
    await this.reservationRepository.update(id, { status: 'cancelled' });
    const cancelled = await this.reservationRepository.findOne({ where: { id } });
    this.appGateway.emitReservationUpdate(cancelled);
    return { cancelled: true };
  }

  // Handler for OCPP event webhook from gateway
  async handleOcppEvent(event: any) {
    // Find charger by chargePointId to get the database ID
    const charger = await this.chargerRepository.findOne({ where: { chargePointId: event.chargePointId } });
    if (!charger) {
      console.error(`Charger not found for chargePointId: ${event.chargePointId}`);
      return;
    }

    // Example: update session status based on OCPP event
    if (event.msg && event.msg.action === 'StartTransaction') {
      // Update session status to 'active'
      await this.sessionRepository.update(
        { chargerId: charger.id, status: 'active' },
        { status: 'active' }
      );
    } else if (event.msg && event.msg.action === 'StopTransaction') {
      // Update session status to 'completed'
      await this.sessionRepository.update(
        { chargerId: charger.id, status: 'active' },
        { status: 'completed' }
      );
    }
  }
}

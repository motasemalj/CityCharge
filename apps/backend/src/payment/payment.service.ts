import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
// import Stripe from 'stripe';
import { User } from '../user/entities/user.entity';
import { WalletService } from '../user/wallet.service';

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' });

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private walletService: WalletService,
  ) {}

  // Mock wallet top-up for demo
  async createCheckoutSession(userId: string, amount: number) {
    try {
      console.log(`🚀 Starting wallet top-up for user ${userId}, amount: AED ${amount}`);
      
      // Create payment record
      const payment = await this.paymentRepository.save({
        userId,
        amount,
        type: 'wallet_topup',
        status: 'completed',
      });
      console.log(`✅ Payment record created:`, payment);

      // Add credit to user's wallet using the new wallet service
      const result = await this.walletService.addCredit(
        userId, 
        amount, 
        'Wallet top-up via payment',
        payment.id
      );

      console.log(`💰 Wallet top-up SUCCESS: Added AED ${amount} to user ${userId}'s wallet`);

      // Return a mock URL
      return { url: '/wallet?success=1', payment, wallet: result.wallet };
    } catch (error) {
      console.error('❌ Error in createCheckoutSession:', error);
      throw error;
    }
  }

  // Mock webhook handler for demo
  async handleStripeWebhook(event: any) {
    return { received: true };
  }

  create(data: Partial<Payment>) {
    const payment = this.paymentRepository.create(data);
    return this.paymentRepository.save(payment);
  }

  findAll() {
    return this.paymentRepository.find({ 
      order: { createdAt: 'DESC' } // Sort by newest first
    });
  }

  findOne(id: string) {
    return this.paymentRepository.findOne({ where: { id } });
  }

  update(id: string, data: Partial<Payment>) {
    return this.paymentRepository.update(id, data);
  }

  remove(id: string) {
    return this.paymentRepository.delete(id);
  }

  // Debug method to get all users - now using wallet service
  async getAllUsers() {
    return this.walletService.getAllWallets();
  }
}

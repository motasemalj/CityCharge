import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { WalletService } from '../user/wallet.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private walletService: WalletService,
  ) {}

  async getAllUsers() {
    const users = await this.usersRepository.find({
      select: ['id', 'email', 'name', 'role', 'isActive'],
      relations: ['wallet'],
    });

    return users.map(user => ({
      ...user,
      walletBalance: Number(user.wallet?.balance || 0),
      totalDeposited: Number(user.wallet?.totalDeposited || 0),
      totalSpent: Number(user.wallet?.totalSpent || 0),
    }));
  }

  async updateUserRole(id: string, role: 'user' | 'admin') {
    await this.usersRepository.update(id, { role });
    return this.usersRepository.findOne({ where: { id } });
  }

  async deactivateUser(id: string) {
    await this.usersRepository.update(id, { isActive: false });
    return { message: 'User deactivated successfully' };
  }

  async adjustUserBalance(userId: string, amount: number, description: string) {
    return this.walletService.adjustBalance(userId, amount, description);
  }

  async getTotalPurchases() {
    return this.walletService.getTotalPurchases();
  }

  async getAllWallets() {
    return this.walletService.getAllWallets();
  }

  async getUserTransactions(userId: string, limit: number = 50) {
    return this.walletService.getTransactions(userId, limit);
  }
}

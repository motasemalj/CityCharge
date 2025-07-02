import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Wallet } from './entities/wallet.entity';
import { Transaction } from './entities/transaction.entity';
import { User } from './entities/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async createWallet(userId: string): Promise<Wallet> {
    const existingWallet = await this.walletRepository.findOne({ where: { userId } });
    if (existingWallet) {
      throw new BadRequestException('Wallet already exists for this user');
    }

    const wallet = this.walletRepository.create({
      userId,
      balance: 0,
      totalDeposited: 0,
      totalSpent: 0,
    });

    return this.walletRepository.save(wallet);
  }

  async getWallet(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({ 
      where: { userId },
      relations: ['user'],
    });

    if (!wallet) {
      // Auto-create wallet if it doesn't exist
      wallet = await this.createWallet(userId);
      wallet = await this.walletRepository.findOne({ 
        where: { userId },
        relations: ['user'],
      });
      
      if (!wallet) {
        throw new NotFoundException('Failed to create or retrieve wallet');
      }
    }

    return wallet;
  }

  async addCredit(userId: string, amount: number, description: string, reference?: string): Promise<{ wallet: Wallet; transaction: Transaction }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return this.dataSource.transaction(async manager => {
      // Get or create wallet
      let wallet = await manager.findOne(Wallet, { where: { userId } });
      if (!wallet) {
        wallet = manager.create(Wallet, {
          userId,
          balance: 0,
          totalDeposited: 0,
          totalSpent: 0,
        });
        wallet = await manager.save(Wallet, wallet);
      }

      // Update wallet balance
      const newBalance = Number(wallet.balance) + Number(amount);
      const newTotalDeposited = Number(wallet.totalDeposited) + Number(amount);

      await manager.update(Wallet, { userId }, {
        balance: newBalance,
        totalDeposited: newTotalDeposited,
      });

      // Create transaction record
      const transaction = manager.create(Transaction, {
        userId,
        amount: Number(amount),
        type: 'credit',
        description,
        reference,
        balanceAfter: newBalance,
      });

      const savedTransaction = await manager.save(Transaction, transaction);

      // Return updated wallet
      const updatedWallet = await manager.findOne(Wallet, { 
        where: { userId },
        relations: ['user'],
      });

      if (!updatedWallet) {
        throw new NotFoundException('Wallet not found after update');
      }

      return { wallet: updatedWallet, transaction: savedTransaction };
    });
  }

  async deductCredit(userId: string, amount: number, description: string, reference?: string): Promise<{ wallet: Wallet; transaction: Transaction }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return this.dataSource.transaction(async manager => {
      const wallet = await manager.findOne(Wallet, { where: { userId } });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      if (Number(wallet.balance) < Number(amount)) {
        throw new BadRequestException('Insufficient balance');
      }

      // Update wallet balance
      const newBalance = Number(wallet.balance) - Number(amount);
      const newTotalSpent = Number(wallet.totalSpent) + Number(amount);

      await manager.update(Wallet, { userId }, {
        balance: newBalance,
        totalSpent: newTotalSpent,
      });

      // Create transaction record
      const transaction = manager.create(Transaction, {
        userId,
        amount: Number(amount),
        type: 'debit',
        description,
        reference,
        balanceAfter: newBalance,
      });

      const savedTransaction = await manager.save(Transaction, transaction);

      // Return updated wallet
      const updatedWallet = await manager.findOne(Wallet, { 
        where: { userId },
        relations: ['user'],
      });

      if (!updatedWallet) {
        throw new NotFoundException('Wallet not found after update');
      }

      return { wallet: updatedWallet, transaction: savedTransaction };
    });
  }

  async adjustBalance(userId: string, amount: number, description: string): Promise<{ wallet: Wallet; transaction: Transaction }> {
    return this.dataSource.transaction(async manager => {
      let wallet = await manager.findOne(Wallet, { where: { userId } });
      if (!wallet) {
        wallet = manager.create(Wallet, {
          userId,
          balance: 0,
          totalDeposited: 0,
          totalSpent: 0,
        });
        wallet = await manager.save(Wallet, wallet);
      }

      // Update wallet balance
      const newBalance = Number(amount); // Set exact balance
      
      await manager.update(Wallet, { userId }, {
        balance: newBalance,
      });

      // Create transaction record
      const transaction = manager.create(Transaction, {
        userId,
        amount: Number(amount),
        type: 'admin_adjustment',
        description,
        balanceAfter: newBalance,
      });

      const savedTransaction = await manager.save(Transaction, transaction);

      // Return updated wallet
      const updatedWallet = await manager.findOne(Wallet, { 
        where: { userId },
        relations: ['user'],
      });

      if (!updatedWallet) {
        throw new NotFoundException('Wallet not found after update');
      }

      return { wallet: updatedWallet, transaction: savedTransaction };
    });
  }

  async getTransactions(userId: string, limit: number = 50): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getAllWallets(): Promise<Wallet[]> {
    return this.walletRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTotalPurchases(): Promise<{ totalPurchases: number; totalUsers: number; totalTransactions: number }> {
    const totalPurchases = await this.transactionRepository
      .createQueryBuilder('transaction')
      .select('SUM(transaction.amount)', 'total')
      .where('transaction.type IN (:...types)', { types: ['debit'] })
      .getRawOne();

    const totalUsers = await this.walletRepository.count();
    
    const totalTransactions = await this.transactionRepository.count();

    return {
      totalPurchases: Number(totalPurchases.total) || 0,
      totalUsers,
      totalTransactions,
    };
  }
} 
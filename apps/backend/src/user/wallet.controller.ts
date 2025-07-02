import { Controller, Get, Post, Body, Req, UseGuards, UsePipes, ValidationPipe, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { AddCreditDto } from './dto/add-credit.dto';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallet(@Req() req) {
    return this.walletService.getWallet(req.user.userId);
  }

  @Post('add-credit')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async addCredit(@Req() req, @Body() addCreditDto: AddCreditDto) {
    const { amount, description, reference } = addCreditDto;
    return this.walletService.addCredit(req.user.userId, amount, description, reference);
  }

  @Get('transactions')
  async getTransactions(@Req() req, @Query('limit') limit?: number) {
    const transactionLimit = limit ? Number(limit) : 50;
    return this.walletService.getTransactions(req.user.userId, transactionLimit);
  }
} 
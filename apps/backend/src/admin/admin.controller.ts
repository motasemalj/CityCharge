import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';
import { AdjustBalanceDto } from '../user/dto/adjust-balance.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body() body: { role: 'user' | 'admin' }) {
    return this.adminService.updateUserRole(id, body.role);
  }

  @Delete('users/:id')
  deactivateUser(@Param('id') id: string) {
    return this.adminService.deactivateUser(id);
  }

  @Post('users/:id/adjust-balance')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  adjustUserBalance(@Param('id') id: string, @Body() adjustBalanceDto: AdjustBalanceDto) {
    const { amount, description } = adjustBalanceDto;
    return this.adminService.adjustUserBalance(id, amount, description);
  }

  @Get('analytics/purchases')
  getTotalPurchases() {
    return this.adminService.getTotalPurchases();
  }

  @Get('wallets')
  getAllWallets() {
    return this.adminService.getAllWallets();
  }

  @Get('users/:id/transactions')
  getUserTransactions(@Param('id') id: string, @Query('limit') limit?: number) {
    const transactionLimit = limit ? Number(limit) : 50;
    return this.adminService.getUserTransactions(id, transactionLimit);
  }
}

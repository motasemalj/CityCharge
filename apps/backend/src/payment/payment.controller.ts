import { Controller, Post, Get, Param, Body, Patch, Delete, UseGuards, Req, UsePipes, ValidationPipe, Res, Headers } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Response } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Req() req, @Body() body: CreatePaymentDto) {
    // Cast type to correct union type
    const paymentData = {
      ...body,
      userId: req.user.userId,
      type: body.type as 'wallet_topup' | 'session_payment',
    };
    return this.paymentService.create(paymentData);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.paymentService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body) {
    // TODO: Only allow if payment belongs to user or admin
    return this.paymentService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    // TODO: Only allow if payment belongs to user or admin
    return this.paymentService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout-session')
  async createCheckoutSession(@Req() req, @Body('amount') amount: number) {
    return this.paymentService.createCheckoutSession(req.user.userId, amount);
  }

  @Post('webhook')
  async handleStripeWebhook(@Req() req, @Res() res: Response, @Headers('stripe-signature') sig: string) {
    let event;
    try {
      const rawBody = req['rawBody'] || JSON.stringify(req.body);
      event = (await import('stripe')).default.webhooks.constructEvent(
        rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }
    await this.paymentService.handleStripeWebhook(event);
    res.json({ received: true });
  }

  // Temporary debug endpoint to check wallet status
  @Get('debug-wallet-status')
  async debugWalletStatus() {
    try {
      const wallets = await this.paymentService.getAllUsers();
      const payments = await this.paymentService.findAll();
      
      return {
        message: 'Wallet Debug Status',
        wallets: wallets.map(w => ({
          id: w.id,
          userId: w.userId,
          userEmail: w.user?.email || 'Unknown',
          balance: w.balance,
          totalDeposited: w.totalDeposited,
          totalSpent: w.totalSpent
        })),
        recentPayments: payments.slice(0, 5)
      };
    } catch (error) {
      return { error: error.message };
    }
  }

}

import { Controller, Post, Get, Delete, Req, Param, Body, UseGuards } from '@nestjs/common';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('reservation')
export class ReservationController {
  constructor(private readonly sessionService: SessionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req, @Body() body) {
    return this.sessionService.createReservation({ ...body, userId: req.user.userId, status: 'active' });
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Req() req) {
    return this.sessionService.getReservations({ userId: req.user.userId });
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  cancel(@Req() req, @Param('id') id: string) {
    return this.sessionService.cancelReservation(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('all')
  listAll() {
    return this.sessionService.getReservations();
  }
} 
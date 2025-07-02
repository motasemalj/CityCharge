import { Controller, Post, Get, Param, Body, Patch, Delete, UseGuards, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateSessionDto } from './dto/create-session.dto';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Req() req, @Body() body: CreateSessionDto) {
    // Convert string dates to Date objects and cast status
    const sessionData = {
      ...body,
      userId: req.user.userId,
      startTime: new Date(body.startTime),
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      status: body.status as 'active' | 'completed' | 'error',
    };
    return this.sessionService.create(sessionData);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.sessionService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body) {
    // TODO: Only allow if session belongs to user or admin
    return this.sessionService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    // TODO: Only allow if session belongs to user or admin
    return this.sessionService.remove(id);
  }

  @Post('ocpp-event')
  async handleOcppEvent(@Body() event: any) {
    await this.sessionService.handleOcppEvent(event);
    return { status: 'ok' };
  }
}

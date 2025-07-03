import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { SessionService } from './session/session.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly sessionService: SessionService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // OCPP Gateway webhook endpoint
  @Post('api/ocpp/event')
  async handleOcppEvent(@Body() event: any) {
    await this.sessionService.handleOcppEvent(event);
    return { status: 'received' };
  }
}

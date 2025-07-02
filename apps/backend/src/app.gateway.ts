import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class AppGateway {
  @WebSocketServer()
  server: Server;

  emitChargerUpdate(data: any) {
    this.server.emit('charger-update', data);
  }

  emitSessionUpdate(data: any) {
    this.server.emit('session-update', data);
  }

  emitReservationUpdate(data: any) {
    this.server.emit('reservation-update', data);
  }
} 
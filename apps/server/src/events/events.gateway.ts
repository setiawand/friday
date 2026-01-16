import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    // console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinBoard')
  handleJoinBoard(
    @MessageBody() data: { boardId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `board:${data.boardId}`;
    client.join(room);
    // console.log(`Client ${client.id} joined ${room}`);
    return { event: 'joinedBoard', data: room };
  }

  @SubscribeMessage('joinUser')
  handleJoinUser(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `user:${data.userId}`;
    client.join(room);
    return { event: 'joinedUser', data: room };
  }

  @OnEvent('item.created')
  handleItemCreated(payload: any) {
    if (payload.board_id) {
      this.server.to(`board:${payload.board_id}`).emit('item.created', payload);
    }
  }

  @OnEvent('column_value.updated')
  handleColumnValueUpdated(payload: any) {
    if (payload.board_id) {
      this.server.to(`board:${payload.board_id}`).emit('column_value.updated', payload);
    }
  }
 
  @OnEvent('item.updated')
  handleItemUpdated(payload: any) {
    if (payload.board_id) {
      this.server.to(`board:${payload.board_id}`).emit('item.updated', payload);
    }
  }
  
  @OnEvent('item.archived')
  handleItemArchived(payload: any) {
      if (payload.board_id) {
          this.server.to(`board:${payload.board_id}`).emit('item.archived', payload);
      }
  }

  @OnEvent('item.deleted')
  handleItemDeleted(payload: any) {
      if (payload.board_id) {
          this.server.to(`board:${payload.board_id}`).emit('item.deleted', payload);
      }
  }

  @OnEvent('update.created')
  handleUpdateCreated(payload: any) {
    if (payload.board_id) {
      this.server.to(`board:${payload.board_id}`).emit('update.created', payload);
    }
  }

  @OnEvent('notification.created')
  handleNotificationCreated(payload: any) {
    if (payload.user_id) {
      this.server.to(`user:${payload.user_id}`).emit('notification.created', payload);
    }
  }
}

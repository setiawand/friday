
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private eventEmitter: EventEmitter2,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // For simplicity, we'll just return the user object as a token for now
    // In production, use @nestjs/jwt
    this.eventEmitter.emit('user.logged_in', user);
    return {
      access_token: 'mock-jwt-token', 
      user: user,
    };
  }

  async register(userData: any) {
      const existing = await this.usersService.findByEmail(userData.email);
      if (existing) {
          throw new UnauthorizedException('User already exists');
      }
      const newUser = await this.usersService.create(userData);
      this.eventEmitter.emit('user.registered', newUser);
      const { password, ...result } = newUser;
      return {
          access_token: 'mock-jwt-token',
          user: result
      };
  }
}

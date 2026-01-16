
import { Controller, Post, Body, UnauthorizedException, Get, Patch, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
      private authService: AuthService,
      private usersService: UsersService
    ) {}

  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: any) {
      return this.authService.register(body);
  }
  
  @Get('users')
  async getAllUsers() {
      return this.usersService.findAll();
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { is_admin?: boolean; name?: string; color?: string },
  ) {
    return this.usersService.update(id, body);
  }
}

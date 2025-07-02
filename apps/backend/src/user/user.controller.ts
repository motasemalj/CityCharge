import { Controller, Get, Patch, Delete, Body, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req) {
    return this.userService.findOne(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateProfile(@Req() req, @Body() body: UpdateUserDto) {
    return this.userService.updateProfile(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('profile')
  deleteProfile(@Req() req) {
    return this.userService.deleteProfile(req.user.userId);
  }
}

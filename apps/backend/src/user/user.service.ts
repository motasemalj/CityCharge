import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async updateProfile(userId: string, data: Partial<User>) {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.usersRepository.update(userId, data);
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  async deleteProfile(userId: string) {
    await this.usersRepository.update(userId, { isActive: false });
    return { deleted: true };
  }

  async findAll() {
    return this.usersRepository.find({ where: { isActive: true } });
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({ where: { id, isActive: true } });
    if (user) {
      // Remove password from response for security
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return user;
  }
}

import { Controller, Post, Get, Param, Body, Patch, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ChargerService } from './charger.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateChargerDto } from './dto/create-charger.dto';
import { UpdateChargerDto } from './dto/update-charger.dto';

@Controller('charger')
export class ChargerController {
  constructor(private readonly chargerService: ChargerService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() body: CreateChargerDto) {
    return this.chargerService.create({ ...body, status: body.status as 'available' | 'charging' | 'out_of_service' });
  }

  @Get()
  findAll() {
    return this.chargerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chargerService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chargerService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    console.log('PATCH request body:', body);
    return this.chargerService.update(id, body);
  }


}

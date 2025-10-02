import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto } from '../common/dto/location.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Locations')
@Controller('locations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or location already exists' })
  async create(@Req() req: Request, @Body() createLocationDto: CreateLocationDto) {
    const user = req.user as any;
    return this.locationsService.create(user.businessId, user.id, createLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all locations for current business' })
  @ApiResponse({ status: 200, description: 'Locations retrieved successfully' })
  async findAll(@Req() req: Request) {
    const user = req.user as any;
    return this.locationsService.findAll(user.businessId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a location by ID' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Location retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.locationsService.findOne(id, user.businessId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a location' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    const user = req.user as any;
    return this.locationsService.update(id, user.businessId, user.id, updateLocationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a location' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Location deleted successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.locationsService.remove(id, user.businessId, user.id);
  }

  @Post(':id/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync reviews for a location' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Location sync initiated successfully' })
  @ApiResponse({ status: 400, description: 'Location not connected to Google Business Profile' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async sync(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.locationsService.sync(id, user.businessId, user.id);
  }

  @Post(':id/connect')
  @ApiOperation({ summary: 'Connect location to Google Business Profile' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Location connected successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async connectGoogleBusinessProfile(
    @Req() req: Request,
    @Param('id') id: string,
    @Body('oauthRefreshToken') oauthRefreshToken: string,
  ) {
    const user = req.user as any;
    return this.locationsService.connectGoogleBusinessProfile(id, user.businessId, user.id, oauthRefreshToken);
  }

  @Post(':id/disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect location from Google Business Profile' })
  @ApiParam({ name: 'id', description: 'Location ID' })
  @ApiResponse({ status: 200, description: 'Location disconnected successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async disconnectGoogleBusinessProfile(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    return this.locationsService.disconnectGoogleBusinessProfile(id, user.businessId, user.id);
  }
}


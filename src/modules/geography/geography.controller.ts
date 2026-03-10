import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GeographyService } from './geography.service';
import {
  CreateRegionDto,
  UpdateRegionDto,
  CreateAreaDto,
  // UpdateAreaDto,
  CreateDistributorDto,
  UpdateDistributorDto,
  CreateTerritoryDto,
  UpdateTerritoryDto,
  UpdateAreaDto,
} from './dtos/geography.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('Geography')
@Controller('geography')
export class GeographyController {
  constructor(private readonly geographyService: GeographyService) {}

  // ─── REGIONS ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List all regions — Admin & SR' })
  @Roles(UserRole.ADMIN, UserRole.SALES_REP)
  @Get('regions')
  findAllRegions() {
    return this.geographyService.findAllRegions();
  }

  @ApiOperation({ summary: 'Get region by ID — Admin & SR' })
  @Roles(UserRole.ADMIN, UserRole.SALES_REP)
  @Get('regions/:id')
  findOneRegion(@Param('id') id: string) {
    return this.geographyService.findOneRegion(id);
  }

  @ApiOperation({ summary: 'Create region — Admin only' })
  @Roles(UserRole.ADMIN)
  @Post('regions')
  createRegion(@Body() dto: CreateRegionDto) {
    return this.geographyService.createRegion(dto);
  }

  @ApiOperation({ summary: 'Update region — Admin only' })
  @Roles(UserRole.ADMIN)
  @Patch('regions/:id')
  updateRegion(@Param('id') id: string, @Body() dto: UpdateRegionDto) {
    return this.geographyService.updateRegion(id, dto);
  }

  @ApiOperation({ summary: 'Delete region — Admin only' })
  @Roles(UserRole.ADMIN)
  @Delete('regions/:id')
  @HttpCode(HttpStatus.OK)
  deleteRegion(@Param('id') id: string) {
    return this.geographyService.deleteRegion(id);
  }

  // // ─── AREAS ────────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List all areas — Admin & SR' })
  @ApiQuery({ name: 'region_id', required: false, type: Number })
  @Roles(UserRole.ADMIN, UserRole.SALES_REP)
  @Get('areas')
  findAllAreas(@Query('region_id') region_id?: string) {
    return this.geographyService.findAllAreas(region_id);
  }

  @ApiOperation({ summary: 'Get area by ID — Admin & SR' })
  @Roles(UserRole.ADMIN, UserRole.SALES_REP)
  @Get('areas/:id')
  findOneArea(@Param('id') id: string) {
    return this.geographyService.findOneArea(id);
  }

  @ApiOperation({ summary: 'Create area — Admin only' })
  @Roles(UserRole.ADMIN)
  @Post('areas')
  createArea(@Body() dto: CreateAreaDto) {
    return this.geographyService.createArea(dto);
  }

  @ApiOperation({ summary: 'Update area — Admin only' })
  @Roles(UserRole.ADMIN)
  @Patch('areas/:id')
  updateArea(@Param('id') id: string, @Body() dto: UpdateAreaDto) {
    return this.geographyService.updateArea(id, dto);
  }

  @ApiOperation({ summary: 'Delete area — Admin only' })
  @Roles(UserRole.ADMIN)
  @Delete('areas/:id')
  @HttpCode(HttpStatus.OK)
  deleteArea(@Param('id') id: string) {
    return this.geographyService.deleteArea(id);
  }

  // ─── DISTRIBUTORS ─────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List all distributors — Admin & SR' })
  @Roles(UserRole.ADMIN, UserRole.SALES_REP)
  @Get('distributors')
  findAllDistributors() {
    return this.geographyService.findAllDistributors();
  }

  @ApiOperation({ summary: 'Get distributor by ID — Admin & SR' })
  @Roles(UserRole.ADMIN, UserRole.SALES_REP)
  @Get('distributors/:id')
  findOneDistributor(@Param('id') id: string) {
    return this.geographyService.findOneDistributor(id);
  }

  @ApiOperation({ summary: 'Create distributor — Admin only' })
  @Roles(UserRole.ADMIN)
  @Post('distributors')
  createDistributor(@Body() dto: CreateDistributorDto) {
    return this.geographyService.createDistributor(dto);
  }

  @ApiOperation({ summary: 'Update distributor — Admin only' })
  @Roles(UserRole.ADMIN)
  @Patch('distributors/:id')
  updateDistributor(
    @Param('id') id: string,
    @Body() dto: UpdateDistributorDto,
  ) {
    return this.geographyService.updateDistributor(id, dto);
  }

  @ApiOperation({ summary: 'Delete distributor — Admin only' })
  @Roles(UserRole.ADMIN)
  @Delete('distributors/:id')
  @HttpCode(HttpStatus.OK)
  deleteDistributor(@Param('id') id: string) {
    return this.geographyService.deleteDistributor(id);
  }

  // ─── TERRITORIES ──────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'List all territories — Admin & SR' })
  @ApiQuery({ name: 'area_id', required: false, type: Number })
  @Roles(UserRole.ADMIN, UserRole.SALES_REP)
  @Get('territories')
  findAllTerritories(@Query('area_id') area_id?: string) {
    return this.geographyService.findAllTerritories(area_id);
  }

  @ApiOperation({ summary: 'Get territory by ID — Admin & SR' })
  @Roles(UserRole.ADMIN, UserRole.SALES_REP)
  @Get('territories/:id')
  findOneTerritory(@Param('id') id: string) {
    return this.geographyService.findOneTerritory(id);
  }

  @ApiOperation({ summary: 'Create territory — Admin only' })
  @Roles(UserRole.ADMIN)
  @Post('territories')
  createTerritory(@Body() dto: CreateTerritoryDto) {
    return this.geographyService.createTerritory(dto);
  }

  @ApiOperation({ summary: 'Update territory — Admin only' })
  @Roles(UserRole.ADMIN)
  @Patch('territories/:id')
  updateTerritory(@Param('id') id: string, @Body() dto: UpdateTerritoryDto) {
    return this.geographyService.updateTerritory(id, dto);
  }

  @ApiOperation({ summary: 'Delete territory — Admin only' })
  @Roles(UserRole.ADMIN)
  @Delete('territories/:id')
  @HttpCode(HttpStatus.OK)
  deleteTerritory(@Param('id') id: string) {
    return this.geographyService.deleteTerritory(id);
  }
}

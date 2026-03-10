import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import { RetailersService } from './retailer.service';
import { QueryRetailersDto, UpdateRetailerDto } from './dtos/retailers.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Retailers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('retailers')
export class RetailersController {
  constructor(private readonly retailersService: RetailersService) {}

  // ═══════════════════════════════════════════════════════════════════════
  //  ADMIN ROUTES
  // ═══════════════════════════════════════════════════════════════════════

  @ApiOperation({
    summary: 'Admin — List all retailers (search, filter, paginated)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, UID, phone',
  })
  @ApiQuery({ name: 'region_id', required: false })
  @ApiQuery({ name: 'area_id', required: false })
  @ApiQuery({ name: 'distributor_id', required: false })
  @ApiQuery({ name: 'territory_id', required: false })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: [
      'name',
      'uid',
      'phone',
      'points',
      'created_at',
      'region',
      'area',
      'territory',
      'distributor',
    ],
  })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles(UserRole.ADMIN)
  @Get('admin/all')
  findAll(@Query() query: QueryRetailersDto) {
    return this.retailersService.findAll(query);
  }

  @ApiOperation({ summary: 'Admin — Get any retailer by UID' })
  @Roles(UserRole.ADMIN)
  @Get('admin/:uid')
  findByUid(@Param('uid') uid: string) {
    return this.retailersService.findByUid(uid);
  }

  @ApiOperation({ summary: 'Admin — Bulk import retailers from CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with columns: uid, name, phone, region_name, area_name, distributor_name, territory_name, points, routes, notes',
        },
      },
      required: ['file'],
    },
  })
  @Roles(UserRole.ADMIN)
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCsv(@UploadedFile() file: Express.Multer.File) {
    const result = await this.retailersService.importFromCsv(file);

    return {
      message: `Import complete: ${result.inserted} inserted, ${result.updated} updated, ${result.failed} failed`,
      data: result,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  SALES REP ROUTES
  // ═══════════════════════════════════════════════════════════════════════

  @ApiOperation({
    summary: 'SR — List assigned retailers (search, filter, paginated)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by name, UID, phone',
  })
  @ApiQuery({ name: 'region_id', required: false })
  @ApiQuery({ name: 'area_id', required: false })
  @ApiQuery({ name: 'distributor_id', required: false })
  @ApiQuery({ name: 'territory_id', required: false })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: [
      'name',
      'uid',
      'phone',
      'points',
      'created_at',
      'region',
      'area',
      'territory',
      'distributor',
    ],
  })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles(UserRole.SALES_REP)
  @Get()
  findAssigned(@Request() req, @Query() query: QueryRetailersDto) {
    return this.retailersService.findAssigned(req.user.id, query);
  }

  @ApiOperation({ summary: 'SR — Get assigned retailer detail by UID' })
  @Roles(UserRole.SALES_REP)
  @Get(':uid')
  findAssignedByUid(@Request() req, @Param('uid') uid: string) {
    return this.retailersService.findAssignedByUid(uid, req.user.id);
  }

  @ApiOperation({
    summary: 'SR — Update assigned retailer (points, routes, notes)',
  })
  @Roles(UserRole.SALES_REP)
  @Patch(':uid')
  updateAssigned(
    @Request() req,
    @Param('uid') uid: string,
    @Body() dto: UpdateRetailerDto,
  ) {
    return this.retailersService.updateAssigned(uid, req.user.id, dto);
  }
}

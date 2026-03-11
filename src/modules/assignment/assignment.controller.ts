import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AssignmentService } from './assignment.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RolesGuard } from 'src/common/guard/roles.guard';
import {
  AssignRetailersDto,
  QueryAssignmentsDto,
  UnassignRetailersDto,
} from './dtos/assignment.dto';

@ApiTags('Assignments')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  // ─── LIST ALL ASSIGNMENTS ─────────────────────────────────────────────

  @ApiOperation({
    summary: 'Admin — List all SR ↔ Retailer assignments (paginated)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by retailer name/UID or SR name',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['assigned_at', 'retailer_name', 'sales_rep_name'],
  })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() query: QueryAssignmentsDto) {
    return this.assignmentService.findAll(query);
  }

  // ─── LIST ASSIGNMENTS FOR A SALES REP ─────────────────────────────────

  @ApiOperation({
    summary: 'Admin — List retailers assigned to a specific SR (paginated)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by retailer name/UID',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['assigned_at', 'retailer_name', 'sales_rep_name'],
  })
  @ApiQuery({ name: 'sort_order', required: false, enum: ['ASC', 'DESC'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Roles(UserRole.ADMIN)
  @Get('sales-rep/:id')
  findBySalesRep(@Param('id') id: string, @Query() query: QueryAssignmentsDto) {
    return this.assignmentService.findBySalesRep(id, query);
  }

  // ─── BULK ASSIGN ──────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Admin — Bulk assign retailers to a Sales Rep',
    description:
      'Assign multiple retailers to a sales rep. Already assigned retailers are skipped.',
  })
  @Roles(UserRole.ADMIN)
  @Post('assign')
  assign(@Body() dto: AssignRetailersDto) {
    return this.assignmentService.assign(dto);
  }

  // ─── BULK UNASSIGN ────────────────────────────────────────────────────

  @ApiOperation({
    summary: 'Admin — Bulk unassign retailers from a Sales Rep',
    description: 'Remove multiple retailer assignments from a sales rep.',
  })
  @Roles(UserRole.ADMIN)
  @Post('unassign')
  unassign(@Body() dto: UnassignRetailersDto) {
    return this.assignmentService.unassign(dto);
  }
}

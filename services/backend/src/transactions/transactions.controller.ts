import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common'
import { Request as ExpressRequest } from 'express'
import { TransactionsService } from './transactions.service'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { UpdateTransactionDto } from './dto/update-transaction.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { SpendingQueryDto } from './dto/spending-query.dto'
import { PaginationDto } from './dto/pagination.dto'

interface AuthenticatedUser {
  id: string
  email: string
}

interface AuthenticatedRequest extends ExpressRequest {
  user: AuthenticatedUser
}

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // ==================== Transaction Endpoints ====================

  @Post()
  createTransaction(
    @Request() req: AuthenticatedRequest,
    @Body() createTransactionDto: CreateTransactionDto
  ) {
    return this.transactionsService.createTransaction(
      req.user.id,
      createTransactionDto
    )
  }

  @Get()
  findAllTransactions(
    @Request() req: AuthenticatedRequest,
    @Query() query: SpendingQueryDto,
    @Query() pagination: PaginationDto
  ) {
    return this.transactionsService.findAllTransactions(
      req.user.id,
      query,
      pagination
    )
  }

  @Get('summary')
  getSpendingSummary(
    @Request() req: AuthenticatedRequest,
    @Query() query: SpendingQueryDto
  ) {
    return this.transactionsService.getSpendingSummary(req.user.id, query)
  }

  @Get(':id')
  findOneTransaction(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.transactionsService.findOneTransaction(req.user.id, id)
  }

  @Put(':id')
  updateTransaction(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto
  ) {
    return this.transactionsService.updateTransaction(
      req.user.id,
      id,
      updateTransactionDto
    )
  }

  @Delete(':id')
  deleteTransaction(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.transactionsService.deleteTransaction(req.user.id, id)
  }

  // ==================== Category Endpoints ====================

  @Post('categories')
  createCategory(
    @Request() req: AuthenticatedRequest,
    @Body() createCategoryDto: CreateCategoryDto
  ) {
    return this.transactionsService.createCategory(
      req.user.id,
      createCategoryDto
    )
  }

  @Get('categories')
  findAllCategories(@Request() req: AuthenticatedRequest) {
    return this.transactionsService.findAllCategories(req.user.id)
  }

  @Get('categories/:id')
  findOneCategory(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.transactionsService.findOneCategory(req.user.id, id)
  }

  @Delete('categories/:id')
  deleteCategory(
    @Request() req: AuthenticatedRequest,
    @Param('id') id: string
  ) {
    return this.transactionsService.deleteCategory(req.user.id, id)
  }
}

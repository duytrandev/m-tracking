import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { SpendingQueryDto } from './dto/spending-query.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // ==================== Transaction Endpoints ====================

  @Post()
  createTransaction(@Request() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(req.user.id, createTransactionDto);
  }

  @Get()
  findAllTransactions(@Request() req, @Query() query: SpendingQueryDto) {
    return this.transactionsService.findAllTransactions(req.user.id, query);
  }

  @Get('summary')
  getSpendingSummary(@Request() req, @Query() query: SpendingQueryDto) {
    return this.transactionsService.getSpendingSummary(req.user.id, query);
  }

  @Get(':id')
  findOneTransaction(@Request() req, @Param('id') id: string) {
    return this.transactionsService.findOneTransaction(req.user.id, id);
  }

  @Put(':id')
  updateTransaction(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.updateTransaction(req.user.id, id, updateTransactionDto);
  }

  @Delete(':id')
  deleteTransaction(@Request() req, @Param('id') id: string) {
    return this.transactionsService.deleteTransaction(req.user.id, id);
  }

  // ==================== Category Endpoints ====================

  @Post('categories')
  createCategory(@Request() req, @Body() createCategoryDto: CreateCategoryDto) {
    return this.transactionsService.createCategory(req.user.id, createCategoryDto);
  }

  @Get('categories')
  findAllCategories(@Request() req) {
    return this.transactionsService.findAllCategories(req.user.id);
  }

  @Get('categories/:id')
  findOneCategory(@Request() req, @Param('id') id: string) {
    return this.transactionsService.findOneCategory(req.user.id, id);
  }

  @Delete('categories/:id')
  deleteCategory(@Request() req, @Param('id') id: string) {
    return this.transactionsService.deleteCategory(req.user.id, id);
  }
}

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
  createTransaction(@Request() req: any, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.createTransaction(req.user.id, createTransactionDto);
  }

  @Get()
  findAllTransactions(@Request() req: any, @Query() query: SpendingQueryDto) {
    return this.transactionsService.findAllTransactions(req.user.id, query);
  }

  @Get('summary')
  getSpendingSummary(@Request() req: any, @Query() query: SpendingQueryDto) {
    return this.transactionsService.getSpendingSummary(req.user.id, query);
  }

  @Get(':id')
  findOneTransaction(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.findOneTransaction(req.user.id, id);
  }

  @Put(':id')
  updateTransaction(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionsService.updateTransaction(req.user.id, id, updateTransactionDto);
  }

  @Delete(':id')
  deleteTransaction(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.deleteTransaction(req.user.id, id);
  }

  // ==================== Category Endpoints ====================

  @Post('categories')
  createCategory(@Request() req: any, @Body() createCategoryDto: CreateCategoryDto) {
    return this.transactionsService.createCategory(req.user.id, createCategoryDto);
  }

  @Get('categories')
  findAllCategories(@Request() req: any) {
    return this.transactionsService.findAllCategories(req.user.id);
  }

  @Get('categories/:id')
  findOneCategory(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.findOneCategory(req.user.id, id);
  }

  @Delete('categories/:id')
  deleteCategory(@Request() req: any, @Param('id') id: string) {
    return this.transactionsService.deleteCategory(req.user.id, id);
  }
}

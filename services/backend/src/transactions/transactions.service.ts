import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { Category } from './entities/category.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { SpendingQueryDto, TimePeriod } from './dto/spending-query.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  // ==================== Transaction CRUD ====================

  async createTransaction(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const transaction = this.transactionRepository.create({
      ...dto,
      userId,
    });

    return this.transactionRepository.save(transaction);
  }

  async findAllTransactions(userId: string, query: SpendingQueryDto): Promise<Transaction[]> {
    const { startDate, endDate } = this.getDateRange(query);

    return this.transactionRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate),
      },
      relations: ['category'],
      order: { date: 'DESC' },
    });
  }

  async findOneTransaction(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return transaction;
  }

  async updateTransaction(
    userId: string,
    id: string,
    dto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOneTransaction(userId, id);

    if ((dto as any).categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: (dto as any).categoryId, userId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    Object.assign(transaction, dto);
    return this.transactionRepository.save(transaction);
  }

  async deleteTransaction(userId: string, id: string): Promise<void> {
    const transaction = await this.findOneTransaction(userId, id);
    await this.transactionRepository.remove(transaction);
  }

  // ==================== Category CRUD ====================

  async createCategory(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create({
      ...dto,
      userId,
    });
    return this.categoryRepository.save(category);
  }

  async findAllCategories(userId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }

  async findOneCategory(userId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return category;
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const category = await this.findOneCategory(userId, id);
    await this.categoryRepository.remove(category);
  }

  // ==================== Analytics ====================

  async getSpendingSummary(userId: string, query: SpendingQueryDto) {
    const { startDate, endDate } = this.getDateRange(query);

    const transactions = await this.transactionRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate),
      },
      relations: ['category'],
    });

    const totalExpense = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const categoryBreakdown = this.getCategoryBreakdown(transactions);
    const dailyTrend = this.getDailyTrend(transactions, startDate, endDate);

    return {
      period: query.period,
      startDate,
      endDate,
      totalExpense,
      totalIncome,
      netBalance: totalIncome - totalExpense,
      transactionCount: transactions.length,
      averageExpense: transactions.length > 0 ? totalExpense / transactions.length : 0,
      categoryBreakdown,
      dailyTrend,
    };
  }

  private getCategoryBreakdown(transactions: Transaction[]) {
    const categoryMap = new Map<string, { category: Category; total: number; count: number }>();

    transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .forEach((transaction) => {
        const categoryId = transaction.categoryId;
        const existing = categoryMap.get(categoryId);

        if (existing) {
          existing.total += Number(transaction.amount);
          existing.count += 1;
        } else {
          categoryMap.set(categoryId, {
            category: transaction.category,
            total: Number(transaction.amount),
            count: 1,
          });
        }
      });

    return Array.from(categoryMap.values())
      .sort((a, b) => b.total - a.total)
      .map((item) => ({
        categoryId: item.category.id,
        categoryName: item.category.name,
        categoryColor: item.category.color,
        categoryIcon: item.category.icon,
        total: item.total,
        count: item.count,
        percentage: 0,
      }));
  }

  private getDailyTrend(transactions: Transaction[], startDate: Date, endDate: Date) {
    const dailyMap = new Map<string, { expense: number; income: number }>();

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      if (dateKey) {
        dailyMap.set(dateKey, { expense: 0, income: 0 });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    transactions.forEach((transaction) => {
      const dateKey = new Date(transaction.date).toISOString().split('T')[0];
      if (dateKey) {
        const existing = dailyMap.get(dateKey);

        if (existing) {
          if (transaction.type === TransactionType.EXPENSE) {
            existing.expense += Number(transaction.amount);
          } else {
            existing.income += Number(transaction.amount);
          }
        }
      }
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        expense: data.expense,
        income: data.income,
        net: data.income - data.expense,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getDateRange(query: SpendingQueryDto): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (query.period) {
      case TimePeriod.DAY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case TimePeriod.WEEK:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case TimePeriod.MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        break;
      case TimePeriod.YEAR:
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        break;
      case TimePeriod.CUSTOM:
        startDate = query.startDate ? new Date(query.startDate) : new Date(0);
        endDate = query.endDate ? new Date(query.endDate) : new Date();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }

    return { startDate, endDate };
  }
}

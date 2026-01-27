import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { Transaction, TransactionType } from './entities/transaction.entity'
import { Category } from './entities/category.entity'
import { CreateTransactionDto } from './dto/create-transaction.dto'
import { UpdateTransactionDto } from './dto/update-transaction.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { SpendingQueryDto, TimePeriod } from './dto/spending-query.dto'
import { PaginationDto } from './dto/pagination.dto'
import { PaginatedTransactionResponse } from './dto/paginated-transaction-response.dto'

interface TransactionTotalsRaw {
  type: TransactionType
  total: string
  count: string
}

interface CategoryBreakdownRaw {
  categoryId: string
  categoryName: string
  categoryColor: string
  categoryIcon: string
  total: string
  count: string
}

interface DailyTrendRaw {
  date: string
  expense: string
  income: string
  net: string
}

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name)
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache
  ) {}

  // ==================== Transaction CRUD ====================

  async createTransaction(
    userId: string,
    dto: CreateTransactionDto
  ): Promise<Transaction> {
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId, userId },
    })

    if (!category) {
      throw new NotFoundException('Category not found')
    }

    const transaction = this.transactionRepository.create({
      ...dto,
      userId,
    })

    const saved = await this.transactionRepository.save(transaction)

    // Invalidate cache
    await this.invalidateUserCache(userId)

    return saved
  }

  async findAllTransactions(
    userId: string,
    query: SpendingQueryDto,
    pagination: PaginationDto = new PaginationDto()
  ): Promise<PaginatedTransactionResponse> {
    const { startDate, endDate } = this.getDateRange(query)

    const [transactions, total] = await this.transactionRepository.findAndCount(
      {
        where: {
          userId,
          date: Between(startDate, endDate),
        },
        relations: ['category'],
        order: { date: 'DESC' },
        skip: pagination.skip,
        take: pagination.limit,
      }
    )

    return {
      transactions,
      total,
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 20,
      totalPages: Math.ceil(total / (pagination.limit ?? 20)),
    }
  }

  async findOneTransaction(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
      relations: ['category'],
    })

    if (!transaction) {
      throw new NotFoundException('Transaction not found')
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('Access denied')
    }

    return transaction
  }

  async updateTransaction(
    userId: string,
    id: string,
    dto: UpdateTransactionDto
  ): Promise<Transaction> {
    const transaction = await this.findOneTransaction(userId, id)

    if (dto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId, userId },
      })
      if (!category) {
        throw new NotFoundException('Category not found')
      }
    }

    Object.assign(transaction, dto)
    const saved = await this.transactionRepository.save(transaction)

    // Invalidate cache
    await this.invalidateUserCache(userId)

    return saved
  }

  async deleteTransaction(userId: string, id: string): Promise<void> {
    const transaction = await this.findOneTransaction(userId, id)
    await this.transactionRepository.remove(transaction)

    // Invalidate cache
    await this.invalidateUserCache(userId)
  }

  // ==================== Category CRUD ====================

  async createCategory(
    userId: string,
    dto: CreateCategoryDto
  ): Promise<Category> {
    const category = this.categoryRepository.create({
      ...dto,
      userId,
    })
    return this.categoryRepository.save(category)
  }

  async findAllCategories(userId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { userId },
      order: { name: 'ASC' },
    })
  }

  async findOneCategory(userId: string, id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
    })

    if (!category) {
      throw new NotFoundException('Category not found')
    }

    if (category.userId !== userId) {
      throw new ForbiddenException('Access denied')
    }

    return category
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    const category = await this.findOneCategory(userId, id)
    await this.categoryRepository.remove(category)
  }

  // ==================== Analytics ====================

  async getSpendingSummary(userId: string, query: SpendingQueryDto) {
    const { startDate, endDate } = this.getDateRange(query)

    // Generate cache key
    const cacheKey = `spending-summary:${userId}:${query.period}:${startDate.toISOString()}:${endDate.toISOString()}`

    // Try to get from cache
    const cached = await this.cacheManager.get(cacheKey)
    if (cached) {
      return cached
    }

    // Get total counts with database aggregation
    const totals = await this.transactionRepository
      .createQueryBuilder('t')
      .select('t.type', 'type')
      .addSelect('SUM(t.amount)', 'total')
      .addSelect('COUNT(t.id)', 'count')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy('t.type')
      .getRawMany<TransactionTotalsRaw>()

    const totalExpense = Number(
      totals.find(t => t.type === TransactionType.EXPENSE)?.total || 0
    )
    const totalIncome = Number(
      totals.find(t => t.type === TransactionType.INCOME)?.total || 0
    )
    const expenseCount = Number(
      totals.find(t => t.type === TransactionType.EXPENSE)?.count || 0
    )
    const transactionCount = totals.reduce((sum, t) => sum + Number(t.count), 0)

    const categoryBreakdown = await this.getCategoryBreakdown(
      userId,
      startDate,
      endDate,
      totalExpense
    )
    const dailyTrend = await this.getDailyTrend(userId, startDate, endDate)

    const summary = {
      period: query.period,
      startDate,
      endDate,
      totalExpense,
      totalIncome,
      netBalance: totalIncome - totalExpense,
      transactionCount,
      averageExpense: expenseCount > 0 ? totalExpense / expenseCount : 0,
      categoryBreakdown,
      dailyTrend,
    }

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, summary, 300000)

    return summary
  }

  private async getCategoryBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date,
    totalExpense: number
  ) {
    const raw = await this.transactionRepository
      .createQueryBuilder('t')
      .select('c.id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('c.color', 'categoryColor')
      .addSelect('c.icon', 'categoryIcon')
      .addSelect('SUM(t.amount)', 'total')
      .addSelect('COUNT(t.id)', 'count')
      .leftJoin('t.category', 'c')
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .andWhere('t.type = :type', { type: TransactionType.EXPENSE })
      .groupBy('c.id')
      .addGroupBy('c.name')
      .addGroupBy('c.color')
      .addGroupBy('c.icon')
      .orderBy('SUM(t.amount)', 'DESC')
      .getRawMany<CategoryBreakdownRaw>()

    return raw.map(r => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryColor: r.categoryColor,
      categoryIcon: r.categoryIcon,
      total: Number(r.total),
      count: Number(r.count),
      percentage: totalExpense > 0 ? (Number(r.total) / totalExpense) * 100 : 0,
    }))
  }

  private async getDailyTrend(userId: string, startDate: Date, endDate: Date) {
    const raw = await this.transactionRepository
      .createQueryBuilder('t')
      .select("TO_CHAR(t.date, 'YYYY-MM-DD')", 'date')
      .addSelect(
        "SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END)",
        'expense'
      )
      .addSelect(
        "SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END)",
        'income'
      )
      .addSelect(
        "SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END)",
        'net'
      )
      .where('t.userId = :userId', { userId })
      .andWhere('t.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .groupBy("TO_CHAR(t.date, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(t.date, 'YYYY-MM-DD')", 'ASC')
      .getRawMany<DailyTrendRaw>()

    return raw.map(r => ({
      date: r.date,
      expense: Number(r.expense),
      income: Number(r.income),
      net: Number(r.net),
    }))
  }

  private getDateRange(query: SpendingQueryDto): {
    startDate: Date
    endDate: Date
  } {
    const now = new Date()
    let startDate: Date
    let endDate: Date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    )

    switch (query.period) {
      case TimePeriod.DAY:
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0
        )
        break
      case TimePeriod.WEEK:
        startDate = new Date(now)
        startDate.setDate(now.getDate() - now.getDay())
        startDate.setHours(0, 0, 0, 0)
        break
      case TimePeriod.MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        break
      case TimePeriod.YEAR:
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
        break
      case TimePeriod.CUSTOM:
        startDate = query.startDate ? new Date(query.startDate) : new Date(0)
        endDate = query.endDate ? new Date(query.endDate) : new Date()
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    }

    return { startDate, endDate }
  }

  /**
   * Invalidate all cache entries for a user
   * Uses cache versioning approach to avoid wildcard deletion complexity
   */
  private async invalidateUserCache(userId: string): Promise<void> {
    try {
      // Invalidate all possible time period combinations
      const periods = ['day', 'week', 'month', 'year', 'custom']
      const now = new Date()
      const ranges = [
        // Today
        {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          end: now,
        },
        // This week
        { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end: now },
        // This month
        { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now },
        // This year
        { start: new Date(now.getFullYear(), 0, 1), end: now },
      ]

      const deletePromises = []
      for (const period of periods) {
        for (const range of ranges) {
          const cacheKey = `spending-summary:${userId}:${period}:${range.start.toISOString()}:${range.end.toISOString()}`
          deletePromises.push(this.cacheManager.del(cacheKey))
        }
      }

      // Also delete common patterns
      deletePromises.push(this.cacheManager.del(`transactions-list:${userId}`))
      deletePromises.push(this.cacheManager.del(`categories:${userId}`))

      await Promise.all(deletePromises)
    } catch (error) {
      // Log error but don't throw - cache invalidation failure shouldn't break mutations
      this.logger.error('Cache invalidation error:', error)
    }
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TransactionsService } from './transactions.service';
import { Transaction, TransactionType } from './entities/transaction.entity';
import { Category } from './entities/category.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { PaginationDto } from './dto/pagination.dto';
import { SpendingQueryDto, TimePeriod } from './dto/spending-query.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionRepository: Repository<Transaction>;
  let categoryRepository: Repository<Category>;
  let cacheManager: Cache;

  const mockUserId = 'user-123';
  const mockCategoryId = 'category-123';
  const mockTransactionId = 'transaction-123';

  const mockCategory = {
    id: mockCategoryId,
    userId: mockUserId,
    name: 'Food',
    color: '#FF6B6B',
    icon: 'utensils',
  } as Category;

  const mockTransaction = {
    id: mockTransactionId,
    userId: mockUserId,
    categoryId: mockCategoryId,
    amount: 50.5,
    type: TransactionType.EXPENSE,
    description: 'Lunch',
    date: new Date('2025-01-22'),
    currency: 'USD',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: mockCategory,
  } as Transaction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            create: vi.fn(),
            save: vi.fn(),
            findOne: vi.fn(),
            findAndCount: vi.fn(),
            remove: vi.fn(),
            createQueryBuilder: vi.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            create: vi.fn(),
            save: vi.fn(),
            findOne: vi.fn(),
            find: vi.fn(),
            remove: vi.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionRepository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
    categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  // ==================== Transaction CRUD ====================

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      const dto: CreateTransactionDto = {
        categoryId: mockCategoryId,
        amount: 50.5,
        type: TransactionType.EXPENSE,
        description: 'Lunch',
        date: '2025-01-22',
        currency: 'USD',
      };

      vi.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      vi.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction);
      vi.spyOn(transactionRepository, 'save').mockResolvedValue(mockTransaction);
      vi.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

      const result = await service.createTransaction(mockUserId, dto);

      expect(result).toEqual(mockTransaction);
      expect(categoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategoryId, userId: mockUserId },
      });
      expect(transactionRepository.create).toHaveBeenCalled();
      expect(transactionRepository.save).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      const dto: CreateTransactionDto = {
        categoryId: 'non-existent',
        amount: 50.5,
        type: TransactionType.EXPENSE,
        description: 'Lunch',
        date: '2025-01-22',
        currency: 'USD',
      };

      vi.spyOn(categoryRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createTransaction(mockUserId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should invalidate cache after creating transaction', async () => {
      const dto: CreateTransactionDto = {
        categoryId: mockCategoryId,
        amount: 50.5,
        type: TransactionType.EXPENSE,
        description: 'Lunch',
        date: '2025-01-22',
        currency: 'USD',
      };

      vi.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      vi.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction);
      vi.spyOn(transactionRepository, 'save').mockResolvedValue(mockTransaction);
      vi.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

      await service.createTransaction(mockUserId, dto);

      expect(cacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining(`spending-summary:${mockUserId}`),
      );
    });
  });

  describe('findAllTransactions', () => {
    it('should return paginated transactions', async () => {
      const query: SpendingQueryDto = { period: TimePeriod.MONTH };
      const pagination = new PaginationDto();

      const mockTransactions = [mockTransaction];
      vi.spyOn(transactionRepository, 'findAndCount').mockResolvedValue([
        mockTransactions,
        1,
      ]);

      const result = await service.findAllTransactions(mockUserId, query, pagination);

      expect(result).toBeDefined();
      expect(result.transactions).toEqual(mockTransactions);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('should apply pagination skip correctly', async () => {
      const query: SpendingQueryDto = { period: TimePeriod.MONTH };
      const pagination = new PaginationDto();
      pagination.page = 2;
      pagination.limit = 10;

      vi.spyOn(transactionRepository, 'findAndCount').mockResolvedValue([[], 0]);

      await service.findAllTransactions(mockUserId, query, pagination);

      expect(transactionRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (2 - 1) * 10
          take: 10,
        }),
      );
    });

    it('should handle custom date range', async () => {
      const query: SpendingQueryDto = {
        period: TimePeriod.CUSTOM,
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      };
      const pagination = new PaginationDto();

      vi.spyOn(transactionRepository, 'findAndCount').mockResolvedValue([[], 0]);

      await service.findAllTransactions(mockUserId, query, pagination);

      expect(transactionRepository.findAndCount).toHaveBeenCalled();
    });
  });

  describe('findOneTransaction', () => {
    it('should return a transaction by id', async () => {
      vi.spyOn(transactionRepository, 'findOne').mockResolvedValue(mockTransaction);

      const result = await service.findOneTransaction(mockUserId, mockTransactionId);

      expect(result).toEqual(mockTransaction);
      expect(transactionRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTransactionId },
        relations: ['category'],
      });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      vi.spyOn(transactionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOneTransaction(mockUserId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own the transaction', async () => {
      const otherUserTransaction = { ...mockTransaction, userId: 'other-user' };
      vi.spyOn(transactionRepository, 'findOne').mockResolvedValue(
        otherUserTransaction as Transaction,
      );

      await expect(service.findOneTransaction(mockUserId, mockTransactionId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateTransaction', () => {
    it('should update a transaction successfully', async () => {
      const dto: UpdateTransactionDto = { description: 'Updated lunch' };
      const updatedTransaction = { ...mockTransaction, description: 'Updated lunch' };

      vi.spyOn(transactionRepository, 'findOne').mockResolvedValue(mockTransaction);
      vi.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      vi.spyOn(transactionRepository, 'save').mockResolvedValue(updatedTransaction);
      vi.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

      const result = await service.updateTransaction(mockUserId, mockTransactionId, dto);

      expect(result).toEqual(updatedTransaction);
      expect(transactionRepository.save).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      const dto: UpdateTransactionDto = { description: 'Updated' };
      vi.spyOn(transactionRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.updateTransaction(mockUserId, 'non-existent', dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should invalidate cache after updating transaction', async () => {
      const dto: UpdateTransactionDto = { description: 'Updated lunch' };
      vi.spyOn(transactionRepository, 'findOne').mockResolvedValue(mockTransaction);
      vi.spyOn(transactionRepository, 'save').mockResolvedValue(mockTransaction);
      vi.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

      await service.updateTransaction(mockUserId, mockTransactionId, dto);

      expect(cacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining(`spending-summary:${mockUserId}`),
      );
    });
  });

  describe('deleteTransaction', () => {
    it('should delete a transaction successfully', async () => {
      vi.spyOn(transactionRepository, 'findOne').mockResolvedValue(mockTransaction);
      vi.spyOn(transactionRepository, 'remove').mockResolvedValue(undefined);
      vi.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

      await service.deleteTransaction(mockUserId, mockTransactionId);

      expect(transactionRepository.remove).toHaveBeenCalledWith(mockTransaction);
      expect(cacheManager.del).toHaveBeenCalled();
    });

    it('should throw NotFoundException if transaction not found', async () => {
      vi.spyOn(transactionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteTransaction(mockUserId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should invalidate cache after deleting transaction', async () => {
      vi.spyOn(transactionRepository, 'findOne').mockResolvedValue(mockTransaction);
      vi.spyOn(transactionRepository, 'remove').mockResolvedValue(undefined);
      vi.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

      await service.deleteTransaction(mockUserId, mockTransactionId);

      expect(cacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining(`spending-summary:${mockUserId}`),
      );
    });
  });

  // ==================== Category CRUD ====================

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      const dto: CreateCategoryDto = {
        name: 'Food',
        color: '#FF6B6B',
        icon: 'utensils',
      };

      vi.spyOn(categoryRepository, 'create').mockReturnValue(mockCategory);
      vi.spyOn(categoryRepository, 'save').mockResolvedValue(mockCategory);

      const result = await service.createCategory(mockUserId, dto);

      expect(result).toEqual(mockCategory);
      expect(categoryRepository.create).toHaveBeenCalledWith({
        ...dto,
        userId: mockUserId,
      });
      expect(categoryRepository.save).toHaveBeenCalled();
    });
  });

  describe('findAllCategories', () => {
    it('should return all categories for a user', async () => {
      const mockCategories = [mockCategory];
      vi.spyOn(categoryRepository, 'find').mockResolvedValue(mockCategories);

      const result = await service.findAllCategories(mockUserId);

      expect(result).toEqual(mockCategories);
      expect(categoryRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOneCategory', () => {
    it('should return a category by id', async () => {
      vi.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);

      const result = await service.findOneCategory(mockUserId, mockCategoryId);

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      vi.spyOn(categoryRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findOneCategory(mockUserId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own the category', async () => {
      const otherUserCategory = { ...mockCategory, userId: 'other-user' };
      vi.spyOn(categoryRepository, 'findOne').mockResolvedValue(
        otherUserCategory as Category,
      );

      await expect(service.findOneCategory(mockUserId, mockCategoryId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category successfully', async () => {
      vi.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      vi.spyOn(categoryRepository, 'remove').mockResolvedValue(undefined);

      await service.deleteCategory(mockUserId, mockCategoryId);

      expect(categoryRepository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      vi.spyOn(categoryRepository, 'findOne').mockResolvedValue(null);

      await expect(service.deleteCategory(mockUserId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ==================== Analytics ====================

  describe('getSpendingSummary', () => {
    it('should return cached summary if available', async () => {
      const query: SpendingQueryDto = { period: TimePeriod.MONTH };
      const mockSummary = {
        period: TimePeriod.MONTH,
        startDate: new Date(),
        endDate: new Date(),
        totalExpense: 100,
        totalIncome: 500,
        netBalance: 400,
        transactionCount: 5,
        averageExpense: 20,
        categoryBreakdown: [],
        dailyTrend: [],
      };

      vi.spyOn(cacheManager, 'get').mockResolvedValue(mockSummary);

      const result = await service.getSpendingSummary(mockUserId, query);

      expect(result).toEqual(mockSummary);
      expect(cacheManager.get).toHaveBeenCalled();
    });

    it('should compute summary and cache if not in cache', async () => {
      const query: SpendingQueryDto = { period: TimePeriod.MONTH };

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        addGroupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValue([]),
      };

      vi.spyOn(cacheManager, 'get').mockResolvedValue(null);
      vi.spyOn(transactionRepository, 'createQueryBuilder').mockReturnValue(
        mockQueryBuilder as any,
      );
      vi.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.getSpendingSummary(mockUserId, query);

      expect(result).toBeDefined();
      expect(result.period).toBe(TimePeriod.MONTH);
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should calculate category breakdown correctly', async () => {
      const query: SpendingQueryDto = { period: TimePeriod.MONTH };

      const mockBreakdownData = [
        {
          categoryId: 'cat-1',
          categoryName: 'Food',
          categoryColor: '#FF6B6B',
          categoryIcon: 'utensils',
          total: '50',
          count: '5',
        },
      ];

      const mockQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        addGroupBy: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        getRawMany: vi
          .fn()
          .mockResolvedValueOnce([]) // totals query
          .mockResolvedValueOnce(mockBreakdownData) // category breakdown
          .mockResolvedValueOnce([]), // daily trend
      };

      vi.spyOn(cacheManager, 'get').mockResolvedValue(null);
      vi.spyOn(transactionRepository, 'createQueryBuilder').mockReturnValue(
        mockQueryBuilder as any,
      );
      vi.spyOn(cacheManager, 'set').mockResolvedValue(undefined);

      const result = await service.getSpendingSummary(mockUserId, query);

      expect(result.categoryBreakdown).toHaveLength(1);
      expect(result.categoryBreakdown[0]).toMatchObject({
        categoryId: 'cat-1',
        categoryName: 'Food',
      });
    });
  });

  // ==================== Pagination DTO ====================

  describe('PaginationDto', () => {
    it('should calculate skip correctly for page 1', () => {
      const pagination = new PaginationDto();
      pagination.page = 1;
      pagination.limit = 20;

      expect(pagination.skip).toBe(0);
    });

    it('should calculate skip correctly for page 2', () => {
      const pagination = new PaginationDto();
      pagination.page = 2;
      pagination.limit = 20;

      expect(pagination.skip).toBe(20);
    });

    it('should calculate skip correctly for page 3 with custom limit', () => {
      const pagination = new PaginationDto();
      pagination.page = 3;
      pagination.limit = 10;

      expect(pagination.skip).toBe(20);
    });

    it('should use default values', () => {
      const pagination = new PaginationDto();

      expect(pagination.page ?? 1).toBe(1);
      expect(pagination.limit ?? 20).toBe(20);
      expect(pagination.skip).toBe(0);
    });

    it('should handle undefined page and limit in skip calculation', () => {
      const pagination = new PaginationDto();
      // Don't set page and limit, use defaults

      expect(pagination.skip).toBe(0); // (1 - 1) * 20
    });
  });

  // ==================== Response Structure ====================

  describe('PaginatedTransactionResponse', () => {
    it('should return correct paginated response structure', async () => {
      const query: SpendingQueryDto = { period: TimePeriod.MONTH };
      const pagination = new PaginationDto();

      const mockTransactions = [mockTransaction];
      vi.spyOn(transactionRepository, 'findAndCount').mockResolvedValue([
        mockTransactions,
        50,
      ]);

      const result = await service.findAllTransactions(mockUserId, query, pagination);

      expect(result).toHaveProperty('transactions');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
    });

    it('should calculate totalPages correctly', async () => {
      const query: SpendingQueryDto = { period: TimePeriod.MONTH };
      const pagination = new PaginationDto();
      pagination.limit = 10;

      vi.spyOn(transactionRepository, 'findAndCount').mockResolvedValue([[], 45]);

      const result = await service.findAllTransactions(mockUserId, query, pagination);

      expect(result.totalPages).toBe(5); // ceil(45 / 10)
    });

    it('should return correct page number in response', async () => {
      const query: SpendingQueryDto = { period: TimePeriod.MONTH };
      const pagination = new PaginationDto();
      pagination.page = 3;

      vi.spyOn(transactionRepository, 'findAndCount').mockResolvedValue([[], 100]);

      const result = await service.findAllTransactions(mockUserId, query, pagination);

      expect(result.page).toBe(3);
    });
  });

  // ==================== Cache Invalidation ====================

  describe('Cache Invalidation', () => {
    it('should invalidate cache on create mutation', async () => {
      const dto: CreateTransactionDto = {
        categoryId: mockCategoryId,
        amount: 50.5,
        type: TransactionType.EXPENSE,
        description: 'Lunch',
        date: '2025-01-22',
        currency: 'USD',
      };

      vi.spyOn(categoryRepository, 'findOne').mockResolvedValue(mockCategory);
      vi.spyOn(transactionRepository, 'create').mockReturnValue(mockTransaction);
      vi.spyOn(transactionRepository, 'save').mockResolvedValue(mockTransaction);
      vi.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

      await service.createTransaction(mockUserId, dto);

      expect(cacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining(mockUserId),
      );
    });

    it('should invalidate cache on update mutation', async () => {
      const dto: UpdateTransactionDto = { description: 'Updated' };

      vi.spyOn(transactionRepository, 'findOne').mockResolvedValue(mockTransaction);
      vi.spyOn(transactionRepository, 'save').mockResolvedValue(mockTransaction);
      vi.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

      await service.updateTransaction(mockUserId, mockTransactionId, dto);

      expect(cacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining(mockUserId),
      );
    });

    it('should invalidate cache on delete mutation', async () => {
      vi.spyOn(transactionRepository, 'findOne').mockResolvedValue(mockTransaction);
      vi.spyOn(transactionRepository, 'remove').mockResolvedValue(undefined);
      vi.spyOn(cacheManager, 'del').mockResolvedValue(undefined);

      await service.deleteTransaction(mockUserId, mockTransactionId);

      expect(cacheManager.del).toHaveBeenCalledWith(
        expect.stringContaining(mockUserId),
      );
    });
  });
});

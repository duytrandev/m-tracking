import type {
  Category,
  Transaction,
  SpendingSummary,
} from '@/types/api/spending'
import { TimePeriod, TransactionType } from '@/types/api/spending'

// Mock Categories
export const mockCategories: Category[] = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    userId: 'mock-user-id',
    name: 'Food & Dining',
    color: '#FF6B6B',
    icon: 'utensils',
    description: 'Restaurants, groceries, and food delivery',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    userId: 'mock-user-id',
    name: 'Transportation',
    color: '#4ECDC4',
    icon: 'car',
    description: 'Gas, public transit, ride shares, and car maintenance',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    userId: 'mock-user-id',
    name: 'Entertainment',
    color: '#95E1D3',
    icon: 'film',
    description: 'Movies, games, streaming services, and hobbies',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000004',
    userId: 'mock-user-id',
    name: 'Shopping',
    color: '#F38181',
    icon: 'shopping-bag',
    description: 'Clothing, electronics, and general shopping',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000005',
    userId: 'mock-user-id',
    name: 'Healthcare',
    color: '#AA96DA',
    icon: 'heart-pulse',
    description: 'Medical expenses, pharmacy, and health insurance',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    userId: 'mock-user-id',
    name: 'Utilities',
    color: '#FCBAD3',
    icon: 'zap',
    description: 'Electricity, water, internet, and phone bills',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000007',
    userId: 'mock-user-id',
    name: 'Salary',
    color: '#A8E6CF',
    icon: 'briefcase',
    description: 'Monthly salary and wages',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000008',
    userId: 'mock-user-id',
    name: 'Freelance',
    color: '#FFD93D',
    icon: 'laptop',
    description: 'Freelance projects and side income',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000009',
    userId: 'mock-user-id',
    name: 'Housing',
    color: '#6C5CE7',
    icon: 'home',
    description: 'Rent, mortgage, and property maintenance',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '10000000-0000-0000-0000-000000000010',
    userId: 'mock-user-id',
    name: 'Education',
    color: '#74B9FF',
    icon: 'book',
    description: 'Courses, books, and learning materials',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
]

// Helper to generate dates for the past 30 days
const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]!
}

// Mock Transactions
export const mockTransactions: Transaction[] = [
  // Food & Dining
  {
    id: '20000000-0000-0000-0000-000000000001',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000001',
    amount: 45.5,
    type: TransactionType.EXPENSE,
    description: 'Dinner at Italian Restaurant',
    date: getDateDaysAgo(1),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[0]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000002',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000001',
    amount: 85.2,
    type: TransactionType.EXPENSE,
    description: 'Weekly grocery shopping',
    date: getDateDaysAgo(3),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[0]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000003',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000001',
    amount: 25.0,
    type: TransactionType.EXPENSE,
    description: 'Lunch with colleagues',
    date: getDateDaysAgo(5),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[0]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000004',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000001',
    amount: 12.5,
    type: TransactionType.EXPENSE,
    description: 'Coffee shop',
    date: getDateDaysAgo(7),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[0]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000005',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000001',
    amount: 92.3,
    type: TransactionType.EXPENSE,
    description: 'Grocery store',
    date: getDateDaysAgo(10),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[0]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000006',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000001',
    amount: 38.75,
    type: TransactionType.EXPENSE,
    description: 'Thai takeout',
    date: getDateDaysAgo(12),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[0]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000007',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000001',
    amount: 67.4,
    type: TransactionType.EXPENSE,
    description: 'Family dinner',
    date: getDateDaysAgo(15),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[0]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000008',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000001',
    amount: 15.8,
    type: TransactionType.EXPENSE,
    description: 'Breakfast cafe',
    date: getDateDaysAgo(18),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[0]!,
  },

  // Transportation
  {
    id: '20000000-0000-0000-0000-000000000009',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000002',
    amount: 60.0,
    type: TransactionType.EXPENSE,
    description: 'Gas station fill-up',
    date: getDateDaysAgo(2),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[1]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000010',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000002',
    amount: 15.5,
    type: TransactionType.EXPENSE,
    description: 'Uber to airport',
    date: getDateDaysAgo(6),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[1]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000011',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000002',
    amount: 45.0,
    type: TransactionType.EXPENSE,
    description: 'Monthly parking pass',
    date: getDateDaysAgo(9),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[1]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000012',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000002',
    amount: 25.0,
    type: TransactionType.EXPENSE,
    description: 'Car wash',
    date: getDateDaysAgo(14),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[1]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000013',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000002',
    amount: 120.0,
    type: TransactionType.EXPENSE,
    description: 'Oil change and maintenance',
    date: getDateDaysAgo(20),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[1]!,
  },

  // Entertainment
  {
    id: '20000000-0000-0000-0000-000000000014',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000003',
    amount: 15.99,
    type: TransactionType.EXPENSE,
    description: 'Netflix subscription',
    date: getDateDaysAgo(1),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[2]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000015',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000003',
    amount: 45.0,
    type: TransactionType.EXPENSE,
    description: 'Concert tickets',
    date: getDateDaysAgo(8),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[2]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000016',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000003',
    amount: 29.99,
    type: TransactionType.EXPENSE,
    description: 'New video game',
    date: getDateDaysAgo(11),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[2]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000017',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000003',
    amount: 22.5,
    type: TransactionType.EXPENSE,
    description: 'Movie theater',
    date: getDateDaysAgo(16),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[2]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000018',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000003',
    amount: 18.0,
    type: TransactionType.EXPENSE,
    description: 'Spotify Premium',
    date: getDateDaysAgo(19),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[2]!,
  },

  // Shopping
  {
    id: '20000000-0000-0000-0000-000000000019',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000004',
    amount: 89.99,
    type: TransactionType.EXPENSE,
    description: 'New running shoes',
    date: getDateDaysAgo(4),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[3]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000020',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000004',
    amount: 156.5,
    type: TransactionType.EXPENSE,
    description: 'Winter jacket',
    date: getDateDaysAgo(13),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[3]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000021',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000004',
    amount: 34.99,
    type: TransactionType.EXPENSE,
    description: 'Wireless earbuds',
    date: getDateDaysAgo(17),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[3]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000022',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000004',
    amount: 42.0,
    type: TransactionType.EXPENSE,
    description: 'Clothing store',
    date: getDateDaysAgo(22),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[3]!,
  },

  // Healthcare
  {
    id: '20000000-0000-0000-0000-000000000023',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000005',
    amount: 25.0,
    type: TransactionType.EXPENSE,
    description: 'Pharmacy prescription',
    date: getDateDaysAgo(7),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[4]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000024',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000005',
    amount: 150.0,
    type: TransactionType.EXPENSE,
    description: 'Dental checkup',
    date: getDateDaysAgo(21),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[4]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000025',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000005',
    amount: 40.0,
    type: TransactionType.EXPENSE,
    description: 'Vitamins and supplements',
    date: getDateDaysAgo(25),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[4]!,
  },

  // Utilities
  {
    id: '20000000-0000-0000-0000-000000000026',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000006',
    amount: 85.0,
    type: TransactionType.EXPENSE,
    description: 'Electric bill',
    date: getDateDaysAgo(5),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[5]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000027',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000006',
    amount: 65.0,
    type: TransactionType.EXPENSE,
    description: 'Internet service',
    date: getDateDaysAgo(10),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[5]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000028',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000006',
    amount: 45.0,
    type: TransactionType.EXPENSE,
    description: 'Water bill',
    date: getDateDaysAgo(15),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[5]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000029',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000006',
    amount: 55.0,
    type: TransactionType.EXPENSE,
    description: 'Phone bill',
    date: getDateDaysAgo(20),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[5]!,
  },

  // Housing
  {
    id: '20000000-0000-0000-0000-000000000030',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000009',
    amount: 1200.0,
    type: TransactionType.EXPENSE,
    description: 'Monthly rent',
    date: getDateDaysAgo(1),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[8]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000031',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000009',
    amount: 150.0,
    type: TransactionType.EXPENSE,
    description: 'Home insurance',
    date: getDateDaysAgo(15),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[8]!,
  },

  // Education
  {
    id: '20000000-0000-0000-0000-000000000032',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000010',
    amount: 49.99,
    type: TransactionType.EXPENSE,
    description: 'Online course subscription',
    date: getDateDaysAgo(3),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[9]!,
  },
  {
    id: '20000000-0000-0000-0000-000000000033',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000010',
    amount: 35.0,
    type: TransactionType.EXPENSE,
    description: 'Technical books',
    date: getDateDaysAgo(12),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[9]!,
  },

  // Income transactions
  {
    id: '30000000-0000-0000-0000-000000000001',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000007',
    amount: 4500.0,
    type: TransactionType.INCOME,
    description: 'Monthly salary',
    date: getDateDaysAgo(1),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[6]!,
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000008',
    amount: 850.0,
    type: TransactionType.INCOME,
    description: 'Freelance project payment',
    date: getDateDaysAgo(8),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[7]!,
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    userId: 'mock-user-id',
    categoryId: '10000000-0000-0000-0000-000000000008',
    amount: 600.0,
    type: TransactionType.INCOME,
    description: 'Consulting work',
    date: getDateDaysAgo(14),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: mockCategories[7]!,
  },

  // Unknown category transactions (for testing)
  {
    id: '40000000-0000-0000-0000-000000000001',
    userId: 'mock-user-id',
    categoryId: 'unknown',
    amount: 32.5,
    type: TransactionType.EXPENSE,
    description: 'Miscellaneous expense',
    date: getDateDaysAgo(2),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: {
      id: 'unknown',
      userId: 'mock-user-id',
      name: 'Unknown',
      color: '#94A3B8',
      icon: 'help-circle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: '40000000-0000-0000-0000-000000000002',
    userId: 'mock-user-id',
    categoryId: 'unknown',
    amount: 18.75,
    type: TransactionType.EXPENSE,
    description: 'Uncategorized purchase',
    date: getDateDaysAgo(6),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: {
      id: 'unknown',
      userId: 'mock-user-id',
      name: 'Unknown',
      color: '#94A3B8',
      icon: 'help-circle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  {
    id: '40000000-0000-0000-0000-000000000003',
    userId: 'mock-user-id',
    categoryId: 'unknown',
    amount: 45.0,
    type: TransactionType.EXPENSE,
    description: 'Mystery charge',
    date: getDateDaysAgo(11),
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: {
      id: 'unknown',
      userId: 'mock-user-id',
      name: 'Unknown',
      color: '#94A3B8',
      icon: 'help-circle',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
]

// Generate daily trend for the past 30 days
const generateDailyTrend = () => {
  const trend = []
  for (let i = 29; i >= 0; i--) {
    const date = getDateDaysAgo(i)
    const dayTransactions = mockTransactions.filter(t => t.date === date)

    const expense = dayTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0)

    const income = dayTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0)

    trend.push({
      date,
      expense,
      income,
      net: income - expense,
    })
  }
  return trend
}

// Generate category breakdown
const generateCategoryBreakdown = () => {
  const categoryMap = new Map<
    string,
    { category: Category; total: number; count: number }
  >()

  mockTransactions
    .filter(t => t.type === 'expense')
    .forEach(transaction => {
      const existing = categoryMap.get(transaction.categoryId)

      if (existing) {
        existing.total += transaction.amount
        existing.count += 1
      } else {
        categoryMap.set(transaction.categoryId, {
          category: transaction.category,
          total: transaction.amount,
          count: 1,
        })
      }
    })

  const breakdown = Array.from(categoryMap.values())
    .sort((a, b) => b.total - a.total)
    .map(item => ({
      categoryId: item.category.id,
      categoryName: item.category.name,
      categoryColor: item.category.color,
      categoryIcon: item.category.icon,
      total: item.total,
      count: item.count,
      percentage: 0,
    }))

  const totalExpense = breakdown.reduce((sum, item) => sum + item.total, 0)
  breakdown.forEach(item => {
    item.percentage = (item.total / totalExpense) * 100
  })

  return breakdown
}

// Mock Spending Summary
export const mockSpendingSummary: SpendingSummary = {
  period: TimePeriod.MONTH,
  startDate: getDateDaysAgo(29),
  endDate: getDateDaysAgo(0),
  totalExpense: mockTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0),
  totalIncome: mockTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0),
  netBalance:
    mockTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0) -
    mockTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0),
  transactionCount: mockTransactions.length,
  averageExpense:
    mockTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0) /
    mockTransactions.filter(t => t.type === 'expense').length,
  categoryBreakdown: generateCategoryBreakdown(),
  dailyTrend: generateDailyTrend(),
}

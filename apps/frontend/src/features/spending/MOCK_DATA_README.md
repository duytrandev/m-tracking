# Mock Data Documentation

This directory contains mock data for testing and development of the spending tracking features.

## Files

- **`mock-data.ts`** - TypeScript module with typed mock data (used by the application)
- **`mock-data.json`** - JSON version of mock data for reference and testing

## Data Structure

### Categories (11 categories)

| Category | Color | Icon | Type |
|----------|-------|------|------|
| Food & Dining | #FF6B6B | utensils | expense |
| Transportation | #4ECDC4 | car | expense |
| Entertainment | #95E1D3 | film | expense |
| Shopping | #F38181 | shopping-bag | expense |
| Healthcare | #AA96DA | heart-pulse | expense |
| Utilities | #FCBAD3 | zap | expense |
| Salary | #A8E6CF | briefcase | income |
| Freelance | #FFD93D | laptop | income |
| Housing | #6C5CE7 | home | expense |
| Education | #74B9FF | book | expense |
| **Unknown** | #94A3B8 | help-circle | expense |

### Transactions (39 total)

- **36 expense transactions** across 9 categories (including Unknown)
- **3 income transactions** (1 salary, 2 freelance)
- **3 unknown category transactions** for testing
- Date range: Last 30 days from current date
- Total expense: $3,431.19
- Total income: $5,950.00
- Net balance: $2,518.81

### Transaction Distribution by Category

| Category | Count | Total Amount |
|----------|-------|--------------|
| Food & Dining | 8 | $382.45 |
| Transportation | 5 | $265.50 |
| Entertainment | 5 | $131.48 |
| Shopping | 4 | $323.48 |
| Healthcare | 3 | $215.00 |
| Utilities | 4 | $250.00 |
| Housing | 2 | $1,350.00 |
| Education | 2 | $84.99 |
| **Unknown** | **3** | **$96.25** |
| Salary | 1 | $4,500.00 |
| Freelance | 2 | $1,450.00 |

## Usage

### In TypeScript/React Components

```typescript
import { mockCategories, mockTransactions, mockSpendingSummary } from './mock-data'

// Use in components
const categories = mockCategories
const transactions = mockTransactions
const summary = mockSpendingSummary
```

### Enable Mock Data Mode

Set environment variable in `.env.local`:

```bash
NEXT_PUBLIC_USE_MOCK_DATA=true
```

When enabled, the API layer will return mock data instead of making real API calls.

## Testing Scenarios

### Date Range Filtering

The mock data spans 30 days, allowing you to test:
- **Today** - Shows recent transactions
- **Last 7 Days** - Shows 7 most recent transactions
- **Last 30 Days** - Shows all transactions
- **This Month** - Shows current month transactions
- **Custom Range** - Test any date range

### Sorting

Test sorting by:
- **Date** - Ascending (oldest first) / Descending (newest first)
- **Amount** - Ascending (smallest first) / Descending (largest first)

### Transaction Types

- **Income** - Green indicator with up arrow (3 transactions)
- **Expense** - Red indicator with down arrow (33 transactions)

### Categories

Test category color indicators with 10 different colors and icons.

### Empty States

To test empty states, modify the date range to exclude all transactions (e.g., far future dates).

## Mock Data Generation

The TypeScript mock data uses helper functions:

```typescript
// Generate dynamic dates (relative to current date)
const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]!
}

// Generate daily trend for charts
const generateDailyTrend = () => { /* ... */ }

// Generate category breakdown for pie charts
const generateCategoryBreakdown = () => { /* ... */ }
```

## Updating Mock Data

### Adding New Transactions

1. Open `mock-data.ts`
2. Add new transaction to `mockTransactions` array:

```typescript
{
  id: 'unique-uuid',
  userId: 'mock-user-id',
  categoryId: 'category-uuid',
  amount: 100.00,
  type: 'expense' as TransactionType,
  description: 'Transaction description',
  date: getDateDaysAgo(1), // 1 day ago
  currency: 'USD',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  category: mockCategories[0]!, // Reference to category
}
```

3. Update `mock-data.json` with the same data

### Adding New Categories

1. Add to `mockCategories` array
2. Choose a unique color (hex format)
3. Choose an icon name from Lucide React
4. Update `mock-data.json`

## Data Integrity

- All transaction IDs start with:
  - `20000000-` (regular expenses)
  - `30000000-` (income)
  - `40000000-` (unknown category expenses)
- All category IDs start with `10000000-` or `unknown`
- Each transaction references a valid category (or "unknown")
- Dates are in ISO format (YYYY-MM-DD)
- Amounts are positive numbers (type determines income/expense)

## Unknown Category

The "Unknown" category is used for transactions without a valid category assignment:

```typescript
{
  id: 'unknown',
  name: 'Unknown',
  color: '#94A3B8',  // Slate gray
  icon: 'help-circle'
}
```

**Use Cases:**
- Testing uncategorized transactions
- Handling imported data without category mapping
- Transactions pending categorization
- System-generated transactions

**Visual Indicators:**
- Gray color badge
- Help circle icon (?)
- Distinguishable from regular categories

## API Integration

When `NEXT_PUBLIC_USE_MOCK_DATA=true`, the following API methods return mock data:

```typescript
spendingApi.getAllTransactions(query) // Returns mockTransactions
spendingApi.getAllCategories() // Returns mockCategories
spendingApi.getSpendingSummary(query) // Returns mockSpendingSummary
```

## Notes

- Mock data is automatically generated with dates relative to the current date
- The `getDateDaysAgo()` function ensures dates are always recent
- Daily trend and category breakdown are computed from transactions
- Summary statistics are calculated dynamically

## Example Transactions

### Largest Expense
- Monthly rent: $1,200.00 (Housing)

### Smallest Expense
- Coffee shop: $12.50 (Food & Dining)

### Income Examples
- Monthly salary: $4,500.00 (Salary)
- Freelance project: $850.00 (Freelance)
- Consulting work: $600.00 (Freelance)

### Common Transactions
- Groceries: $85.20 - $92.30
- Gas fill-up: $60.00
- Utilities: $45.00 - $85.00
- Entertainment: $15.99 - $45.00

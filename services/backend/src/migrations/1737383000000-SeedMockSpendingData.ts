import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedMockSpendingData1737383000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get the first user from the users table to associate data with
    const users = await queryRunner.query(`SELECT id FROM users LIMIT 1`);

    if (users.length === 0) {
      console.log('No users found. Skipping spending data seed.');
      return;
    }

    const userId = users[0].id;
    console.log(`Seeding spending data for user: ${userId}`);

    // Create categories with various icons and colors
    await queryRunner.query(`
      INSERT INTO categories (id, user_id, name, color, icon, description) VALUES
      ('10000000-0000-0000-0000-000000000001', '${userId}', 'Food & Dining', '#FF6B6B', 'utensils', 'Restaurants, groceries, and food delivery'),
      ('10000000-0000-0000-0000-000000000002', '${userId}', 'Transportation', '#4ECDC4', 'car', 'Gas, public transit, ride shares, and car maintenance'),
      ('10000000-0000-0000-0000-000000000003', '${userId}', 'Entertainment', '#95E1D3', 'film', 'Movies, games, streaming services, and hobbies'),
      ('10000000-0000-0000-0000-000000000004', '${userId}', 'Shopping', '#F38181', 'shopping-bag', 'Clothing, electronics, and general shopping'),
      ('10000000-0000-0000-0000-000000000005', '${userId}', 'Healthcare', '#AA96DA', 'heart-pulse', 'Medical expenses, pharmacy, and health insurance'),
      ('10000000-0000-0000-0000-000000000006', '${userId}', 'Utilities', '#FCBAD3', 'zap', 'Electricity, water, internet, and phone bills'),
      ('10000000-0000-0000-0000-000000000007', '${userId}', 'Salary', '#A8E6CF', 'briefcase', 'Monthly salary and wages'),
      ('10000000-0000-0000-0000-000000000008', '${userId}', 'Freelance', '#FFD93D', 'laptop', 'Freelance projects and side income'),
      ('10000000-0000-0000-0000-000000000009', '${userId}', 'Housing', '#6C5CE7', 'home', 'Rent, mortgage, and property maintenance'),
      ('10000000-0000-0000-0000-000000000010', '${userId}', 'Education', '#74B9FF', 'book', 'Courses, books, and learning materials')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Generate transactions for the past 30 days
    const transactions: string[] = [];
    const today = new Date();

    // Sample expense transactions
    const expenseData = [
      // Food & Dining
      { categoryId: '10000000-0000-0000-0000-000000000001', amount: 45.50, description: 'Dinner at Italian Restaurant', daysAgo: 1 },
      { categoryId: '10000000-0000-0000-0000-000000000001', amount: 85.20, description: 'Weekly grocery shopping', daysAgo: 3 },
      { categoryId: '10000000-0000-0000-0000-000000000001', amount: 25.00, description: 'Lunch with colleagues', daysAgo: 5 },
      { categoryId: '10000000-0000-0000-0000-000000000001', amount: 12.50, description: 'Coffee shop', daysAgo: 7 },
      { categoryId: '10000000-0000-0000-0000-000000000001', amount: 92.30, description: 'Grocery store', daysAgo: 10 },
      { categoryId: '10000000-0000-0000-0000-000000000001', amount: 38.75, description: 'Thai takeout', daysAgo: 12 },
      { categoryId: '10000000-0000-0000-0000-000000000001', amount: 67.40, description: 'Family dinner', daysAgo: 15 },
      { categoryId: '10000000-0000-0000-0000-000000000001', amount: 15.80, description: 'Breakfast cafe', daysAgo: 18 },

      // Transportation
      { categoryId: '10000000-0000-0000-0000-000000000002', amount: 60.00, description: 'Gas station fill-up', daysAgo: 2 },
      { categoryId: '10000000-0000-0000-0000-000000000002', amount: 15.50, description: 'Uber to airport', daysAgo: 6 },
      { categoryId: '10000000-0000-0000-0000-000000000002', amount: 45.00, description: 'Monthly parking pass', daysAgo: 9 },
      { categoryId: '10000000-0000-0000-0000-000000000002', amount: 25.00, description: 'Car wash', daysAgo: 14 },
      { categoryId: '10000000-0000-0000-0000-000000000002', amount: 120.00, description: 'Oil change and maintenance', daysAgo: 20 },

      // Entertainment
      { categoryId: '10000000-0000-0000-0000-000000000003', amount: 15.99, description: 'Netflix subscription', daysAgo: 1 },
      { categoryId: '10000000-0000-0000-0000-000000000003', amount: 45.00, description: 'Concert tickets', daysAgo: 8 },
      { categoryId: '10000000-0000-0000-0000-000000000003', amount: 29.99, description: 'New video game', daysAgo: 11 },
      { categoryId: '10000000-0000-0000-0000-000000000003', amount: 22.50, description: 'Movie theater', daysAgo: 16 },
      { categoryId: '10000000-0000-0000-0000-000000000003', amount: 18.00, description: 'Spotify Premium', daysAgo: 19 },

      // Shopping
      { categoryId: '10000000-0000-0000-0000-000000000004', amount: 89.99, description: 'New running shoes', daysAgo: 4 },
      { categoryId: '10000000-0000-0000-0000-000000000004', amount: 156.50, description: 'Winter jacket', daysAgo: 13 },
      { categoryId: '10000000-0000-0000-0000-000000000004', amount: 34.99, description: 'Wireless earbuds', daysAgo: 17 },
      { categoryId: '10000000-0000-0000-0000-000000000004', amount: 42.00, description: 'Clothing store', daysAgo: 22 },

      // Healthcare
      { categoryId: '10000000-0000-0000-0000-000000000005', amount: 25.00, description: 'Pharmacy prescription', daysAgo: 7 },
      { categoryId: '10000000-0000-0000-0000-000000000005', amount: 150.00, description: 'Dental checkup', daysAgo: 21 },
      { categoryId: '10000000-0000-0000-0000-000000000005', amount: 40.00, description: 'Vitamins and supplements', daysAgo: 25 },

      // Utilities
      { categoryId: '10000000-0000-0000-0000-000000000006', amount: 85.00, description: 'Electric bill', daysAgo: 5 },
      { categoryId: '10000000-0000-0000-0000-000000000006', amount: 65.00, description: 'Internet service', daysAgo: 10 },
      { categoryId: '10000000-0000-0000-0000-000000000006', amount: 45.00, description: 'Water bill', daysAgo: 15 },
      { categoryId: '10000000-0000-0000-0000-000000000006', amount: 55.00, description: 'Phone bill', daysAgo: 20 },

      // Housing
      { categoryId: '10000000-0000-0000-0000-000000000009', amount: 1200.00, description: 'Monthly rent', daysAgo: 1 },
      { categoryId: '10000000-0000-0000-0000-000000000009', amount: 150.00, description: 'Home insurance', daysAgo: 15 },

      // Education
      { categoryId: '10000000-0000-0000-0000-000000000010', amount: 49.99, description: 'Online course subscription', daysAgo: 3 },
      { categoryId: '10000000-0000-0000-0000-000000000010', amount: 35.00, description: 'Technical books', daysAgo: 12 },
    ];

    // Sample income transactions
    const incomeData = [
      { categoryId: '10000000-0000-0000-0000-000000000007', amount: 4500.00, description: 'Monthly salary', daysAgo: 1 },
      { categoryId: '10000000-0000-0000-0000-000000000008', amount: 850.00, description: 'Freelance project payment', daysAgo: 8 },
      { categoryId: '10000000-0000-0000-0000-000000000008', amount: 600.00, description: 'Consulting work', daysAgo: 14 },
    ];

    // Generate expense transaction inserts
    expenseData.forEach((tx, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - tx.daysAgo);
      const dateStr = date.toISOString().split('T')[0];

      transactions.push(`(
        '20000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}',
        '${userId}',
        '${tx.categoryId}',
        ${tx.amount},
        'expense',
        '${tx.description}',
        '${dateStr}',
        'USD',
        NULL
      )`);
    });

    // Generate income transaction inserts
    incomeData.forEach((tx, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - tx.daysAgo);
      const dateStr = date.toISOString().split('T')[0];

      transactions.push(`(
        '30000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}',
        '${userId}',
        '${tx.categoryId}',
        ${tx.amount},
        'income',
        '${tx.description}',
        '${dateStr}',
        'USD',
        NULL
      )`);
    });

    // Insert all transactions
    if (transactions.length > 0) {
      await queryRunner.query(`
        INSERT INTO transactions (id, user_id, category_id, amount, type, description, date, currency, notes) VALUES
        ${transactions.join(',\n')}
        ON CONFLICT (id) DO NOTHING;
      `);
    }

    console.log(`Successfully seeded ${transactions.length} transactions across 10 categories`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete seeded transactions
    await queryRunner.query(`
      DELETE FROM transactions
      WHERE id LIKE '20000000-0000-0000-0000-%'
         OR id LIKE '30000000-0000-0000-0000-%';
    `);

    // Delete seeded categories
    await queryRunner.query(`
      DELETE FROM categories
      WHERE id LIKE '10000000-0000-0000-0000-%';
    `);

    console.log('Reverted mock spending data seed');
  }
}

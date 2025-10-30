// Simple seed test script
import { seedDatabase } from '../lib/mock-data/seed.js';

async function main() {
  console.log('🌱 Starting database seeding...');
  try {
    const result = await seedDatabase();
    console.log('✅ Seeding completed:', result);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();

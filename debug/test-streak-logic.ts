import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface TestScenario {
  name: string;
  initialStreakDays: number;
  hoursAgo: number;
  expectedStreakDays: number;
}

async function setupTestUser() {
  // Clean up any existing test user
  await prisma.user.deleteMany({
    where: { email: 'streak-test@example.com' },
  });

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'streak-test@example.com',
      username: 'streak-tester',
      password: hashedPassword,
      totalScore: 0,
      currentLevel: 1,
      streakDays: 0,
      lastPlayedAt: null,
      subscription: 'PRO',
    },
  });

  console.log('✓ Test user created:', user.id);
  return user;
}

async function createTestPuzzle(index: number) {
  // Check if puzzle already exists
  const existing = await prisma.puzzle.findFirst({
    where: { title: `Test Puzzle ${index}` },
  });

  if (existing) {
    return existing;
  }

  const puzzle = await prisma.puzzle.create({
    data: {
      title: `Test Puzzle ${index}`,
      description: 'Test puzzle for streak logic',
      difficulty: 'EASY',
      gameMode: 'CHALLENGE',
      initialCode: 'function test() { return true; }',
      solution: 'function test() { return true; }',
      testCases: [
        {
          input: '[]',
          expectedOutput: 'true',
        },
      ],
      hints: ['This is a test hint'],
      maxScore: 100,
      order: index,
    },
  });

  return puzzle;
}

async function simulatePuzzleCompletion(
  userId: string,
  puzzleId: string,
  hoursAgo: number,
) {
  const now = new Date();
  const completionTime = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

  // Create progress entry
  const progress = await prisma.userProgress.create({
    data: {
      userId,
      puzzleId,
      completed: true,
      completedAt: completionTime,
      score: 100,
      timeSpent: 300,
      hintsUsed: 0,
    },
  });

  // Manually update user stats as if this happened at the completion time
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totalScore: true,
      currentLevel: true,
      lastPlayedAt: true,
      streakDays: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  let newStreakDays = user.streakDays;

  if (user.lastPlayedAt) {
    const lastPlayed = new Date(user.lastPlayedAt);
    const elapsedHours =
      (completionTime.getTime() - lastPlayed.getTime()) / (1000 * 60 * 60);

    if (elapsedHours > 24) {
      newStreakDays = 1; // Reset if >24h elapsed
    } else {
      newStreakDays = user.streakDays + 1; // Increment within 24h
    }
  } else {
    newStreakDays = 1; // First play
  }

  // Get completed count for level calculation
  const completedCount = await prisma.userProgress.count({
    where: { userId, completed: true },
  });

  const newLevel = Math.floor(completedCount / 5) + 1;

  await prisma.user.update({
    where: { id: userId },
    data: {
      totalScore: user.totalScore + 100,
      currentLevel: Math.max(user.currentLevel, newLevel),
      lastPlayedAt: completionTime,
      streakDays: newStreakDays,
    },
  });

  return newStreakDays;
}

async function runTestScenario(
  userId: string,
  scenario: TestScenario,
  puzzleIndex: number,
) {
  console.log(`\n📝 Testing: ${scenario.name}`);
  console.log(`   Initial streak: ${scenario.initialStreakDays}`);
  console.log(`   Time since last play: ${scenario.hoursAgo} hours`);
  console.log(`   Expected streak: ${scenario.expectedStreakDays}`);

  // Set initial streak
  await prisma.user.update({
    where: { id: userId },
    data: {
      streakDays: scenario.initialStreakDays,
    },
  });

  // Create puzzle
  const puzzle = await createTestPuzzle(puzzleIndex);

  // Simulate completion
  const actualStreakDays = await simulatePuzzleCompletion(
    userId,
    puzzle.id,
    scenario.hoursAgo,
  );

  // Verify result
  const passed = actualStreakDays === scenario.expectedStreakDays;
  if (passed) {
    console.log(
      `   ✅ PASS: Streak is ${actualStreakDays} (expected ${scenario.expectedStreakDays})`,
    );
  } else {
    console.log(
      `   ❌ FAIL: Streak is ${actualStreakDays} (expected ${scenario.expectedStreakDays})`,
    );
  }

  return passed;
}

async function main() {
  console.log('🧪 Testing Streak Logic (24-Hour Based)\n');
  console.log('='.repeat(60));

  try {
    // Setup
    const user = await setupTestUser();

    // Test scenarios
    const scenarios: TestScenario[] = [
      {
        name: 'First puzzle completion',
        initialStreakDays: 0,
        hoursAgo: 0,
        expectedStreakDays: 1,
      },
      {
        name: 'Completion within 1 hour',
        initialStreakDays: 5,
        hoursAgo: 1,
        expectedStreakDays: 6,
      },
      {
        name: 'Completion within 12 hours',
        initialStreakDays: 10,
        hoursAgo: 12,
        expectedStreakDays: 11,
      },
      {
        name: 'Completion within 23 hours',
        initialStreakDays: 7,
        hoursAgo: 23,
        expectedStreakDays: 8,
      },
      {
        name: 'Completion at exactly 24 hours (should increment)',
        initialStreakDays: 15,
        hoursAgo: 24,
        expectedStreakDays: 16,
      },
      {
        name: 'Completion after 25 hours (should reset)',
        initialStreakDays: 20,
        hoursAgo: 25,
        expectedStreakDays: 1,
      },
      {
        name: 'Completion after 48 hours (should reset)',
        initialStreakDays: 30,
        hoursAgo: 48,
        expectedStreakDays: 1,
      },
      {
        name: 'Completion after 72 hours (should reset)',
        initialStreakDays: 50,
        hoursAgo: 72,
        expectedStreakDays: 1,
      },
    ];

    // Run all scenarios
    let passedCount = 0;
    for (let i = 0; i < scenarios.length; i++) {
      const passed = await runTestScenario(user.id, scenarios[i], i + 1);
      if (passed) passedCount++;

      // Clean up progress for next test
      await prisma.userProgress.deleteMany({
        where: { userId: user.id },
      });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Test Results: ${passedCount}/${scenarios.length} passed`);

    if (passedCount === scenarios.length) {
      console.log('✅ All tests passed!');
    } else {
      console.log(
        `❌ ${scenarios.length - passedCount} test(s) failed. Review the logic.`,
      );
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.userProgress.deleteMany({
      where: { userId: user.id },
    });
    await prisma.user.delete({
      where: { id: user.id },
    });
    await prisma.puzzle.deleteMany({
      where: { title: { startsWith: 'Test Puzzle' } },
    });
    console.log('✓ Cleanup complete');
  } catch (error) {
    console.error('\n❌ Error running tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the tests
main()
  .then(() => {
    console.log('\n✨ Test suite completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });

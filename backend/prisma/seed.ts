import { PrismaClient, GameMode, Difficulty, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { encodeCipherText } from '@code-of-life/shared';

const prisma = new PrismaClient();

interface PuzzleSeed {
  title: string;
  originalReflection: string;
  gameMode: GameMode;
  difficulty: Difficulty;
  bookChapter?: number;
  bookSection?: string;
  hints: string[];
}

/**
 * 25 Life Lesson Puzzles
 */
const puzzles: PuzzleSeed[] = [
  // STORY MODE - BEGINNER (6 puzzles)
  {
    title: 'The First Step',
    originalReflection: 'Every journey begins with a single step.',
    gameMode: 'STORY',
    difficulty: 'BEGINNER',
    bookChapter: 1,
    bookSection: 'Introduction',
    hints: ['Think about beginnings', 'A famous quote about journeys'],
  },
  {
    title: 'Inner Light',
    originalReflection: 'The light you seek is already within you.',
    gameMode: 'STORY',
    difficulty: 'BEGINNER',
    bookChapter: 1,
    bookSection: 'Self-Discovery',
    hints: ['Look inward', 'You have everything you need'],
  },
  {
    title: 'Present Moment',
    originalReflection: 'Now is the only moment that truly exists.',
    gameMode: 'STORY',
    difficulty: 'BEGINNER',
    bookChapter: 2,
    bookSection: 'Mindfulness',
    hints: ['About time', 'Living in the present'],
  },
  {
    title: 'Kindness Returns',
    originalReflection: 'What you give to others returns to you.',
    gameMode: 'STORY',
    difficulty: 'BEGINNER',
    bookChapter: 2,
    bookSection: 'Compassion',
    hints: ['About giving', 'Karma-like concept'],
  },
  {
    title: 'Change Within',
    originalReflection: 'To change the world, first change yourself.',
    gameMode: 'STORY',
    difficulty: 'BEGINNER',
    bookChapter: 3,
    bookSection: 'Transformation',
    hints: ['About personal change', 'Gandhi-inspired wisdom'],
  },
  {
    title: 'Silent Wisdom',
    originalReflection: 'In silence, wisdom speaks the loudest.',
    gameMode: 'STORY',
    difficulty: 'BEGINNER',
    bookChapter: 3,
    bookSection: 'Meditation',
    hints: ['About quietness', 'Listening to inner voice'],
  },

  // STORY MODE - INTERMEDIATE (5 puzzles)
  {
    title: 'Fear and Growth',
    originalReflection: 'Fear is the boundary where growth begins.',
    gameMode: 'STORY',
    difficulty: 'INTERMEDIATE',
    bookChapter: 4,
    bookSection: 'Courage',
    hints: ['About facing fears', 'Growth requires discomfort'],
  },
  {
    title: 'Patience Rewarded',
    originalReflection: 'Great things take time to unfold beautifully.',
    gameMode: 'STORY',
    difficulty: 'INTERMEDIATE',
    bookChapter: 4,
    bookSection: 'Patience',
    hints: ['About waiting', 'Nature takes its time'],
  },
  {
    title: 'True Strength',
    originalReflection: 'True strength lies in gentle persistence.',
    gameMode: 'STORY',
    difficulty: 'INTERMEDIATE',
    bookChapter: 5,
    bookSection: 'Resilience',
    hints: ['Not about force', 'Soft power'],
  },
  {
    title: 'Impermanence',
    originalReflection: 'Nothing lasts forever, treasure each moment.',
    gameMode: 'STORY',
    difficulty: 'INTERMEDIATE',
    bookChapter: 5,
    bookSection: 'Acceptance',
    hints: ['Buddhist concept', 'About change'],
  },
  {
    title: 'Self Acceptance',
    originalReflection: 'Accept yourself fully before seeking change.',
    gameMode: 'STORY',
    difficulty: 'INTERMEDIATE',
    bookChapter: 6,
    bookSection: 'Self-Love',
    hints: ['Love yourself first', 'Foundation for growth'],
  },

  // STORY MODE - ADVANCED (3 puzzles)
  {
    title: 'Connected Lives',
    originalReflection:
      'We are all connected by invisible threads of shared humanity.',
    gameMode: 'STORY',
    difficulty: 'ADVANCED',
    bookChapter: 7,
    bookSection: 'Unity',
    hints: ['About connection', 'We are not alone'],
  },
  {
    title: 'Purpose Discovery',
    originalReflection:
      'Your purpose reveals itself through consistent action and reflection.',
    gameMode: 'STORY',
    difficulty: 'ADVANCED',
    bookChapter: 7,
    bookSection: 'Purpose',
    hints: ['Finding meaning', 'Action leads to clarity'],
  },
  {
    title: 'Gratitude Practice',
    originalReflection:
      'Gratitude transforms ordinary moments into extraordinary blessings.',
    gameMode: 'STORY',
    difficulty: 'ADVANCED',
    bookChapter: 8,
    bookSection: 'Thankfulness',
    hints: ['About appreciation', 'Seeing the good'],
  },

  // STORY MODE - MASTER (1 puzzle)
  {
    title: 'Legacy Building',
    originalReflection:
      'The seeds you plant today become the forests that shelter future generations.',
    gameMode: 'STORY',
    difficulty: 'MASTER',
    bookChapter: 10,
    bookSection: 'Legacy',
    hints: ['Long-term thinking', 'Impact on others'],
  },

  // CHALLENGE MODE - ADVANCED (3 puzzles)
  {
    title: 'Time Challenge',
    originalReflection:
      'Yesterday is history, tomorrow is mystery, today is a gift.',
    gameMode: 'CHALLENGE',
    difficulty: 'ADVANCED',
    hints: ['Famous quote', 'About the present moment'],
  },
  {
    title: 'Balance Master',
    originalReflection:
      'Balance is not standing still but moving gracefully through change.',
    gameMode: 'CHALLENGE',
    difficulty: 'ADVANCED',
    hints: ['Dynamic equilibrium', 'Like a dancer'],
  },
  {
    title: 'Wisdom Seeker',
    originalReflection:
      'The wise know that true knowledge begins with admitting ignorance.',
    gameMode: 'CHALLENGE',
    difficulty: 'ADVANCED',
    hints: ['Socratic wisdom', 'Humility in learning'],
  },

  // CHALLENGE MODE - MASTER (2 puzzles)
  {
    title: 'Resilience Test',
    originalReflection:
      'Fall seven times, stand up eight times, each rise stronger than before.',
    gameMode: 'CHALLENGE',
    difficulty: 'MASTER',
    hints: ['Japanese proverb', 'About perseverance'],
  },
  {
    title: 'Ultimate Truth',
    originalReflection:
      'The ultimate truth cannot be spoken, only experienced in silent knowing.',
    gameMode: 'CHALLENGE',
    difficulty: 'MASTER',
    hints: ['Beyond words', 'Mystical insight'],
  },

  // DAILY MODE - INTERMEDIATE (3 puzzles)
  {
    title: 'Daily Sunrise',
    originalReflection: 'Every sunrise brings new possibilities to embrace.',
    gameMode: 'DAILY',
    difficulty: 'INTERMEDIATE',
    hints: ['New beginnings', 'Morning inspiration'],
  },
  {
    title: 'Ripple Effect',
    originalReflection:
      'Small acts of kindness ripple across the universe endlessly.',
    gameMode: 'DAILY',
    difficulty: 'INTERMEDIATE',
    hints: ['Butterfly effect', 'Kindness matters'],
  },
  {
    title: 'Mind Power',
    originalReflection:
      'Your thoughts shape your reality more than circumstances ever will.',
    gameMode: 'DAILY',
    difficulty: 'INTERMEDIATE',
    hints: ['Power of thought', 'Mental strength'],
  },

  // DAILY MODE - ADVANCED (1 puzzle)
  {
    title: 'Inner Peace',
    originalReflection:
      'Peace comes not from having everything but from being content with now.',
    gameMode: 'DAILY',
    difficulty: 'ADVANCED',
    hints: ['Contentment', 'Not about possessions'],
  },

  // DAILY MODE - MASTER (1 puzzle)
  {
    title: 'The Journey Inward',
    originalReflection:
      'The journey inward is the greatest adventure of all, leading to infinite discovery.',
    gameMode: 'DAILY',
    difficulty: 'MASTER',
    hints: ['Self-exploration', 'Inner world'],
  },
];

async function main() {
  console.log('Starting seed...');

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  await prisma.user.upsert({
    where: { email: 'admin@codeoflife.dev' },
    update: {
      role: Role.ADMIN,
    },
    create: {
      email: 'admin@codeoflife.dev',
      username: 'admin',
      password: await bcrypt.hash(adminPassword, 12),
      role: Role.ADMIN,
    },
  });
  console.log('Seeded admin user: admin@codeoflife.dev');

  // Reset progress first because it depends on seeded puzzle rows.
  await prisma.userProgress.deleteMany();
  await prisma.puzzle.deleteMany();
  console.log('Cleared existing user progress and puzzles');

  // Create puzzles with encoded patterns
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let dailyIndex = 0;

  for (let i = 0; i < puzzles.length; i++) {
    const puzzle = puzzles[i];
    const encryptedPattern = encodeCipherText(puzzle.originalReflection).output;

    // For DAILY mode, schedule for upcoming days
    let scheduledDate: Date | null = null;
    if (puzzle.gameMode === 'DAILY') {
      scheduledDate = new Date(today);
      scheduledDate.setDate(scheduledDate.getDate() + dailyIndex);
      dailyIndex++;
    }

    await prisma.puzzle.create({
      data: {
        title: puzzle.title,
        encryptedPattern,
        originalReflection: puzzle.originalReflection,
        gameMode: puzzle.gameMode,
        difficulty: puzzle.difficulty,
        orderIndex: i + 1,
        bookChapter: puzzle.bookChapter ?? null,
        bookSection: puzzle.bookSection ?? null,
        hints: puzzle.hints,
        scheduledDate,
      },
    });

    console.log(`Created puzzle ${i + 1}: ${puzzle.title}`);
  }

  console.log(`\nSeeding complete! Created ${puzzles.length} puzzles.`);
  console.log('Distribution:');
  console.log('- STORY mode: 15 puzzles');
  console.log('- CHALLENGE mode: 5 puzzles');
  console.log('- DAILY mode: 5 puzzles (scheduled for next 5 days)');

  const persistedPuzzles = await prisma.puzzle.findMany({
    select: { encryptedPattern: true },
  });
  const invalidPatterns = persistedPuzzles.filter(
    ({ encryptedPattern }) => !/^[0-9 ]+$/.test(encryptedPattern),
  );

  if (
    persistedPuzzles.length !== puzzles.length ||
    invalidPatterns.length > 0
  ) {
    throw new Error(
      `Seed verification failed. Expected ${puzzles.length} numeric patterns, found ${persistedPuzzles.length} rows and ${invalidPatterns.length} invalid patterns.`,
    );
  }

  console.log('Verified all seeded puzzle patterns are numeric.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

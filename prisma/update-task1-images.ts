/**
 * Targeted update script — patches imageUrl and isActive on academic Task 1 questions
 * by reading directly from the source-of-truth data file.
 * Does NOT delete or touch any user data (submissions, progress, feedback, etc.)
 *
 * Run with: pnpm db:update-task1-images
 */

import { PrismaClient } from '@prisma/client';
import { task1Questions } from '../data/task1-questions';

const prisma = new PrismaClient();

async function main() {
  const academicTask1 = task1Questions.filter((q) => q.examType === 'ACADEMIC');

  console.log(`Updating ${academicTask1.length} academic Task 1 questions...`);

  for (const q of academicTask1) {
    const imageUrl = typeof q.imageUrl === 'string' ? q.imageUrl : null;
    const isActive = 'isActive' in q ? (q as any).isActive : imageUrl !== null;

    const result = await prisma.writingQuestion.updateMany({
      where: { id: q.id },
      data: { imageUrl, isActive },
    });

    if (result.count === 0) {
      console.warn(`  ⚠️  Not found in DB: ${q.id}`);
    } else {
      console.log(`  ✓ ${q.id} → imageUrl=${imageUrl ? 'S3' : 'null'}, isActive=${isActive}`);
    }
  }

  console.log('\nDone. No user data was modified.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

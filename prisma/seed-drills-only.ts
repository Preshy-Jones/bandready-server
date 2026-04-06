import { PrismaClient } from '@prisma/client';
import { grammarDrills } from '../data/grammar-drills';
import { vocabularyDrills } from '../data/vocabulary-drills';
import { coherenceDrills } from '../data/coherence-drills';
import { taskResponseDrills } from '../data/task-response-drills';

const prisma = new PrismaClient();

async function main() {
  const allDrills = [
    ...grammarDrills,
    ...vocabularyDrills,
    ...coherenceDrills,
    ...taskResponseDrills,
  ];

  console.log('🗑️  Clearing existing drill data...');
  await prisma.drillReviewQueue.deleteMany();
  await prisma.drillAttempt.deleteMany();
  await prisma.writingDrill.deleteMany();
  console.log('✓ Cleared drill_review_queue, drill_attempts, writing_drills');

  console.log(`📦 Inserting ${allDrills.length} drills...`);
  const result = await prisma.writingDrill.createMany({
    data: allDrills.map((d) => ({
      id: d.id,
      type: d.type as any,
      category: d.category as any,
      specificSkill: d.specificSkill,
      instruction: d.instruction,
      content: d.content,
      correctAnswer: d.correctAnswer,
      explanation: d.explanation,
      difficulty: d.difficulty as any,
      timeLimit: d.timeLimit ?? null,
      relatedWeaknesses: d.relatedWeaknesses ?? [],
      isActive: true,
    })),
  });

  console.log(`✅ Inserted ${result.count} drills`);
}

main()
  .catch((e) => {
    console.error('❌ Drill seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

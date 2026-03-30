import { PrismaClient, ReadingDifficulty, ReadingTestType, ReadingQuestionType } from '@prisma/client';
import { allReadingPassages } from '../data/reading-passages';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reading module data...');

  // Check if reading passages already exist (idempotent)
  const existingCount = await prisma.readingPassage.count();
  if (existingCount > 0) {
    console.log(`Skipping reading seed — ${existingCount} passages already exist`);
    return;
  }

  let totalPassages = 0;
  let totalQuestions = 0;

  for (const passageData of allReadingPassages) {
    await prisma.$transaction(async (tx) => {
      // 1. Create the passage
      const passage = await tx.readingPassage.create({
        data: {
          title: passageData.title,
          content: passageData.content,
          wordCount: passageData.wordCount,
          difficultyLevel: passageData.difficultyLevel as ReadingDifficulty,
          testType: passageData.testType as ReadingTestType,
          topicCategory: passageData.topicCategory,
          sourceAttribution: passageData.sourceAttribution ?? null,
          vocabularyTerms: passageData.vocabularyTerms ?? undefined,
          isActive: true,
        },
      });

      // 2. Create paragraphs
      for (let i = 0; i < passageData.paragraphs.length; i++) {
        const para = passageData.paragraphs[i];
        await tx.passageParagraph.create({
          data: {
            passageId: passage.id,
            paragraphIndex: i,
            label: para.label,
            content: para.content,
          },
        });
      }

      // 3. Create question sets and questions
      let questionNumberOffset = 0;
      for (const setData of passageData.questionSets) {
        const questions = setData.questions;
        const rangeStart = questions[0]?.questionNumber ?? questionNumberOffset + 1;
        const rangeEnd = questions[questions.length - 1]?.questionNumber ?? rangeStart;

        const questionSet = await tx.readingQuestionSet.create({
          data: {
            passageId: passage.id,
            questionType: setData.questionType as ReadingQuestionType,
            instructions: setData.instructions,
            questionRangeStart: rangeStart,
            questionRangeEnd: rangeEnd,
            setData: setData.setData ?? undefined,
          },
        });

        for (const q of questions) {
          await tx.readingQuestion.create({
            data: {
              passageId: passage.id,
              questionSetId: questionSet.id,
              questionType: setData.questionType as ReadingQuestionType,
              questionNumber: q.questionNumber,
              questionData: q.questionData,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation ?? null,
              skillTested: q.skillTested ?? null,
            },
          });
          totalQuestions++;
        }

        questionNumberOffset = rangeEnd;
      }

      totalPassages++;
    });
  }

  console.log(`Created ${totalPassages} reading passages with ${totalQuestions} questions`);
}

main()
  .catch((e) => {
    console.error('Reading seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

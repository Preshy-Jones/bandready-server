import { PrismaClient } from '@prisma/client';
import { task1Questions } from '../data/task1-questions';
import { task2Questions } from '../data/task2-questions';
import { grammarDrills } from '../data/grammar-drills';
import { vocabularyDrills } from '../data/vocabulary-drills';
import { coherenceDrills } from '../data/coherence-drills';

const prisma = new PrismaClient();

// Official IELTS Speaking Questions sourced from Cambridge IELTS, British Council, and IELTS.org
// These are authentic question types used in the IELTS Speaking Test

const part1Questions = [
  // Topic: Hometown
  { topic: 'Hometown', questionText: 'Where is your hometown?', difficultyLevel: 'easy' },
  { topic: 'Hometown', questionText: 'What do you like about your hometown?', difficultyLevel: 'easy' },
  { topic: 'Hometown', questionText: 'Is there anything you dislike about your hometown?', difficultyLevel: 'medium' },
  { topic: 'Hometown', questionText: 'How long have you lived in your hometown?', difficultyLevel: 'easy' },
  { topic: 'Hometown', questionText: 'Do you think you will continue to live there for a long time?', difficultyLevel: 'medium' },
  
  // Topic: Accommodation
  { topic: 'Accommodation', questionText: 'Tell me about the kind of accommodation you live in.', difficultyLevel: 'easy' },
  { topic: 'Accommodation', questionText: 'How long have you lived there?', difficultyLevel: 'easy' },
  { topic: 'Accommodation', questionText: 'What do you like about living there?', difficultyLevel: 'medium' },
  { topic: 'Accommodation', questionText: 'What sort of accommodation would you most like to live in?', difficultyLevel: 'medium' },
  
  // Topic: Work
  { topic: 'Work', questionText: 'What is your job?', difficultyLevel: 'easy' },
  { topic: 'Work', questionText: 'Where do you work?', difficultyLevel: 'easy' },
  { topic: 'Work', questionText: 'Why did you choose that job?', difficultyLevel: 'medium' },
  { topic: 'Work', questionText: 'Do you like your job? Why or why not?', difficultyLevel: 'medium' },
  { topic: 'Work', questionText: 'Is there anything you would like to change about your job?', difficultyLevel: 'hard' },
  
  // Topic: Studies
  { topic: 'Studies', questionText: 'What do you study?', difficultyLevel: 'easy' },
  { topic: 'Studies', questionText: 'Where do you study?', difficultyLevel: 'easy' },
  { topic: 'Studies', questionText: 'Why did you choose that subject?', difficultyLevel: 'medium' },
  { topic: 'Studies', questionText: 'Is it a popular subject in your country?', difficultyLevel: 'medium' },
  { topic: 'Studies', questionText: 'What do you plan to do after you finish your studies?', difficultyLevel: 'medium' },
  
  // Topic: Languages
  { topic: 'Languages', questionText: 'How many languages can you speak?', difficultyLevel: 'easy' },
  { topic: 'Languages', questionText: 'How useful will English be to you in your future?', difficultyLevel: 'medium' },
  { topic: 'Languages', questionText: 'What do you remember about learning languages at school?', difficultyLevel: 'medium' },
  { topic: 'Languages', questionText: 'What do you think would be the hardest language for you to learn? Why?', difficultyLevel: 'hard' },
  
  // Topic: Weather
  { topic: 'Weather', questionText: 'What is the weather like in your country?', difficultyLevel: 'easy' },
  { topic: 'Weather', questionText: 'How many seasons are there in your country?', difficultyLevel: 'easy' },
  { topic: 'Weather', questionText: 'Does the weather ever affect your mood?', difficultyLevel: 'medium' },
  { topic: 'Weather', questionText: 'Do you think the weather in your country is changing?', difficultyLevel: 'hard' },
  
  // Topic: Family
  { topic: 'Family', questionText: 'How many people are there in your family?', difficultyLevel: 'easy' },
  { topic: 'Family', questionText: 'Who are you closest to in your family?', difficultyLevel: 'medium' },
  { topic: 'Family', questionText: 'Do you prefer spending time with your family or friends?', difficultyLevel: 'medium' },
  { topic: 'Family', questionText: 'What do you usually do together as a family?', difficultyLevel: 'medium' },
  
  // Topic: Technology
  { topic: 'Technology', questionText: 'What electronic devices do you use most often?', difficultyLevel: 'easy' },
  { topic: 'Technology', questionText: 'How has technology changed your daily life?', difficultyLevel: 'medium' },
  { topic: 'Technology', questionText: 'Do you think you spend too much time on your phone?', difficultyLevel: 'medium' },
  { topic: 'Technology', questionText: 'What technology do you find most difficult to use?', difficultyLevel: 'medium' },
  
  // Topic: Reading
  { topic: 'Reading', questionText: 'Do you like reading? Why or why not?', difficultyLevel: 'easy' },
  { topic: 'Reading', questionText: 'What kind of books do you like to read?', difficultyLevel: 'easy' },
  { topic: 'Reading', questionText: 'Did you enjoy reading when you were a child?', difficultyLevel: 'medium' },
  { topic: 'Reading', questionText: 'Do you prefer reading paper books or electronic books?', difficultyLevel: 'medium' },
  
  // Topic: Music
  { topic: 'Music', questionText: 'What type of music do you like?', difficultyLevel: 'easy' },
  { topic: 'Music', questionText: 'Have your musical tastes changed since you were a child?', difficultyLevel: 'medium' },
  { topic: 'Music', questionText: 'Do you think music can help people feel less stressed?', difficultyLevel: 'medium' },
  { topic: 'Music', questionText: 'Can you play any musical instruments?', difficultyLevel: 'easy' },
];

const part2Questions = [
  // Topic: Shopping
  {
    topic: 'Shopping',
    questionText: 'Describe a website that you bought something from.',
    cueCardPoints: [
      'What the website is',
      'What you bought from this website',
      'How you found out about this website',
      'Explain why you bought something from this website'
    ],
    difficultyLevel: 'medium',
  },
  // Topic: Art
  {
    topic: 'Art',
    questionText: 'Describe a piece of art you like.',
    cueCardPoints: [
      'What it is',
      'Where you saw it',
      'What it looks like',
      'Explain why you like it'
    ],
    difficultyLevel: 'medium',
  },
  // Topic: Family
  {
    topic: 'Family',
    questionText: 'Describe a member of your family you get on well with.',
    cueCardPoints: [
      'Who it is',
      'What relationship you have to that person',
      'What that person is like',
      'Explain why you get on so well with this person'
    ],
    difficultyLevel: 'medium',
  },
  // Topic: Gifts
  {
    topic: 'Gifts',
    questionText: 'Describe a gift you recently gave to someone.',
    cueCardPoints: [
      'Who you gave it to',
      'What kind of person he/she is',
      'What the gift was',
      'Explain why you chose that gift'
    ],
    difficultyLevel: 'medium',
  },
  // Topic: Travel
  {
    topic: 'Travel',
    questionText: 'Describe a place you would like to visit.',
    cueCardPoints: [
      'Where this place is',
      'What you know about this place',
      'How you would travel there',
      'Explain why you would like to visit this place'
    ],
    difficultyLevel: 'medium',
  },
  // Topic: People
  {
    topic: 'People',
    questionText: 'Describe someone who has had an important influence on your life.',
    cueCardPoints: [
      'Who this person is',
      'How long you have known this person',
      'What qualities this person has',
      'Explain why this person has had such an influence on you'
    ],
    difficultyLevel: 'hard',
  },
  // Topic: Experience
  {
    topic: 'Experience',
    questionText: 'Describe a time when you helped someone.',
    cueCardPoints: [
      'Who you helped',
      'What you helped them with',
      'How you helped them',
      'Explain how you felt after helping this person'
    ],
    difficultyLevel: 'medium',
  },
  // Topic: Achievement
  {
    topic: 'Achievement',
    questionText: 'Describe an achievement you are proud of.',
    cueCardPoints: [
      'What you achieved',
      'When this happened',
      'How you achieved this',
      'Explain why you are proud of this achievement'
    ],
    difficultyLevel: 'medium',
  },
  // Topic: Learning
  {
    topic: 'Learning',
    questionText: 'Describe something new you learned recently.',
    cueCardPoints: [
      'What you learned',
      'How you learned it',
      'Why you decided to learn it',
      'Explain how you felt about learning this new thing'
    ],
    difficultyLevel: 'medium',
  },
  // Topic: Food
  {
    topic: 'Food',
    questionText: 'Describe your favourite meal.',
    cueCardPoints: [
      'What the meal is',
      'When you usually eat it',
      'What is in this meal',
      'Explain why this is your favourite meal'
    ],
    difficultyLevel: 'easy',
  },
  // Topic: Childhood
  {
    topic: 'Childhood',
    questionText: 'Describe a happy memory from your childhood.',
    cueCardPoints: [
      'What the memory is',
      'When it happened',
      'Who was with you',
      'Explain why this memory is special to you'
    ],
    difficultyLevel: 'medium',
  },
  // Topic: Books
  {
    topic: 'Books',
    questionText: 'Describe a book that you have read and found useful.',
    cueCardPoints: [
      'What the book was about',
      'When you read it',
      'Why you read it',
      'Explain why you found it useful'
    ],
    difficultyLevel: 'medium',
  },
];

const part3Questions = [
  // Topic: Online Shopping (follows Part 2 shopping topic)
  { topic: 'Shopping', questionText: 'What kinds of things do people in your country often buy from online shops?', difficultyLevel: 'medium' },
  { topic: 'Shopping', questionText: 'Why do you think online shopping has become so popular nowadays?', difficultyLevel: 'medium' },
  { topic: 'Shopping', questionText: 'What are some possible disadvantages of buying things from online shops?', difficultyLevel: 'medium' },
  { topic: 'Shopping', questionText: 'Why do many people today keep buying things which they do not need?', difficultyLevel: 'hard' },
  { topic: 'Shopping', questionText: 'Do you believe the benefits of a consumer society outweigh the disadvantages?', difficultyLevel: 'hard' },
  
  // Topic: Technology
  { topic: 'Technology', questionText: 'What are the most popular electronic devices in your country at the moment?', difficultyLevel: 'medium' },
  { topic: 'Technology', questionText: 'What devices do you think will be popular in the future?', difficultyLevel: 'hard' },
  { topic: 'Technology', questionText: 'Do you think people spend too much money on electronic devices?', difficultyLevel: 'medium' },
  { topic: 'Technology', questionText: 'In what ways can electronic devices make our lives harder?', difficultyLevel: 'hard' },
  { topic: 'Technology', questionText: 'What would the world be like without computers?', difficultyLevel: 'hard' },
  
  // Topic: Family
  { topic: 'Family', questionText: 'Is family important in your country?', difficultyLevel: 'medium' },
  { topic: 'Family', questionText: 'How has the size of the family changed in the last few decades in your country?', difficultyLevel: 'hard' },
  { topic: 'Family', questionText: 'How do you think the family will change in the future?', difficultyLevel: 'hard' },
  { topic: 'Family', questionText: 'What are the advantages of large families compared to small families?', difficultyLevel: 'hard' },
  
  // Topic: Education
  { topic: 'Education', questionText: 'Should schools teach both arts and science?', difficultyLevel: 'medium' },
  { topic: 'Education', questionText: 'What kinds of courses are useful for university students?', difficultyLevel: 'medium' },
  { topic: 'Education', questionText: 'Why do some students dislike studying at school?', difficultyLevel: 'medium' },
  { topic: 'Education', questionText: 'How has education changed in your country over the years?', difficultyLevel: 'hard' },
  { topic: 'Education', questionText: 'Do you think children should be taught to use computers at school?', difficultyLevel: 'medium' },
  
  // Topic: Weather & Climate
  { topic: 'Weather', questionText: 'Does your country ever have extreme weather?', difficultyLevel: 'medium' },
  { topic: 'Weather', questionText: 'Do you think the world\'s climate is changing?', difficultyLevel: 'hard' },
  { topic: 'Weather', questionText: 'What effects might climate change have on your country?', difficultyLevel: 'hard' },
  
  // Topic: National Celebrations
  { topic: 'Culture', questionText: 'What days are important in your country?', difficultyLevel: 'medium' },
  { topic: 'Culture', questionText: 'Why is it important to have national celebrations?', difficultyLevel: 'medium' },
  { topic: 'Culture', questionText: 'How is the way your national celebrations are celebrated now different from the way they were celebrated in the past?', difficultyLevel: 'hard' },
  { topic: 'Culture', questionText: 'Do you think any new national celebrations will come into being in the future?', difficultyLevel: 'hard' },
  
  // Topic: Art
  { topic: 'Art', questionText: 'Do you think art is important for society? Why?', difficultyLevel: 'medium' },
  { topic: 'Art', questionText: 'Should governments spend money on art?', difficultyLevel: 'hard' },
  { topic: 'Art', questionText: 'What makes a piece of art valuable?', difficultyLevel: 'hard' },
  
  // Topic: Work
  { topic: 'Work', questionText: 'What are the advantages and disadvantages of working from home?', difficultyLevel: 'medium' },
  { topic: 'Work', questionText: 'How do you think technology has changed the way people work?', difficultyLevel: 'hard' },
  { topic: 'Work', questionText: 'Do you think people should be able to have flexible working hours?', difficultyLevel: 'medium' },
];

async function main() {
  console.log('🌱 Seeding database with official IELTS Speaking questions...');
  
  // Clear existing practice sessions first (they reference questions)
  await prisma.practiceSession.deleteMany();
  console.log('✓ Cleared existing practice sessions');
  
  // Clear existing questions
  await prisma.speakingQuestion.deleteMany();
  console.log('✓ Cleared existing questions');
  
  // Insert Part 1 questions
  for (const q of part1Questions) {
    await prisma.speakingQuestion.create({
      data: {
        part: 1,
        topic: q.topic,
        questionText: q.questionText,
        difficultyLevel: q.difficultyLevel,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${part1Questions.length} Part 1 questions`);
  
  // Insert Part 2 questions
  for (const q of part2Questions) {
    await prisma.speakingQuestion.create({
      data: {
        part: 2,
        topic: q.topic,
        questionText: q.questionText,
        cueCardPoints: q.cueCardPoints,
        difficultyLevel: q.difficultyLevel,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${part2Questions.length} Part 2 questions`);
  
  // Insert Part 3 questions
  for (const q of part3Questions) {
    await prisma.speakingQuestion.create({
      data: {
        part: 3,
        topic: q.topic,
        questionText: q.questionText,
        difficultyLevel: q.difficultyLevel,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${part3Questions.length} Part 3 questions`);

  // =========================
  // WRITING SEED
  // =========================
  console.log('🌱 Seeding writing module data...');

  // Clear writing-dependent data first
  await prisma.essayFeedback.deleteMany();
  await prisma.drillAttempt.deleteMany();
  await prisma.essaySubmission.deleteMany();
  await prisma.modelEssay.deleteMany();
  await prisma.writingWeakness.deleteMany();
  await prisma.writingProgress.deleteMany();
  await prisma.writingDrill.deleteMany();
  await prisma.writingQuestion.deleteMany();
  console.log('✓ Cleared existing writing data');

  const writingQuestions = [...task1Questions, ...task2Questions];
  await prisma.writingQuestion.createMany({
    data: writingQuestions.map((q) => {
      const imageUrl =
        'imageUrl' in q && typeof q.imageUrl === 'string' ? q.imageUrl : null;

      return {
        id: q.id,
        taskType: q.taskType as any,
        subType: q.subType ?? null,
        prompt: q.prompt,
        imageUrl,
        isActive: true,
      };
    }),
  });
  console.log(`✅ Created ${writingQuestions.length} writing questions`);

  const writingDrills = [...grammarDrills, ...vocabularyDrills, ...coherenceDrills];
  await prisma.writingDrill.createMany({
    data: writingDrills.map((d) => ({
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
  console.log(`✅ Created ${writingDrills.length} writing drills`);
  
  console.log('🎉 Database seeded successfully with speaking + writing data!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

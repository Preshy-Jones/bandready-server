import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Part 1 Questions
  const part1Questions = [
    { topic: 'Home', questionText: 'Do you live in a house or an apartment?', difficultyLevel: 'easy' },
    { topic: 'Home', questionText: 'What do you like about your home?', difficultyLevel: 'easy' },
    { topic: 'Home', questionText: 'Is there anything you would like to change about your home?', difficultyLevel: 'medium' },
    { topic: 'Work', questionText: 'Do you work or are you a student?', difficultyLevel: 'easy' },
    { topic: 'Work', questionText: 'What do you like about your job?', difficultyLevel: 'easy' },
    { topic: 'Studies', questionText: 'What subject are you studying?', difficultyLevel: 'easy' },
    { topic: 'Studies', questionText: 'Why did you choose this subject?', difficultyLevel: 'medium' },
    { topic: 'Hometown', questionText: 'Where is your hometown?', difficultyLevel: 'easy' },
    { topic: 'Hometown', questionText: 'What do you like most about your hometown?', difficultyLevel: 'easy' },
    { topic: 'Hometown', questionText: 'Has your hometown changed much in recent years?', difficultyLevel: 'medium' },
    { topic: 'Travel', questionText: 'Do you like traveling?', difficultyLevel: 'easy' },
    { topic: 'Travel', questionText: 'What kind of places do you like to visit?', difficultyLevel: 'easy' },
    { topic: 'Food', questionText: 'What is your favorite food?', difficultyLevel: 'easy' },
    { topic: 'Food', questionText: 'Do you prefer eating at home or in restaurants?', difficultyLevel: 'medium' },
    { topic: 'Technology', questionText: 'Do you use technology often?', difficultyLevel: 'easy' },
    { topic: 'Technology', questionText: 'How has technology changed your life?', difficultyLevel: 'medium' },
    { topic: 'Reading', questionText: 'Do you like reading?', difficultyLevel: 'easy' },
    { topic: 'Reading', questionText: 'What kind of books do you prefer?', difficultyLevel: 'easy' },
    { topic: 'Sports', questionText: 'Do you play any sports?', difficultyLevel: 'easy' },
    { topic: 'Sports', questionText: 'What sports are popular in your country?', difficultyLevel: 'medium' },
  ];

  // Part 2 Questions with cue card points
  const part2Questions = [
    {
      topic: 'Events',
      questionText: 'Describe a memorable event in your life.',
      difficultyLevel: 'medium',
      cueCardPoints: ['What the event was', 'When it happened', 'Who was involved', 'Why it was memorable'],
    },
    {
      topic: 'People',
      questionText: 'Describe a person who has influenced you.',
      difficultyLevel: 'medium',
      cueCardPoints: ['Who this person is', 'How you know them', 'What qualities they have', 'How they have influenced you'],
    },
    {
      topic: 'Places',
      questionText: 'Describe a place you would like to visit.',
      difficultyLevel: 'medium',
      cueCardPoints: ['Where this place is', 'What you know about it', 'Why you want to visit', 'What you would do there'],
    },
    {
      topic: 'Objects',
      questionText: 'Describe something you own that is important to you.',
      difficultyLevel: 'medium',
      cueCardPoints: ['What it is', 'How you got it', 'How long you have had it', 'Why it is important to you'],
    },
    {
      topic: 'Experiences',
      questionText: 'Describe a skill you would like to learn.',
      difficultyLevel: 'medium',
      cueCardPoints: ['What skill it is', 'Why you want to learn it', 'How you would learn it', 'How it would benefit you'],
    },
    {
      topic: 'Achievements',
      questionText: 'Describe an achievement you are proud of.',
      difficultyLevel: 'medium',
      cueCardPoints: ['What you achieved', 'When you achieved it', 'How difficult it was', 'Why you are proud of it'],
    },
    {
      topic: 'Technology',
      questionText: 'Describe a piece of technology you find useful.',
      difficultyLevel: 'medium',
      cueCardPoints: ['What technology it is', 'How you use it', 'How often you use it', 'Why you find it useful'],
    },
    {
      topic: 'Hobbies',
      questionText: 'Describe a hobby you enjoy.',
      difficultyLevel: 'easy',
      cueCardPoints: ['What the hobby is', 'How you got started', 'When you do it', 'Why you enjoy it'],
    },
  ];

  // Part 3 Questions
  const part3Questions = [
    { topic: 'Education', questionText: 'How has education changed in your country over the years?', difficultyLevel: 'hard' },
    { topic: 'Education', questionText: 'Do you think online learning is as effective as traditional classroom learning?', difficultyLevel: 'medium' },
    { topic: 'Technology', questionText: 'How do you think technology will change the way we live in the future?', difficultyLevel: 'hard' },
    { topic: 'Technology', questionText: 'Do you think people rely too much on technology nowadays?', difficultyLevel: 'medium' },
    { topic: 'Environment', questionText: 'What are the main environmental problems in your country?', difficultyLevel: 'medium' },
    { topic: 'Environment', questionText: 'What can individuals do to protect the environment?', difficultyLevel: 'medium' },
    { topic: 'Work', questionText: 'How do you think the job market will change in the next 20 years?', difficultyLevel: 'hard' },
    { topic: 'Work', questionText: 'Is it better to work for a large company or a small one?', difficultyLevel: 'medium' },
    { topic: 'Culture', questionText: 'How important is it to preserve traditional culture?', difficultyLevel: 'medium' },
    { topic: 'Culture', questionText: 'Do you think globalization is affecting local cultures negatively?', difficultyLevel: 'hard' },
    { topic: 'Health', questionText: 'What can governments do to improve public health?', difficultyLevel: 'hard' },
    { topic: 'Health', questionText: 'Why do you think some people find it difficult to lead a healthy lifestyle?', difficultyLevel: 'medium' },
  ];

  // Insert questions
  for (const q of part1Questions) {
    await prisma.speakingQuestion.create({
      data: { ...q, part: 1 },
    });
  }
  console.log(`✅ Created ${part1Questions.length} Part 1 questions`);

  for (const q of part2Questions) {
    await prisma.speakingQuestion.create({
      data: { ...q, part: 2 },
    });
  }
  console.log(`✅ Created ${part2Questions.length} Part 2 questions`);

  for (const q of part3Questions) {
    await prisma.speakingQuestion.create({
      data: { ...q, part: 3 },
    });
  }
  console.log(`✅ Created ${part3Questions.length} Part 3 questions`);

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient, Role, ReadingDifficulty, ReadingTestType, ReadingQuestionType } from '@prisma/client';
import { task1Questions } from '../data/task1-questions';
import { task2Questions } from '../data/task2-questions';
import { grammarDrills } from '../data/grammar-drills';
import { vocabularyDrills } from '../data/vocabulary-drills';
import { coherenceDrills } from '../data/coherence-drills';
import { taskResponseDrills } from '../data/task-response-drills';
import { allReadingPassages } from '../data/reading-passages';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Official IELTS Speaking Questions sourced from Cambridge IELTS, British Council, and IELTS.org
// These are authentic question types used in the IELTS Speaking Test

const part1Questions = [
  // Topic: Hometown
  { id: 'sq-p1-hometown-001', topic: 'Hometown', questionText: 'Where is your hometown?', difficultyLevel: 'easy' },
  { id: 'sq-p1-hometown-002', topic: 'Hometown', questionText: 'What do you like about your hometown?', difficultyLevel: 'easy' },
  { id: 'sq-p1-hometown-003', topic: 'Hometown', questionText: 'Is there anything you dislike about your hometown?', difficultyLevel: 'medium' },
  { id: 'sq-p1-hometown-004', topic: 'Hometown', questionText: 'How long have you lived in your hometown?', difficultyLevel: 'easy' },
  { id: 'sq-p1-hometown-005', topic: 'Hometown', questionText: 'Do you think you will continue to live there for a long time?', difficultyLevel: 'medium' },

  // Topic: Accommodation
  { id: 'sq-p1-accommodation-001', topic: 'Accommodation', questionText: 'Tell me about the kind of accommodation you live in.', difficultyLevel: 'easy' },
  { id: 'sq-p1-accommodation-002', topic: 'Accommodation', questionText: 'How long have you lived there?', difficultyLevel: 'easy' },
  { id: 'sq-p1-accommodation-003', topic: 'Accommodation', questionText: 'What do you like about living there?', difficultyLevel: 'medium' },
  { id: 'sq-p1-accommodation-004', topic: 'Accommodation', questionText: 'What sort of accommodation would you most like to live in?', difficultyLevel: 'medium' },
  { id: 'sq-p1-accommodation-005', topic: 'Accommodation', questionText: 'Which room does your family spend most of the time in?', difficultyLevel: 'easy' },
  { id: 'sq-p1-accommodation-006', topic: 'Accommodation', questionText: 'What would you like to change about your home?', difficultyLevel: 'medium' },
  { id: 'sq-p1-accommodation-007', topic: 'Accommodation', questionText: 'Do you plan to live there for a long time?', difficultyLevel: 'medium' },
  { id: 'sq-p1-accommodation-008', topic: 'Accommodation', questionText: 'What kind of accommodation is most common in your city?', difficultyLevel: 'medium' },

  // Topic: Work
  { id: 'sq-p1-work-001', topic: 'Work', questionText: 'What is your job?', difficultyLevel: 'easy' },
  { id: 'sq-p1-work-002', topic: 'Work', questionText: 'Where do you work?', difficultyLevel: 'easy' },
  { id: 'sq-p1-work-003', topic: 'Work', questionText: 'Why did you choose that job?', difficultyLevel: 'medium' },
  { id: 'sq-p1-work-004', topic: 'Work', questionText: 'Do you like your job? Why or why not?', difficultyLevel: 'medium' },
  { id: 'sq-p1-work-005', topic: 'Work', questionText: 'Is there anything you would like to change about your job?', difficultyLevel: 'hard' },

  // Topic: Studies
  { id: 'sq-p1-studies-001', topic: 'Studies', questionText: 'What do you study?', difficultyLevel: 'easy' },
  { id: 'sq-p1-studies-002', topic: 'Studies', questionText: 'Where do you study?', difficultyLevel: 'easy' },
  { id: 'sq-p1-studies-003', topic: 'Studies', questionText: 'Why did you choose that subject?', difficultyLevel: 'medium' },
  { id: 'sq-p1-studies-004', topic: 'Studies', questionText: 'Is it a popular subject in your country?', difficultyLevel: 'medium' },
  { id: 'sq-p1-studies-005', topic: 'Studies', questionText: 'What do you plan to do after you finish your studies?', difficultyLevel: 'medium' },

  // Topic: Languages
  { id: 'sq-p1-languages-001', topic: 'Languages', questionText: 'How many languages can you speak?', difficultyLevel: 'easy' },
  { id: 'sq-p1-languages-002', topic: 'Languages', questionText: 'How useful will English be to you in your future?', difficultyLevel: 'medium' },
  { id: 'sq-p1-languages-003', topic: 'Languages', questionText: 'What do you remember about learning languages at school?', difficultyLevel: 'medium' },
  { id: 'sq-p1-languages-004', topic: 'Languages', questionText: 'What do you think would be the hardest language for you to learn? Why?', difficultyLevel: 'hard' },

  // Topic: Weather
  { id: 'sq-p1-weather-001', topic: 'Weather', questionText: 'What is the weather like in your country?', difficultyLevel: 'easy' },
  { id: 'sq-p1-weather-002', topic: 'Weather', questionText: 'How many seasons are there in your country?', difficultyLevel: 'easy' },
  { id: 'sq-p1-weather-003', topic: 'Weather', questionText: 'Does the weather ever affect your mood?', difficultyLevel: 'medium' },
  { id: 'sq-p1-weather-004', topic: 'Weather', questionText: 'Do you think the weather in your country is changing?', difficultyLevel: 'hard' },

  // Topic: Family
  { id: 'sq-p1-family-001', topic: 'Family', questionText: 'How many people are there in your family?', difficultyLevel: 'easy' },
  { id: 'sq-p1-family-002', topic: 'Family', questionText: 'Who are you closest to in your family?', difficultyLevel: 'medium' },
  { id: 'sq-p1-family-003', topic: 'Family', questionText: 'Do you prefer spending time with your family or friends?', difficultyLevel: 'medium' },
  { id: 'sq-p1-family-004', topic: 'Family', questionText: 'What do you usually do together as a family?', difficultyLevel: 'medium' },

  // Topic: Technology
  { id: 'sq-p1-technology-001', topic: 'Technology', questionText: 'What electronic devices do you use most often?', difficultyLevel: 'easy' },
  { id: 'sq-p1-technology-002', topic: 'Technology', questionText: 'How has technology changed your daily life?', difficultyLevel: 'medium' },
  { id: 'sq-p1-technology-003', topic: 'Technology', questionText: 'Do you think you spend too much time on your phone?', difficultyLevel: 'medium' },
  { id: 'sq-p1-technology-004', topic: 'Technology', questionText: 'What technology do you find most difficult to use?', difficultyLevel: 'medium' },

  // Topic: Reading
  { id: 'sq-p1-reading-001', topic: 'Reading', questionText: 'Do you like reading? Why or why not?', difficultyLevel: 'easy' },
  { id: 'sq-p1-reading-002', topic: 'Reading', questionText: 'What kind of books do you like to read?', difficultyLevel: 'easy' },
  { id: 'sq-p1-reading-003', topic: 'Reading', questionText: 'Did you enjoy reading when you were a child?', difficultyLevel: 'medium' },
  { id: 'sq-p1-reading-004', topic: 'Reading', questionText: 'Do you prefer reading paper books or electronic books?', difficultyLevel: 'medium' },

  // Topic: Books
  { id: 'sq-p1-books-001', topic: 'Books', questionText: 'Do you often read books?', difficultyLevel: 'easy' },
  { id: 'sq-p1-books-002', topic: 'Books', questionText: 'What kinds of books are most popular in your country?', difficultyLevel: 'medium' },
  { id: 'sq-p1-books-003', topic: 'Books', questionText: 'Do you think reading is important for children?', difficultyLevel: 'medium' },
  { id: 'sq-p1-books-004', topic: 'Books', questionText: 'Have your reading habits changed over time?', difficultyLevel: 'medium' },

  // Topic: Art
  { id: 'sq-p1-art-001', topic: 'Art', questionText: 'Do you like art?', difficultyLevel: 'easy' },
  { id: 'sq-p1-art-002', topic: 'Art', questionText: 'Did you enjoy art classes at school?', difficultyLevel: 'easy' },
  { id: 'sq-p1-art-003', topic: 'Art', questionText: 'Is art popular in your country?', difficultyLevel: 'medium' },
  { id: 'sq-p1-art-004', topic: 'Art', questionText: 'Do you think anyone can become an artist?', difficultyLevel: 'hard' },

  // Topic: Childhood
  { id: 'sq-p1-childhood-001', topic: 'Childhood', questionText: 'Did you enjoy your childhood?', difficultyLevel: 'easy' },
  { id: 'sq-p1-childhood-002', topic: 'Childhood', questionText: 'What did you enjoy doing as a child?', difficultyLevel: 'easy' },
  { id: 'sq-p1-childhood-003', topic: 'Childhood', questionText: 'Did you have a lot of friends when you were a child?', difficultyLevel: 'medium' },
  { id: 'sq-p1-childhood-004', topic: 'Childhood', questionText: 'What was your favourite game when you were young?', difficultyLevel: 'medium' },

  // Topic: Culture
  { id: 'sq-p1-culture-001', topic: 'Culture', questionText: 'What traditions are important in your culture?', difficultyLevel: 'medium' },
  { id: 'sq-p1-culture-002', topic: 'Culture', questionText: 'Do young people in your country follow traditional customs?', difficultyLevel: 'medium' },
  { id: 'sq-p1-culture-003', topic: 'Culture', questionText: 'How do people in your country usually celebrate national festivals?', difficultyLevel: 'medium' },
  { id: 'sq-p1-culture-004', topic: 'Culture', questionText: 'Is it important to preserve cultural traditions?', difficultyLevel: 'hard' },

  // Topic: Education
  { id: 'sq-p1-education-001', topic: 'Education', questionText: 'What did you like most about your school?', difficultyLevel: 'easy' },
  { id: 'sq-p1-education-002', topic: 'Education', questionText: 'Who was your favourite teacher?', difficultyLevel: 'easy' },
  { id: 'sq-p1-education-003', topic: 'Education', questionText: 'Do you prefer studying alone or with others?', difficultyLevel: 'medium' },
  { id: 'sq-p1-education-004', topic: 'Education', questionText: 'What changes would you like to see in the education system?', difficultyLevel: 'hard' },

  // Topic: Experience
  { id: 'sq-p1-experience-001', topic: 'Experience', questionText: 'Do you like trying new things?', difficultyLevel: 'easy' },
  { id: 'sq-p1-experience-002', topic: 'Experience', questionText: 'What is a memorable experience you have had recently?', difficultyLevel: 'medium' },
  { id: 'sq-p1-experience-003', topic: 'Experience', questionText: 'Do you learn more from success or failure?', difficultyLevel: 'medium' },
  { id: 'sq-p1-experience-004', topic: 'Experience', questionText: 'How do experiences change people over time?', difficultyLevel: 'hard' },

  // Topic: Achievement
  { id: 'sq-p1-achievement-001', topic: 'Achievement', questionText: 'What achievement are you most proud of?', difficultyLevel: 'medium' },
  { id: 'sq-p1-achievement-002', topic: 'Achievement', questionText: 'Do you set goals for yourself?', difficultyLevel: 'medium' },
  { id: 'sq-p1-achievement-003', topic: 'Achievement', questionText: 'How do people usually celebrate achievements in your country?', difficultyLevel: 'medium' },
  { id: 'sq-p1-achievement-004', topic: 'Achievement', questionText: 'Is success more about hard work or talent?', difficultyLevel: 'hard' },

  // Topic: Music
  { id: 'sq-p1-music-001', topic: 'Music', questionText: 'What type of music do you like?', difficultyLevel: 'easy' },
  { id: 'sq-p1-music-002', topic: 'Music', questionText: 'Have your musical tastes changed since you were a child?', difficultyLevel: 'medium' },
  { id: 'sq-p1-music-003', topic: 'Music', questionText: 'Do you think music can help people feel less stressed?', difficultyLevel: 'medium' },
  { id: 'sq-p1-music-004', topic: 'Music', questionText: 'Can you play any musical instruments?', difficultyLevel: 'easy' },

  // Topic: Health
  { id: 'sq-p1-health-001', topic: 'Health', questionText: 'Do you do anything to stay healthy?', difficultyLevel: 'easy' },
  { id: 'sq-p1-health-002', topic: 'Health', questionText: 'What kind of exercise do you enjoy?', difficultyLevel: 'easy' },
  { id: 'sq-p1-health-003', topic: 'Health', questionText: 'Do people in your country care a lot about healthy eating?', difficultyLevel: 'medium' },
  { id: 'sq-p1-health-004', topic: 'Health', questionText: 'Have your health habits changed in recent years?', difficultyLevel: 'medium' },

  // Topic: Transport
  { id: 'sq-p1-transport-001', topic: 'Transport', questionText: 'How do you usually travel around your city?', difficultyLevel: 'easy' },
  { id: 'sq-p1-transport-002', topic: 'Transport', questionText: 'Do you prefer public transport or private transport?', difficultyLevel: 'medium' },
  { id: 'sq-p1-transport-003', topic: 'Transport', questionText: 'What problems do people face when travelling in your area?', difficultyLevel: 'medium' },
  { id: 'sq-p1-transport-004', topic: 'Transport', questionText: 'Would you like to own a car in the future?', difficultyLevel: 'medium' },

  // Topic: Free Time
  { id: 'sq-p1-freetime-001', topic: 'Free Time', questionText: 'What do you usually do in your free time?', difficultyLevel: 'easy' },
  { id: 'sq-p1-freetime-002', topic: 'Free Time', questionText: 'Do you prefer relaxing at home or going out?', difficultyLevel: 'easy' },
  { id: 'sq-p1-freetime-003', topic: 'Free Time', questionText: 'Do you think you have enough free time?', difficultyLevel: 'medium' },
  { id: 'sq-p1-freetime-004', topic: 'Free Time', questionText: 'How has the way you spend free time changed since childhood?', difficultyLevel: 'medium' },

  // Topic: News
  { id: 'sq-p1-news-001', topic: 'News', questionText: 'Do you often follow the news?', difficultyLevel: 'easy' },
  { id: 'sq-p1-news-002', topic: 'News', questionText: 'Where do you usually get your news from?', difficultyLevel: 'easy' },
  { id: 'sq-p1-news-003', topic: 'News', questionText: 'What kinds of news stories interest you most?', difficultyLevel: 'medium' },
  { id: 'sq-p1-news-004', topic: 'News', questionText: 'Do you prefer reading, watching or listening to the news?', difficultyLevel: 'medium' },

  // Topic: Money
  { id: 'sq-p1-money-001', topic: 'Money', questionText: 'Are you good at saving money?', difficultyLevel: 'medium' },
  { id: 'sq-p1-money-002', topic: 'Money', questionText: 'What do you usually spend money on?', difficultyLevel: 'easy' },
  { id: 'sq-p1-money-003', topic: 'Money', questionText: 'Did you learn about managing money when you were younger?', difficultyLevel: 'medium' },
  { id: 'sq-p1-money-004', topic: 'Money', questionText: 'Do you prefer shopping online or in stores?', difficultyLevel: 'easy' },
];

const part2Questions = [
  {
    id: 'sq-p2-shopping-001',
    topic: 'Shopping',
    questionText: 'Describe a website that you bought something from.',
    cueCardPoints: [
      'What the website is',
      'What you bought from this website',
      'How you found out about this website',
      'Explain why you bought something from this website',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-art-001',
    topic: 'Art',
    questionText: 'Describe a piece of art you like.',
    cueCardPoints: [
      'What it is',
      'Where you saw it',
      'What it looks like',
      'Explain why you like it',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-family-001',
    topic: 'Family',
    questionText: 'Describe a member of your family you get on well with.',
    cueCardPoints: [
      'Who it is',
      'What relationship you have to that person',
      'What that person is like',
      'Explain why you get on so well with this person',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-gifts-001',
    topic: 'Gifts',
    questionText: 'Describe a gift you recently gave to someone.',
    cueCardPoints: [
      'Who you gave it to',
      'What kind of person he/she is',
      'What the gift was',
      'Explain why you chose that gift',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-travel-001',
    topic: 'Travel',
    questionText: 'Describe a place you would like to visit.',
    cueCardPoints: [
      'Where this place is',
      'What you know about this place',
      'How you would travel there',
      'Explain why you would like to visit this place',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-people-001',
    topic: 'People',
    questionText: 'Describe someone who has had an important influence on your life.',
    cueCardPoints: [
      'Who this person is',
      'How long you have known this person',
      'What qualities this person has',
      'Explain why this person has had such an influence on you',
    ],
    difficultyLevel: 'hard',
  },
  {
    id: 'sq-p2-experience-001',
    topic: 'Experience',
    questionText: 'Describe a time when you helped someone.',
    cueCardPoints: [
      'Who you helped',
      'What you helped them with',
      'How you helped them',
      'Explain how you felt after helping this person',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-achievement-001',
    topic: 'Achievement',
    questionText: 'Describe an achievement you are proud of.',
    cueCardPoints: [
      'What you achieved',
      'When this happened',
      'How you achieved this',
      'Explain why you are proud of this achievement',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-learning-001',
    topic: 'Learning',
    questionText: 'Describe something new you learned recently.',
    cueCardPoints: [
      'What you learned',
      'How you learned it',
      'Why you decided to learn it',
      'Explain how you felt about learning this new thing',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-food-001',
    topic: 'Food',
    questionText: 'Describe your favourite meal.',
    cueCardPoints: [
      'What the meal is',
      'When you usually eat it',
      'What is in this meal',
      'Explain why this is your favourite meal',
    ],
    difficultyLevel: 'easy',
  },
  {
    id: 'sq-p2-childhood-001',
    topic: 'Childhood',
    questionText: 'Describe a happy memory from your childhood.',
    cueCardPoints: [
      'What the memory is',
      'When it happened',
      'Who was with you',
      'Explain why this memory is special to you',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-books-001',
    topic: 'Books',
    questionText: 'Describe a book that you have read and found useful.',
    cueCardPoints: [
      'What the book was about',
      'When you read it',
      'Why you read it',
      'Explain why you found it useful',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-education-001',
    topic: 'Education',
    questionText: 'Describe a subject you enjoyed studying at school.',
    cueCardPoints: [
      'What the subject was',
      'Who taught you',
      'Why you enjoyed learning it',
      'Explain how it has helped you in your life',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-accommodation-001',
    topic: 'Accommodation',
    questionText: 'Describe an ideal home that you would like to live in.',
    cueCardPoints: [
      'Where it would be',
      'What it would look like',
      'Who you would like to live with',
      'Explain why this home would be ideal for you',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-culture-001',
    topic: 'Culture',
    questionText: 'Describe a traditional event or festival in your country.',
    cueCardPoints: [
      'What the event is',
      'When and where it takes place',
      'What people usually do during the event',
      'Explain why this event is important in your culture',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-health-001',
    topic: 'Health',
    questionText: 'Describe a healthy habit you have.',
    cueCardPoints: [
      'What the habit is',
      'When you started doing it',
      'How often you do it',
      'Explain why this habit is important to you',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-technology-001',
    topic: 'Technology',
    questionText: 'Describe a piece of technology that you find useful.',
    cueCardPoints: [
      'What it is',
      'How often you use it',
      'What you use it for',
      'Explain why it is useful in your daily life',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-environment-001',
    topic: 'Environment',
    questionText: 'Describe a place in nature that you enjoyed visiting.',
    cueCardPoints: [
      'Where the place is',
      'When you went there',
      'What you did there',
      'Explain why you enjoyed visiting this place',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-work-001',
    topic: 'Work',
    questionText: 'Describe a job you think would be interesting.',
    cueCardPoints: [
      'What the job is',
      'What skills are needed for it',
      'Where people usually do this job',
      'Explain why you think this job would be interesting',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-communication-001',
    topic: 'Communication',
    questionText: 'Describe an important conversation you had.',
    cueCardPoints: [
      'Who you spoke with',
      'What you talked about',
      'Why the conversation was important',
      'Explain how you felt after the conversation',
    ],
    difficultyLevel: 'hard',
  },
  {
    id: 'sq-p2-decision-001',
    topic: 'Decision',
    questionText: 'Describe an important decision you made.',
    cueCardPoints: [
      'What the decision was',
      'When you made it',
      'Why you had to make this decision',
      'Explain how this decision affected your life',
    ],
    difficultyLevel: 'hard',
  },
  {
    id: 'sq-p2-publicplace-001',
    topic: 'Public Place',
    questionText: 'Describe a public place that has improved in your area.',
    cueCardPoints: [
      'What the place is',
      'Where it is located',
      'How it has improved',
      'Explain why this improvement is useful for local people',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-skill-001',
    topic: 'Skill',
    questionText: 'Describe a skill you would like to learn.',
    cueCardPoints: [
      'What the skill is',
      'Why you want to learn it',
      'How you would learn it',
      'Explain how this skill could help you in the future',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-news-001',
    topic: 'News',
    questionText: 'Describe a news story that interested you.',
    cueCardPoints: [
      'What the story was about',
      'Where you heard or read about it',
      'Why it interested you',
      'Explain whether you shared it with other people',
    ],
    difficultyLevel: 'medium',
  },
  {
    id: 'sq-p2-money-001',
    topic: 'Money',
    questionText: 'Describe something useful you bought recently.',
    cueCardPoints: [
      'What you bought',
      'Where you bought it',
      'Why you needed it',
      'Explain why it was a useful purchase',
    ],
    difficultyLevel: 'medium',
  },
];

const part3Questions = [
  // Topic: Shopping
  { id: 'sq-p3-shopping-001', topic: 'Shopping', questionText: 'What kinds of things do people in your country often buy from online shops?', difficultyLevel: 'medium' },
  { id: 'sq-p3-shopping-002', topic: 'Shopping', questionText: 'Why do you think online shopping has become so popular nowadays?', difficultyLevel: 'medium' },
  { id: 'sq-p3-shopping-003', topic: 'Shopping', questionText: 'What are some possible disadvantages of buying things from online shops?', difficultyLevel: 'medium' },
  { id: 'sq-p3-shopping-004', topic: 'Shopping', questionText: 'Why do many people today keep buying things which they do not need?', difficultyLevel: 'hard' },
  { id: 'sq-p3-shopping-005', topic: 'Shopping', questionText: 'Do you believe the benefits of a consumer society outweigh the disadvantages?', difficultyLevel: 'hard' },

  // Topic: Technology
  { id: 'sq-p3-technology-001', topic: 'Technology', questionText: 'What are the most popular electronic devices in your country at the moment?', difficultyLevel: 'medium' },
  { id: 'sq-p3-technology-002', topic: 'Technology', questionText: 'What devices do you think will be popular in the future?', difficultyLevel: 'hard' },
  { id: 'sq-p3-technology-003', topic: 'Technology', questionText: 'Do you think people spend too much money on electronic devices?', difficultyLevel: 'medium' },
  { id: 'sq-p3-technology-004', topic: 'Technology', questionText: 'In what ways can electronic devices make our lives harder?', difficultyLevel: 'hard' },
  { id: 'sq-p3-technology-005', topic: 'Technology', questionText: 'What would the world be like without computers?', difficultyLevel: 'hard' },

  // Topic: Family
  { id: 'sq-p3-family-001', topic: 'Family', questionText: 'Is family important in your country?', difficultyLevel: 'medium' },
  { id: 'sq-p3-family-002', topic: 'Family', questionText: 'How has the size of the family changed in the last few decades in your country?', difficultyLevel: 'hard' },
  { id: 'sq-p3-family-003', topic: 'Family', questionText: 'How do you think the family will change in the future?', difficultyLevel: 'hard' },
  { id: 'sq-p3-family-004', topic: 'Family', questionText: 'What are the advantages of large families compared to small families?', difficultyLevel: 'hard' },

  // Topic: Education
  { id: 'sq-p3-education-001', topic: 'Education', questionText: 'Should schools teach both arts and science?', difficultyLevel: 'medium' },
  { id: 'sq-p3-education-002', topic: 'Education', questionText: 'What kinds of courses are useful for university students?', difficultyLevel: 'medium' },
  { id: 'sq-p3-education-003', topic: 'Education', questionText: 'Why do some students dislike studying at school?', difficultyLevel: 'medium' },
  { id: 'sq-p3-education-004', topic: 'Education', questionText: 'How has education changed in your country over the years?', difficultyLevel: 'hard' },
  { id: 'sq-p3-education-005', topic: 'Education', questionText: 'Do you think children should be taught to use computers at school?', difficultyLevel: 'medium' },

  // Topic: Weather
  { id: 'sq-p3-weather-001', topic: 'Weather', questionText: 'Does your country ever have extreme weather?', difficultyLevel: 'medium' },
  { id: 'sq-p3-weather-002', topic: 'Weather', questionText: 'Do you think the world\'s climate is changing?', difficultyLevel: 'hard' },
  { id: 'sq-p3-weather-003', topic: 'Weather', questionText: 'What effects might climate change have on your country?', difficultyLevel: 'hard' },

  // Topic: Culture
  { id: 'sq-p3-culture-001', topic: 'Culture', questionText: 'What days are important in your country?', difficultyLevel: 'medium', relatedPart2Topic: 'Culture' },
  { id: 'sq-p3-culture-002', topic: 'Culture', questionText: 'Why is it important to have national celebrations?', difficultyLevel: 'medium', relatedPart2Topic: 'Culture' },
  { id: 'sq-p3-culture-003', topic: 'Culture', questionText: 'How is the way your national celebrations are celebrated now different from the way they were celebrated in the past?', difficultyLevel: 'hard', relatedPart2Topic: 'Culture' },
  { id: 'sq-p3-culture-004', topic: 'Culture', questionText: 'Do you think any new national celebrations will come into being in the future?', difficultyLevel: 'hard', relatedPart2Topic: 'Culture' },

  // Topic: Art
  { id: 'sq-p3-art-001', topic: 'Art', questionText: 'Do you think art is important for society? Why?', difficultyLevel: 'medium', relatedPart2Topic: 'Art' },
  { id: 'sq-p3-art-002', topic: 'Art', questionText: 'Should governments spend money on art?', difficultyLevel: 'hard', relatedPart2Topic: 'Art' },
  { id: 'sq-p3-art-003', topic: 'Art', questionText: 'What makes a piece of art valuable?', difficultyLevel: 'hard', relatedPart2Topic: 'Art' },

  // Topic: Accommodation
  { id: 'sq-p3-accommodation-001', topic: 'Accommodation', questionText: 'How does housing design affect people\'s quality of life?', difficultyLevel: 'hard', relatedPart2Topic: 'Accommodation' },
  { id: 'sq-p3-accommodation-002', topic: 'Accommodation', questionText: 'Should governments invest more in affordable housing?', difficultyLevel: 'hard', relatedPart2Topic: 'Accommodation' },
  { id: 'sq-p3-accommodation-003', topic: 'Accommodation', questionText: 'What are the advantages and disadvantages of living in apartment blocks?', difficultyLevel: 'medium', relatedPart2Topic: 'Accommodation' },

  // Topic: Achievement
  { id: 'sq-p3-achievement-001', topic: 'Achievement', questionText: 'How should schools reward students\' achievements?', difficultyLevel: 'medium', relatedPart2Topic: 'Achievement' },
  { id: 'sq-p3-achievement-002', topic: 'Achievement', questionText: 'Do you think competition is necessary to achieve success?', difficultyLevel: 'hard', relatedPart2Topic: 'Achievement' },
  { id: 'sq-p3-achievement-003', topic: 'Achievement', questionText: 'Which is more important for achievement: natural talent or consistent effort?', difficultyLevel: 'hard', relatedPart2Topic: 'Achievement' },

  // Topic: Books
  { id: 'sq-p3-books-001', topic: 'Books', questionText: 'Do you think reading habits are changing among young people?', difficultyLevel: 'medium', relatedPart2Topic: 'Books' },
  { id: 'sq-p3-books-002', topic: 'Books', questionText: 'How important is literature in modern education?', difficultyLevel: 'hard', relatedPart2Topic: 'Books' },
  { id: 'sq-p3-books-003', topic: 'Books', questionText: 'Will printed books disappear in the future?', difficultyLevel: 'hard', relatedPart2Topic: 'Books' },

  // Topic: Childhood
  { id: 'sq-p3-childhood-001', topic: 'Childhood', questionText: 'How has childhood changed compared with the past?', difficultyLevel: 'medium', relatedPart2Topic: 'Childhood' },
  { id: 'sq-p3-childhood-002', topic: 'Childhood', questionText: 'Do children today have too much pressure from school and parents?', difficultyLevel: 'hard', relatedPart2Topic: 'Childhood' },
  { id: 'sq-p3-childhood-003', topic: 'Childhood', questionText: 'What kinds of activities best help children develop social skills?', difficultyLevel: 'medium', relatedPart2Topic: 'Childhood' },

  // Topic: Experience
  { id: 'sq-p3-experience-001', topic: 'Experience', questionText: 'Why do many people value practical experience more than theoretical knowledge?', difficultyLevel: 'medium', relatedPart2Topic: 'Experience' },
  { id: 'sq-p3-experience-002', topic: 'Experience', questionText: 'How can traveling to different places broaden people\'s perspectives?', difficultyLevel: 'medium', relatedPart2Topic: 'Experience' },
  { id: 'sq-p3-experience-003', topic: 'Experience', questionText: 'Should young people be encouraged to gain work experience before university?', difficultyLevel: 'hard', relatedPart2Topic: 'Experience' },

  // Topic: Work
  { id: 'sq-p3-work-001', topic: 'Work', questionText: 'What are the advantages and disadvantages of working from home?', difficultyLevel: 'medium' },
  { id: 'sq-p3-work-002', topic: 'Work', questionText: 'How do you think technology has changed the way people work?', difficultyLevel: 'hard' },
  { id: 'sq-p3-work-003', topic: 'Work', questionText: 'Do you think people should be able to have flexible working hours?', difficultyLevel: 'medium' },

  // Topic: Health
  { id: 'sq-p3-health-001', topic: 'Health', questionText: 'Why do some people find it difficult to maintain healthy habits?', difficultyLevel: 'medium', relatedPart2Topic: 'Health' },
  { id: 'sq-p3-health-002', topic: 'Health', questionText: 'Should governments be responsible for encouraging people to live healthier lives?', difficultyLevel: 'hard', relatedPart2Topic: 'Health' },
  { id: 'sq-p3-health-003', topic: 'Health', questionText: 'How have attitudes towards fitness changed in recent years?', difficultyLevel: 'medium', relatedPart2Topic: 'Health' },

  // Topic: Environment
  { id: 'sq-p3-environment-001', topic: 'Environment', questionText: 'Why is it important for cities to have natural spaces?', difficultyLevel: 'medium', relatedPart2Topic: 'Environment' },
  { id: 'sq-p3-environment-002', topic: 'Environment', questionText: 'What can individuals do to protect the environment in their daily lives?', difficultyLevel: 'medium', relatedPart2Topic: 'Environment' },
  { id: 'sq-p3-environment-003', topic: 'Environment', questionText: 'Do you think environmental problems can be solved through technology alone?', difficultyLevel: 'hard', relatedPart2Topic: 'Environment' },

  // Topic: Communication
  { id: 'sq-p3-communication-001', topic: 'Communication', questionText: 'How has digital communication changed relationships between people?', difficultyLevel: 'medium', relatedPart2Topic: 'Communication' },
  { id: 'sq-p3-communication-002', topic: 'Communication', questionText: 'Do people communicate better face to face than online?', difficultyLevel: 'medium', relatedPart2Topic: 'Communication' },
  { id: 'sq-p3-communication-003', topic: 'Communication', questionText: 'What communication skills are most important in the workplace?', difficultyLevel: 'hard', relatedPart2Topic: 'Communication' },

  // Topic: Decision
  { id: 'sq-p3-decision-001', topic: 'Decision', questionText: 'Do young people today have to make important decisions earlier than in the past?', difficultyLevel: 'hard', relatedPart2Topic: 'Decision' },
  { id: 'sq-p3-decision-002', topic: 'Decision', questionText: 'Should parents help children make major decisions?', difficultyLevel: 'medium', relatedPart2Topic: 'Decision' },
  { id: 'sq-p3-decision-003', topic: 'Decision', questionText: 'Why do some people regret decisions they made in the past?', difficultyLevel: 'medium', relatedPart2Topic: 'Decision' },

  // Topic: Public Place
  { id: 'sq-p3-publicplace-001', topic: 'Public Place', questionText: 'What kinds of public places are most useful in a community?', difficultyLevel: 'medium', relatedPart2Topic: 'Public Place' },
  { id: 'sq-p3-publicplace-002', topic: 'Public Place', questionText: 'Should local governments spend more money improving parks and public squares?', difficultyLevel: 'hard', relatedPart2Topic: 'Public Place' },
  { id: 'sq-p3-publicplace-003', topic: 'Public Place', questionText: 'How can public places help people from different backgrounds mix together?', difficultyLevel: 'hard', relatedPart2Topic: 'Public Place' },

  // Topic: Skill
  { id: 'sq-p3-skill-001', topic: 'Skill', questionText: 'What skills should schools teach that are not usually taught now?', difficultyLevel: 'medium', relatedPart2Topic: 'Skill' },
  { id: 'sq-p3-skill-002', topic: 'Skill', questionText: 'Is it easier for adults or children to learn new skills?', difficultyLevel: 'medium', relatedPart2Topic: 'Skill' },
  { id: 'sq-p3-skill-003', topic: 'Skill', questionText: 'How important is lifelong learning in modern society?', difficultyLevel: 'hard', relatedPart2Topic: 'Skill' },

  // Topic: News
  { id: 'sq-p3-news-001', topic: 'News', questionText: 'How do people in your country usually get the news?', difficultyLevel: 'medium', relatedPart2Topic: 'News' },
  { id: 'sq-p3-news-002', topic: 'News', questionText: 'Do you think social media has made news more reliable or less reliable?', difficultyLevel: 'hard', relatedPart2Topic: 'News' },
  { id: 'sq-p3-news-003', topic: 'News', questionText: 'Should schools teach students how to judge whether news is trustworthy?', difficultyLevel: 'hard', relatedPart2Topic: 'News' },

  // Topic: Money
  { id: 'sq-p3-money-001', topic: 'Money', questionText: 'Why do some people buy things they do not really need?', difficultyLevel: 'medium', relatedPart2Topic: 'Money' },
  { id: 'sq-p3-money-002', topic: 'Money', questionText: 'Is it better to save money or spend it on experiences?', difficultyLevel: 'medium', relatedPart2Topic: 'Money' },
  { id: 'sq-p3-money-003', topic: 'Money', questionText: 'Should children learn how to manage money at school?', difficultyLevel: 'hard', relatedPart2Topic: 'Money' },
];

async function main() {
  console.log('🌱 Seeding database with official IELTS Speaking questions...');

  // Upsert Part 1 questions — never deletes, safe to re-run
  for (const q of part1Questions) {
    await prisma.speakingQuestion.upsert({
      where: { id: q.id },
      update: {
        topic: q.topic,
        questionText: q.questionText,
        difficultyLevel: q.difficultyLevel,
        isActive: true,
      },
      create: {
        id: q.id,
        part: 1,
        topic: q.topic,
        questionText: q.questionText,
        difficultyLevel: q.difficultyLevel,
        isActive: true,
      },
    });
  }
  console.log(`✅ Upserted ${part1Questions.length} Part 1 questions`);

  // Upsert Part 2 questions
  for (const q of part2Questions) {
    await prisma.speakingQuestion.upsert({
      where: { id: q.id },
      update: {
        topic: q.topic,
        questionText: q.questionText,
        cueCardPoints: q.cueCardPoints,
        difficultyLevel: q.difficultyLevel,
        isActive: true,
      },
      create: {
        id: q.id,
        part: 2,
        topic: q.topic,
        questionText: q.questionText,
        cueCardPoints: q.cueCardPoints,
        difficultyLevel: q.difficultyLevel,
        isActive: true,
      },
    });
  }
  console.log(`✅ Upserted ${part2Questions.length} Part 2 questions`);

  // Upsert Part 3 questions
  for (const q of part3Questions) {
    await prisma.speakingQuestion.upsert({
      where: { id: q.id },
      update: {
        topic: q.topic,
        questionText: q.questionText,
        relatedPart2Topic: q.relatedPart2Topic ?? null,
        difficultyLevel: q.difficultyLevel,
        isActive: true,
      },
      create: {
        id: q.id,
        part: 3,
        topic: q.topic,
        questionText: q.questionText,
        relatedPart2Topic: q.relatedPart2Topic ?? null,
        difficultyLevel: q.difficultyLevel,
        isActive: true,
      },
    });
  }
  console.log(`✅ Upserted ${part3Questions.length} Part 3 questions`);

  // =========================
  // WRITING SEED
  // =========================
  console.log('🌱 Seeding writing module data...');

  // Upsert writing questions — never deletes user submissions or feedback
  const writingQuestions = [...task1Questions, ...task2Questions];
  for (const q of writingQuestions) {
    const imageUrl = 'imageUrl' in q && typeof q.imageUrl === 'string' ? q.imageUrl : null;
    const examType = ('examType' in q && q.examType === 'GENERAL') ? 'GENERAL' : 'ACADEMIC';
    await prisma.writingQuestion.upsert({
      where: { id: q.id },
      update: {
        taskType: q.taskType as any,
        subType: q.subType ?? null,
        examType,
        prompt: q.prompt,
        imageUrl,
        isActive: 'isActive' in q ? (q as any).isActive : true,
      },
      create: {
        id: q.id,
        taskType: q.taskType as any,
        subType: q.subType ?? null,
        examType,
        prompt: q.prompt,
        imageUrl,
        isActive: 'isActive' in q ? (q as any).isActive : true,
      },
    });
  }
  console.log(`✅ Upserted ${writingQuestions.length} writing questions`);

  // Upsert writing drills — never deletes user drill attempts
  const writingDrills = [
    ...grammarDrills,
    ...vocabularyDrills,
    ...coherenceDrills,
    ...taskResponseDrills,
  ];
  for (const d of writingDrills) {
    await prisma.writingDrill.upsert({
      where: { id: d.id },
      update: {
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
      },
      create: {
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
      },
    });
  }
  console.log(`✅ Upserted ${writingDrills.length} writing drills`);

  // =========================
  // ADMIN USER SEED
  // =========================
  console.log('🌱 Seeding default admin user...');

  const adminEmail = 'admin@bandready.app';
  const adminPassword = '9{Kd?6Pz7ZSY';
  const adminHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      fullName: 'BandReady Admin',
      role: Role.ADMIN,
      isEmailVerified: true,
      subscriptionTier: 'premium',
    },
  });
  console.log(`✅ Admin user ready → ${adminEmail} / ${adminPassword}`);

  // =========================
  // READING SEED
  // =========================
  await seedReadingContent();

  console.log('🎉 Database seeded successfully with speaking + writing + reading data!');
}

async function seedReadingContent() {
  console.log('🌱 Seeding reading module data...');

  // Check if reading passages already exist (idempotent)
  const existingCount = await prisma.readingPassage.count();
  if (existingCount > 0) {
    console.log(`⏭️  Skipping reading seed — ${existingCount} passages already exist`);
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
          vocabularyTerms: (passageData.vocabularyTerms ?? undefined) as any,
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
    }, { timeout: 60000 });
  }

  console.log(`✅ Created ${totalPassages} reading passages with ${totalQuestions} questions`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export const grammarDrills = [
  // ARTICLE CORRECTION
  {
    id: 'drill-grammar-article-001',
    type: 'MICRO_DRILL',
    category: 'GRAMMAR',
    specificSkill: 'article_correction',
    instruction: 'Correct the article error in the following sentence.',
    content: 'The education is important for success in life.',
    correctAnswer: 'Education is important for success in life.',
    explanation:
      'Abstract nouns used in a general sense do not take "the". "Education" here refers to the concept in general, not a specific education.',
    difficulty: 'EASY',
    timeLimit: 60,
    relatedWeaknesses: ['article_misuse'],
  },
  {
    id: 'drill-grammar-article-002',
    type: 'MICRO_DRILL',
    category: 'GRAMMAR',
    specificSkill: 'article_correction',
    instruction: 'Correct the article error in the following sentence.',
    content: 'She is best student in class.',
    correctAnswer: 'She is the best student in the class.',
    explanation:
      'Superlatives require "the" before them. Also, "class" needs an article when referring to a specific class.',
    difficulty: 'EASY',
    timeLimit: 60,
    relatedWeaknesses: ['article_misuse'],
  },
  {
    id: 'drill-grammar-article-003',
    type: 'MICRO_DRILL',
    category: 'GRAMMAR',
    specificSkill: 'article_correction',
    instruction: 'Correct the article error in the following sentence.',
    content: 'I need to buy a new computer for the university.',
    correctAnswer: 'I need to buy a new computer for university.',
    explanation:
      'When referring to the institution/purpose rather than a specific building, we don\'t use "the" (e.g., "go to school", "at university", "in hospital").',
    difficulty: 'MEDIUM',
    timeLimit: 60,
    relatedWeaknesses: ['article_misuse'],
  },

  // COMMA SPLICE
  {
    id: 'drill-grammar-comma-001',
    type: 'MICRO_DRILL',
    category: 'GRAMMAR',
    specificSkill: 'comma_splice_fix',
    instruction: 'This sentence contains a comma splice. Fix it.',
    content: 'Many students prefer online learning, it offers more flexibility.',
    correctAnswer:
      'Many students prefer online learning because it offers more flexibility.',
    explanation:
      'A comma splice occurs when two independent clauses are joined only by a comma. Fix by using a conjunction, semicolon, or separate sentences.',
    difficulty: 'MEDIUM',
    timeLimit: 90,
    relatedWeaknesses: ['comma_splice'],
  },
  {
    id: 'drill-grammar-comma-002',
    type: 'MICRO_DRILL',
    category: 'GRAMMAR',
    specificSkill: 'comma_splice_fix',
    instruction: 'This sentence contains a comma splice. Fix it.',
    content:
      'The research was comprehensive, however the conclusions were questionable.',
    correctAnswer:
      'The research was comprehensive; however, the conclusions were questionable.',
    explanation:
      'When using transitional words like "however" between independent clauses, use a semicolon before and a comma after.',
    difficulty: 'HARD',
    timeLimit: 90,
    relatedWeaknesses: ['comma_splice'],
  },

  // SUBJECT-VERB AGREEMENT
  {
    id: 'drill-grammar-sva-001',
    type: 'MICRO_DRILL',
    category: 'GRAMMAR',
    specificSkill: 'subject_verb_agreement',
    instruction: 'Correct the subject-verb agreement error.',
    content: 'The number of students who fails the exam have increased.',
    correctAnswer: 'The number of students who fail the exam has increased.',
    explanation:
      '"The number of" takes a singular verb ("has"). Also, "who" refers to "students" (plural), so "fail" not "fails".',
    difficulty: 'HARD',
    timeLimit: 90,
    relatedWeaknesses: ['subject_verb_agreement'],
  },
  {
    id: 'drill-grammar-sva-002',
    type: 'MICRO_DRILL',
    category: 'GRAMMAR',
    specificSkill: 'subject_verb_agreement',
    instruction: 'Correct the subject-verb agreement error.',
    content: 'Each of the students have their own opinion.',
    correctAnswer: 'Each of the students has their own opinion.',
    explanation:
      '"Each" is singular and takes a singular verb, even when followed by "of the [plural noun]".',
    difficulty: 'MEDIUM',
    timeLimit: 90,
    relatedWeaknesses: ['subject_verb_agreement'],
  },
  {
    id: 'drill-grammar-sva-003',
    type: 'MICRO_DRILL',
    category: 'GRAMMAR',
    specificSkill: 'subject_verb_agreement',
    instruction: 'Correct the subject-verb agreement error.',
    content: 'Neither the teacher nor the students was prepared.',
    correctAnswer: 'Neither the teacher nor the students were prepared.',
    explanation:
      'With "neither...nor", the verb agrees with the subject closest to it. Here, "students" is plural, so use "were".',
    difficulty: 'HARD',
    timeLimit: 90,
    relatedWeaknesses: ['subject_verb_agreement'],
  },

  // TENSE ERRORS
  {
    id: 'drill-grammar-tense-001',
    type: 'MICRO_DRILL',
    category: 'GRAMMAR',
    specificSkill: 'tense_consistency',
    instruction: 'Correct the tense error to maintain consistency.',
    content:
      'When I arrived at the office, everyone is already working on the project.',
    correctAnswer:
      'When I arrived at the office, everyone was already working on the project.',
    explanation:
      'When the first clause is in past tense ("arrived"), the second clause should also use past tense to maintain consistency.',
    difficulty: 'MEDIUM',
    timeLimit: 90,
    relatedWeaknesses: ['tense_error'],
  },
  {
    id: 'drill-grammar-tense-002',
    type: 'MICRO_DRILL',
    category: 'GRAMMAR',
    specificSkill: 'tense_consistency',
    instruction: 'Correct the tense error.',
    content: 'By 2030, renewable energy will replace fossil fuels completely.',
    correctAnswer:
      'By 2030, renewable energy will have replaced fossil fuels completely.',
    explanation:
      'Use future perfect ("will have replaced") for actions that will be completed by a specific time in the future.',
    difficulty: 'HARD',
    timeLimit: 90,
    relatedWeaknesses: ['tense_error'],
  },

  // RUN-ON SENTENCES
  {
    id: 'drill-grammar-runon-001',
    type: 'MICRO_DRILL',
    category: 'GRAMMAR',
    specificSkill: 'run_on_fix',
    instruction: 'Fix the run-on sentence.',
    content:
      'Technology has advanced rapidly many people struggle to keep up with the changes.',
    correctAnswer:
      'Technology has advanced rapidly, and many people struggle to keep up with the changes.',
    explanation:
      'This is a run-on sentence (two independent clauses with no punctuation). Fix by adding a comma and conjunction, or using a semicolon.',
    difficulty: 'MEDIUM',
    timeLimit: 90,
    relatedWeaknesses: ['run_on_sentence'],
  },
];

export const vocabularyDrills = [
  // COLLOCATION UPGRADES
  {
    id: 'drill-vocab-colloc-001',
    type: 'MICRO_DRILL',
    category: 'VOCABULARY',
    specificSkill: 'collocation_upgrade',
    instruction: 'Replace the underlined phrase with a more sophisticated collocation.',
    content: 'The government should _make laws_ to protect the environment.',
    correctAnswer: 'The government should enact legislation to protect the environment.',
    explanation:
      '"Enact legislation" is a stronger collocation than "make laws" and demonstrates Band 8 vocabulary.',
    difficulty: 'MEDIUM',
    timeLimit: 60,
    relatedWeaknesses: ['weak_collocation'],
  },
  {
    id: 'drill-vocab-colloc-002',
    type: 'MICRO_DRILL',
    category: 'VOCABULARY',
    specificSkill: 'collocation_upgrade',
    instruction: 'Replace the underlined phrase with a more sophisticated collocation.',
    content: 'This _has a big effect on_ students\' motivation.',
    correctAnswer: 'This has a profound impact on students\' motivation.',
    explanation:
      '"Profound impact" is more academic than "big effect". Other options: "significant influence", "considerable bearing".',
    difficulty: 'MEDIUM',
    timeLimit: 60,
    relatedWeaknesses: ['weak_collocation'],
  },
  {
    id: 'drill-vocab-colloc-003',
    type: 'MICRO_DRILL',
    category: 'VOCABULARY',
    specificSkill: 'collocation_upgrade',
    instruction: 'Replace the underlined phrase with a more sophisticated collocation.',
    content: 'Climate change is a _very important problem_ facing humanity.',
    correctAnswer: 'Climate change is a pressing issue facing humanity.',
    explanation:
      '"Pressing issue" is more precise and academic than "very important problem". Alternatives: "critical challenge", "paramount concern".',
    difficulty: 'MEDIUM',
    timeLimit: 60,
    relatedWeaknesses: ['weak_collocation'],
  },
  {
    id: 'drill-vocab-colloc-004',
    type: 'MICRO_DRILL',
    category: 'VOCABULARY',
    specificSkill: 'collocation_upgrade',
    instruction: 'Replace the underlined phrase with a more sophisticated collocation.',
    content: 'The data _shows a clear pattern_ over time.',
    correctAnswer: 'The data reveals a clear trend over time.',
    explanation:
      '"Reveals a trend" is more precise for academic writing than "shows a pattern". Also consider: "demonstrates a tendency", "exhibits a pattern".',
    difficulty: 'MEDIUM',
    timeLimit: 60,
    relatedWeaknesses: ['weak_collocation'],
  },

  // WORD CHOICE
  {
    id: 'drill-vocab-wordchoice-001',
    type: 'MICRO_DRILL',
    category: 'VOCABULARY',
    specificSkill: 'word_choice',
    instruction: 'Replace the incorrect word with the appropriate one.',
    content: 'The number of crimes has _raised_ significantly.',
    correctAnswer: 'The number of crimes has risen significantly.',
    explanation:
      '"Rise" is intransitive (doesn\'t take an object). "Raise" is transitive (needs an object). Since crime numbers increase by themselves, use "risen".',
    difficulty: 'MEDIUM',
    timeLimit: 60,
    relatedWeaknesses: ['word_choice_error'],
  },
  {
    id: 'drill-vocab-wordchoice-002',
    type: 'MICRO_DRILL',
    category: 'VOCABULARY',
    specificSkill: 'word_choice',
    instruction: 'Replace the incorrect word with the appropriate one.',
    content: 'This policy will _affect_ positive change in society.',
    correctAnswer: 'This policy will effect positive change in society.',
    explanation:
      '"Effect" as a verb means "to bring about". "Affect" means "to influence". To "effect change" = to cause/create change.',
    difficulty: 'HARD',
    timeLimit: 60,
    relatedWeaknesses: ['word_choice_error'],
  },
  {
    id: 'drill-vocab-wordchoice-003',
    type: 'MICRO_DRILL',
    category: 'VOCABULARY',
    specificSkill: 'word_choice',
    instruction: 'Replace the incorrect word with the appropriate one.',
    content: 'The results of the experiment were _alternate_.',
    correctAnswer: 'The results of the experiment were alternative.',
    explanation:
      '"Alternate" means occurring in turns. "Alternative" means available as another possibility. Here, we need "alternative".',
    difficulty: 'MEDIUM',
    timeLimit: 60,
    relatedWeaknesses: ['word_choice_error'],
  },

  // AVOIDING REPETITION
  {
    id: 'drill-vocab-repetition-001',
    type: 'MICRO_DRILL',
    category: 'VOCABULARY',
    specificSkill: 'paraphrasing',
    instruction: 'Rewrite to avoid repetition of "important".',
    content: 'Education is important because it plays an important role in society.',
    correctAnswer: 'Education is crucial because it plays a vital role in society.',
    explanation:
      'Avoid repeating the same word. Use synonyms like: crucial, vital, essential, significant, pivotal.',
    difficulty: 'EASY',
    timeLimit: 60,
    relatedWeaknesses: ['repetition'],
  },
  {
    id: 'drill-vocab-repetition-002',
    type: 'MICRO_DRILL',
    category: 'VOCABULARY',
    specificSkill: 'paraphrasing',
    instruction: 'Rewrite to avoid repetition of "increase".',
    content:
      'The graph shows an increase in sales. This increase was due to better marketing.',
    correctAnswer:
      'The graph shows an increase in sales. This rise was due to better marketing.',
    explanation:
      'When describing data, vary your vocabulary: rise, growth, surge, upturn, escalation.',
    difficulty: 'EASY',
    timeLimit: 90,
    relatedWeaknesses: ['repetition'],
  },

  // ACADEMIC REGISTER
  {
    id: 'drill-vocab-register-001',
    type: 'MICRO_DRILL',
    category: 'VOCABULARY',
    specificSkill: 'academic_register',
    instruction: 'Rewrite in a more academic register.',
    content: 'A lot of people think that money is really important.',
    correctAnswer: 'Many individuals believe that financial resources are significant.',
    explanation:
      'Academic writing avoids informal phrases: "a lot of" → "many/numerous", "really" → remove or use "extremely", "money" → "financial resources/capital".',
    difficulty: 'MEDIUM',
    timeLimit: 90,
    relatedWeaknesses: ['informal_register'],
  },
  {
    id: 'drill-vocab-register-002',
    type: 'MICRO_DRILL',
    category: 'VOCABULARY',
    specificSkill: 'academic_register',
    instruction: 'Rewrite in a more academic register.',
    content: 'Kids these days spend too much time on their phones.',
    correctAnswer:
      'Contemporary youth devote excessive time to mobile devices.',
    explanation:
      '"Kids" → "children/youth/young people", "these days" → "currently/nowadays/in contemporary society", "phones" → "mobile devices/smartphones".',
    difficulty: 'MEDIUM',
    timeLimit: 90,
    relatedWeaknesses: ['informal_register'],
  },
];

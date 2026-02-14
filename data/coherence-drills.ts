export const coherenceDrills = [
  // DISCOURSE MARKERS
  {
    id: 'drill-coherence-discourse-001',
    type: 'MICRO_DRILL',
    category: 'COHERENCE',
    specificSkill: 'discourse_markers',
    instruction: 'Add an appropriate discourse marker to improve coherence.',
    content:
      'Online shopping is convenient. Many people prefer traditional stores for certain purchases.',
    correctAnswer:
      'Online shopping is convenient. However, many people prefer traditional stores for certain purchases.',
    explanation:
      'The second sentence contrasts with the first, so we need a contrastive discourse marker like "However", "Nevertheless", or "Nonetheless".',
    difficulty: 'EASY',
    timeLimit: 60,
    relatedWeaknesses: ['missing_discourse_marker'],
  },
  {
    id: 'drill-coherence-discourse-002',
    type: 'MICRO_DRILL',
    category: 'COHERENCE',
    specificSkill: 'discourse_markers',
    instruction: 'Add an appropriate discourse marker to improve coherence.',
    content:
      'The government invested heavily in infrastructure. Economic growth accelerated.',
    correctAnswer:
      'The government invested heavily in infrastructure. Consequently, economic growth accelerated.',
    explanation:
      'The second sentence is a result of the first, so we need a causal marker like "Consequently", "Therefore", "As a result", or "Hence".',
    difficulty: 'EASY',
    timeLimit: 60,
    relatedWeaknesses: ['missing_discourse_marker'],
  },
  {
    id: 'drill-coherence-discourse-003',
    type: 'MICRO_DRILL',
    category: 'COHERENCE',
    specificSkill: 'discourse_markers',
    instruction: 'Add an appropriate discourse marker to improve coherence.',
    content:
      'Renewable energy is sustainable. It reduces carbon emissions and creates jobs.',
    correctAnswer:
      'Renewable energy is sustainable. Moreover, it reduces carbon emissions and creates jobs.',
    explanation:
      'The second sentence adds additional information supporting the first, so use additive markers like "Moreover", "Furthermore", "Additionally", or "In addition".',
    difficulty: 'EASY',
    timeLimit: 60,
    relatedWeaknesses: ['missing_discourse_marker'],
  },

  // TOPIC SENTENCES
  {
    id: 'drill-coherence-topic-001',
    type: 'MICRO_DRILL',
    category: 'COHERENCE',
    specificSkill: 'topic_sentence',
    instruction:
      'Write a clear topic sentence for a paragraph discussing the benefits of exercise.',
    content: '',
    correctAnswer:
      'Regular physical exercise provides numerous health benefits that extend beyond physical fitness.',
    explanation:
      'A strong topic sentence clearly states the main idea and gives direction to the paragraph. It should be specific enough to guide the reader but broad enough to cover all supporting points.',
    difficulty: 'MEDIUM',
    timeLimit: 120,
    relatedWeaknesses: ['missing_topic_sentence'],
  },
  {
    id: 'drill-coherence-topic-002',
    type: 'MICRO_DRILL',
    category: 'COHERENCE',
    specificSkill: 'topic_sentence',
    instruction:
      'Write a clear topic sentence for a paragraph discussing disadvantages of social media.',
    content: '',
    correctAnswer:
      'Despite its popularity, social media poses several significant drawbacks for users.',
    explanation:
      'This topic sentence clearly signals that the paragraph will discuss negative aspects, setting up reader expectations effectively.',
    difficulty: 'MEDIUM',
    timeLimit: 120,
    relatedWeaknesses: ['missing_topic_sentence'],
  },

  // PRONOUN REFERENCE
  {
    id: 'drill-coherence-pronoun-001',
    type: 'MICRO_DRILL',
    category: 'COHERENCE',
    specificSkill: 'clear_reference',
    instruction: 'Clarify the unclear pronoun reference.',
    content:
      'When teachers assign homework to students, they often complain about it.',
    correctAnswer:
      'When teachers assign homework to students, the students often complain about it.',
    explanation:
      'It\'s unclear whether "they" refers to teachers or students. Always ensure pronouns have clear antecedents.',
    difficulty: 'MEDIUM',
    timeLimit: 90,
    relatedWeaknesses: ['unclear_reference'],
  },
  {
    id: 'drill-coherence-pronoun-002',
    type: 'MICRO_DRILL',
    category: 'COHERENCE',
    specificSkill: 'clear_reference',
    instruction: 'Clarify the unclear pronoun reference.',
    content:
      'The company increased prices while reducing quality. This led to customer dissatisfaction.',
    correctAnswer:
      'The company increased prices while reducing quality. This combination led to customer dissatisfaction.',
    explanation:
      'While "this" works grammatically, "this combination" or "this decision" is clearer and more specific.',
    difficulty: 'MEDIUM',
    timeLimit: 90,
    relatedWeaknesses: ['unclear_reference'],
  },

  // LOGICAL FLOW
  {
    id: 'drill-coherence-flow-001',
    type: 'MICRO_DRILL',
    category: 'COHERENCE',
    specificSkill: 'logical_flow',
    instruction: 'Reorder these sentences for better logical flow.',
    content:
      '[A] Therefore, cities must invest in sustainable transportation. [B] Traffic congestion causes pollution and wastes time. [C] Public transit reduces the number of cars on roads.',
    correctAnswer:
      '[B] Traffic congestion causes pollution and wastes time. [C] Public transit reduces the number of cars on roads. [A] Therefore, cities must invest in sustainable transportation.',
    explanation:
      'Logical flow: Problem (B) → Solution (C) → Conclusion (A). Ideas should progress from identification to solution to recommendation.',
    difficulty: 'HARD',
    timeLimit: 120,
    relatedWeaknesses: ['illogical_flow'],
  },

  // PARAGRAPH UNITY
  {
    id: 'drill-coherence-unity-001',
    type: 'MICRO_DRILL',
    category: 'COHERENCE',
    specificSkill: 'paragraph_unity',
    instruction: 'Identify which sentence disrupts paragraph unity.',
    content:
      '[1] Online education offers unprecedented flexibility. [2] Students can learn at their own pace and schedule. [3] Traditional universities have beautiful campuses. [4] This flexibility particularly benefits working professionals.',
    correctAnswer: 'Sentence 3 disrupts unity',
    explanation:
      'Sentence [3] about campus beauty is irrelevant to the paragraph\'s focus on online education flexibility. Remove it to maintain unity.',
    difficulty: 'MEDIUM',
    timeLimit: 90,
    relatedWeaknesses: ['illogical_flow', 'paragraph_break_needed'],
  },
];

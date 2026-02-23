const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const WRITING_SYSTEM_PROMPT = `You are an expert IELTS Writing examiner with 15+ years of experience. You assess essays with STRICT adherence to official IELTS Writing Band Descriptors.

CRITICAL: You grade CONSERVATIVELY. IELTS examiners do not give benefit of the doubt. If in doubt, grade DOWN, not up.

You assess EXACTLY four criteria, each weighted equally:

## TASK RESPONSE (TR)
Band 9: Fully addresses all parts. Clear position throughout. Fully extended and well-supported ideas.
Band 8: Sufficiently addresses all parts. Clear position throughout. Well-developed ideas with relevant, extended support.
Band 7: Addresses all parts. Clear position throughout. Main ideas extended but may over-generalize or lack focus.
Band 6: Addresses all parts but some more fully than others. Position relevant but conclusions may be unclear. Main ideas relevant but some inadequately developed.
Band 5: Addresses task only partially. Position not always clear. Main ideas limited, inadequately developed. May be repetitive.

## COHERENCE AND COHESION (CC)
Band 9: Cohesion attracts no attention. Paragraphing is skillfully managed.
Band 8: Sequences information and ideas logically. Manages all aspects of cohesion well. Paragraphing is sufficient and appropriate.
Band 7: Logically organizes information and ideas. Clear progression throughout. Uses cohesive devices appropriately though may be over/under-used. Clear central topic in each paragraph.
Band 6: Arranges information coherently with clear overall progression. Uses cohesive devices effectively but may be faulty or mechanical. May not always use referencing clearly. Paragraphing may not always be logical.
Band 5: Presents information with some organization but no overall progression. Makes inadequate, inaccurate, or over-use of cohesive devices. May be repetitive due to lack of referencing. May not write in paragraphs or may be confusing.

## LEXICAL RESOURCE (LR)
Band 9: Wide range of vocabulary with very natural and sophisticated control. Rare minor errors only as "slips."
Band 8: Wide range fluently and flexibly. Skillfully uses uncommon items. Rare errors in spelling/word formation.
Band 7: Sufficient range for flexibility and precision. Uses less common items with some awareness of style and collocation. May produce occasional errors in word choice, spelling, or formation.
Band 6: Adequate range for the task. Attempts less common vocabulary but with some inaccuracy. Makes some errors in spelling and/or word formation that do not impede communication.
Band 5: Limited range, minimally adequate for task. May make noticeable errors in spelling and/or word formation that may cause difficulty for reader.

## GRAMMATICAL RANGE AND ACCURACY (GRA)
Band 9: Wide range of structures with full flexibility and accuracy. Rare minor errors only as "slips."
Band 8: Wide range of structures. Majority of sentences are error-free. Makes only very occasional errors or inappropriacies.
Band 7: Variety of complex structures. Frequent error-free sentences. Good control of grammar and punctuation but may make a few errors.
Band 6: Mix of simple and complex structures. Makes some errors in grammar and punctuation but these rarely reduce communication.
Band 5: Limited range of structures. Attempts complex sentences but these tend to be less accurate. Frequent grammatical errors that may cause some difficulty for the reader. Punctuation may be faulty.

## SCORING RULES:
1. Be STRICT - real IELTS examiners are conservative
2. A single criterion CANNOT be more than 1 band above the lowest criterion
3. Repeated errors of the same type indicate a systematic weakness - penalize accordingly
4. Word count violations: Under minimum = cap at Band 5 for Task Response
5. Off-topic or partially addressed = cap at Band 5 for Task Response
6. Calculate overall as arithmetic mean, rounded to nearest 0.5

## ERROR DETECTION:
You must identify and categorize ALL errors into:
- GRAMMAR: article_misuse, subject_verb_agreement, tense_error, comma_splice, run_on_sentence, fragment, conditional_error, passive_voice_error, pronoun_reference
- VOCABULARY: weak_collocation, word_choice_error, informal_register, repetition, spelling_error
- COHERENCE: missing_discourse_marker, unclear_reference, paragraph_break_needed, illogical_flow, missing_topic_sentence
- TASK_RESPONSE: off_topic, position_unclear, underdeveloped_idea, missing_conclusion, no_examples`;

const generateTask2AssessmentPrompt = ({ question, questionType, essayText, wordCount, timeSpent }) => {
  return `## ASSESSMENT REQUEST

### Question Type
${questionType} (e.g., Opinion, Discussion, Problem-Solution, Advantages-Disadvantages, Two-Part)

### Question
"${question}"

### Essay Metadata
- Word Count: ${wordCount} (Target: 250+)
- Time Spent: ${Math.floor(timeSpent / 60)} minutes

### Essay
"""
${essayText}
"""

## YOUR TASK
Assess this essay with STRICT examiner standards. Return JSON:

\`\`\`json
{
  "scores": {
    "taskResponse": <number 0-9 in 0.5 increments>,
    "coherenceCohesion": <number 0-9 in 0.5 increments>,
    "lexicalResource": <number 0-9 in 0.5 increments>,
    "grammaticalRangeAccuracy": <number 0-9 in 0.5 increments>,
    "overall": <number 0-9 in 0.5 increments>
  },
  "feedback": {
    "taskResponse": "<2-3 sentences on how well task was addressed>",
    "coherenceCohesion": "<2-3 sentences on organization and linking>",
    "lexicalResource": "<2-3 sentences on vocabulary with examples>",
    "grammaticalRangeAccuracy": "<2-3 sentences on grammar with examples>",
    "overall": "<3-4 sentences summarizing and stating top priority>"
  },
  "annotations": [
    {
      "startIndex": <character position>,
      "endIndex": <character position>,
      "color": "red" | "yellow" | "green" | "blue",
      "type": "<error_type from categories above>",
      "explanation": "<why this is marked>"
    }
  ],
  "examinerInsights": [
    {
      "sentence": "<exact sentence from essay>",
      "issue": "<what's wrong>",
      "bandImpact": "<e.g., 'This caps Grammar at 6.0 because...'>"
    }
  ],
  "detectedErrors": [
    {
      "category": "GRAMMAR" | "VOCABULARY" | "COHERENCE" | "TASK_RESPONSE",
      "specificError": "<error_type>",
      "sentence": "<sentence containing error>",
      "correction": "<corrected version>"
    }
  ],
  "priorityFixes": [
    {
      "issue": "<what to fix>",
      "explanation": "<why it matters>",
      "drillType": "<related drill category>"
    }
  ],
  "vocabularySuggestions": [
    {
      "original": "<weak phrase>",
      "suggested": "<Band 8 alternative>",
      "context": "<why better>"
    }
  ]
}
\`\`\`

Be thorough. Every error should be caught. Be strict but fair.`;
};

async function run() {
  const userPrompt = generateTask2AssessmentPrompt({
    question: "Some people prefer to spend their lives doing the same things and avoiding change. Others, however, think that change is always a good thing.\n\nDiscuss both these views and give your own opinion.",
    questionType: "discussion",
    essayText: `Some individuals prefer to live a stable life by doing familiar activities and avoiding change, while others believe that change is always beneficial. This essay will discuss both perspectives before explaining why I believe a balanced approach to change is the most sensible.

On the one hand, many people value routine because it provides a sense of security and predictability. By maintaining consistent habits, individuals can reduce stress and avoid the uncertainty that often accompanies major changes. For example, people who remain in the same profession for many years may develop deep expertise and enjoy long-term financial stability. In addition, avoiding frequent change can help individuals maintain strong relationships and a stable lifestyle, which is particularly important for those with family responsibilities.

On the other hand, proponents of change argue that it is essential for personal growth and development. Embracing change allows individuals to acquire new skills, adapt to evolving circumstances, and discover new opportunities. In today’s rapidly changing world, those who resist change may struggle to remain relevant, particularly in the workplace. For instance, professionals who continually update their skills are more likely to progress in their careers than those who rely solely on past experience. Moreover, change can lead to greater self-awareness and resilience by encouraging people to step outside their comfort zones.

In my opinion, although change is not always easy, it is generally beneficial when approached thoughtfully. While excessive or unnecessary change can be disruptive, refusing to change altogether may limit personal and professional growth. Therefore, individuals should seek a balance between stability and adaptability in order to lead fulfilling and successful lives.`,
    wordCount: 267,
    timeSpent: 3*60
  });

  try {
    console.log('Calling Claude...');
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      temperature: 0.3,
      system: WRITING_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = response.content[0];
    const jsonMatch = content.text.match(/```json\s*([\s\S]*?)\s*```/);
    if (!jsonMatch) {
      console.error('Failed to parse JSON blocks! Raw text was:', content.text);
    } else {
      console.log('JSON parsed successfully.');
    }
  } catch(e) {
    console.error(e);
  }
}
run();

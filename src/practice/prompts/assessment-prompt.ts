export const SYSTEM_PROMPT = `You are an expert IELTS Speaking examiner with 15+ years of experience. You assess candidates based on the official IELTS Speaking Band Descriptors.

Your role is to:
1. Analyze transcribed speech from IELTS practice sessions
2. Provide accurate band score estimates (to the nearest 0.5)
3. Give specific, actionable feedback for improvement
4. Identify patterns that affect scores

You assess EXACTLY four criteria, each weighted equally:

## FLUENCY AND COHERENCE (FC)
- Band 9: Speaks fluently with only rare repetition or self-correction. Speech is coherent with fully appropriate cohesive features.
- Band 7: Speaks at length without noticeable effort. May demonstrate language-related hesitation at times. Uses a range of connectives.
- Band 5: Usually maintains flow of speech but uses repetition and self-correction. May over-use certain connectives.

## LEXICAL RESOURCE (LR)
- Band 9: Uses vocabulary with full flexibility and precision in all topics. Uses idiomatic language naturally.
- Band 7: Uses vocabulary resource flexibly to discuss a variety of topics. Uses some less common and idiomatic vocabulary.
- Band 5: Manages to talk about most familiar and unfamiliar topics but uses vocabulary with limited flexibility.

## GRAMMATICAL RANGE AND ACCURACY (GRA)
- Band 9: Uses a full range of structures naturally and appropriately. Produces consistently accurate structures.
- Band 7: Uses a range of complex structures with some flexibility. Frequently produces error-free sentences.
- Band 5: Uses basic sentence forms with reasonable accuracy. May make frequent mistakes with complex structures.

## PRONUNCIATION (P)
- Band 9: Uses the full range of pronunciation features with precision and subtlety. Sustained flexible use of features.
- Band 7: Shows all positive features of Band 6 and some of Band 8. Is easy to understand throughout.
- Band 5: Shows all positive features of Band 4 but may still have frequent L1 influence.

## IMPORTANT SCORING NOTES:
- The final score is the arithmetic mean of all four criteria, rounded to nearest 0.5
- Be precise but fair - don't inflate or deflate scores
- Consider the test part context (Part 1 expects shorter answers, Part 2 expects 1-2 min monologue, Part 3 expects developed opinions)
- Filler words like "um", "uh", "like", "you know" affect Fluency score
- Long pauses (>2 seconds) significantly impact Fluency
- Self-corrections can be positive (shows awareness) if not excessive
- Nigerian/African English accents are valid - assess intelligibility, not accent`;

export function generateAssessmentPrompt(params: {
  part: 1 | 2 | 3;
  question: string;
  transcript: string;
  audioDuration: number;
  wordsPerMinute: number;
  fillerWords: { word: string; count: number }[];
  pauseCount: number;
  longPauseCount: number;
  cueCardPoints?: string[];
}): string {
  const partContext = {
    1: 'Part 1 (Introduction & Interview): Candidates answer questions about familiar topics. Answers should be 2-4 sentences.',
    2: 'Part 2 (Long Turn): Candidates speak for 1-2 minutes on a topic card. Should cover all cue card points.',
    3: 'Part 3 (Discussion): Candidates discuss more abstract ideas. Answers should be detailed with examples and justification.',
  };

  let prompt = `## CONTEXT
Test Part: ${partContext[params.part]}

## QUESTION
"${params.question}"
`;

  if (params.part === 2 && params.cueCardPoints?.length) {
    prompt += `
## CUE CARD POINTS TO ADDRESS
${params.cueCardPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}
`;
  }

  prompt += `
## CANDIDATE'S RESPONSE (TRANSCRIPT)
"${params.transcript}"

## AUDIO METRICS
- Speaking duration: ${params.audioDuration.toFixed(1)} seconds
- Words per minute: ${params.wordsPerMinute.toFixed(0)} WPM
- Total filler words: ${params.fillerWords.reduce((sum, f) => sum + f.count, 0)}
${params.fillerWords.length > 0 ? '- Filler breakdown: ' + params.fillerWords.map(f => f.word + ' (x' + f.count + ')').join(', ') : ''}
- Pause count: ${params.pauseCount}
- Long pauses (>2s): ${params.longPauseCount}

## YOUR TASK
Analyze this response and provide your assessment in the following JSON format:

\`\`\`json
{
  "scores": {
    "overall": <number 0-9 in 0.5 increments>,
    "fluency": <number 0-9 in 0.5 increments>,
    "lexical": <number 0-9 in 0.5 increments>,
    "grammar": <number 0-9 in 0.5 increments>,
    "pronunciation": <number 0-9 in 0.5 increments>
  },
  "feedback": {
    "fluency": "<2-3 sentences on fluency and coherence>",
    "vocabulary": "<2-3 sentences on lexical resource>",
    "grammar": "<2-3 sentences on grammatical range and accuracy>",
    "pronunciation": "<2-3 sentences on pronunciation>",
    "overall": "<3-4 sentences summary with top 2 priorities for improvement>"
  },
  "suggestions": {
    "vocabulary": [
      {"original": "<word/phrase used>", "suggested": "<better alternative>", "reason": "<why it's better>"}
    ],
    "grammar": [
      {"error": "<grammatical error>", "correction": "<correct form>", "rule": "<grammar rule>"}
    ]
  },
  "highlights": {
    "strengths": ["<strength 1>", "<strength 2>"],
    "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
  }
}
\`\`\`

IMPORTANT: Return ONLY the JSON, no additional text.`;

  return prompt;
}

export function generateModelAnswerPrompt(params: {
  part: 1 | 2 | 3;
  question: string;
  targetBand: number;
  cueCardPoints?: string[];
}): string {
  const bandLevel = params.targetBand >= 7.5 ? 'advanced' : params.targetBand >= 6.5 ? 'good' : 'competent';
  
  let prompt = `Generate a model IELTS Speaking answer for the following:

## Question
"${params.question}"

## Test Part
Part ${params.part}
`;

  if (params.part === 2 && params.cueCardPoints?.length) {
    prompt += `
## Cue Card Points
${params.cueCardPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}
`;
  }

  prompt += `
## Target Level
Band ${params.targetBand} (${bandLevel} user)

## Requirements
Generate a model answer that would score Band ${params.targetBand}. Include:
1. Natural speech patterns (minimal but realistic hesitation)
2. ${bandLevel}-level vocabulary and structures
3. Appropriate length for Part ${params.part}

Return JSON format:
\`\`\`json
{
  "modelAnswer": "<the full answer text>",
  "keyVocabulary": ["<word1>", "<word2>", "<word3>"],
  "grammarHighlights": ["<structure1>", "<structure2>"]
}
\`\`\``;

  return prompt;
}

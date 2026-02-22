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

## EXAMINER MINDSET
You are a trained IELTS examiner who wants candidates to demonstrate their best ability.
Your job is to find evidence of competence, not hunt for errors.
Ask yourself: "What CAN this candidate do?" before "What mistakes did they make?"

## CRITICAL SCORING RULES
1. COMMUNICATION OVER PERFECTION
   - IELTS rewards communicative effectiveness, not grammatical perfection
   - If meaning is clear, minor errors MUST NOT reduce band scores
   - Band 7+ candidates ARE EXPECTED to make some errors

2. PAUSE AND FILLER TOLERANCE
   - Pauses for thinking are NORMAL in spoken English
   - Fillers (um, uh, like) are natural speech features
   - Only penalize when hesitation DISRUPTS meaning or flow significantly
   - A speaker with pauses can still score Band 8+ if communication is clear

3. NO DOUBLE PENALTIES
   - Each error type should be penalized ONCE only
   - Do NOT cascade the same issue across Fluency, Grammar, Lexical, and Overall
   - Example: "more bigger" is ONE grammar error, not four deductions

4. IDIOMS NOT REQUIRED
   - Idiomatic language is NOT required for Band 7, 7.5, or even 8
   - Clear, precise vocabulary is sufficient for high bands
   - Penalize only if vocabulary is LIMITED or REPETITIVE

5. BAND ANCHORING (CRITICAL)
   Before assigning scores, mentally compare this response to typical IELTS samples:
   - Band 6.0: Communicates but with noticeable strain, frequent errors affecting clarity
   - Band 6.5: Generally effective, errors present but rarely impede communication
   - Band 7.0: Communicates well, errors occur but do not reduce understanding
   - Band 7.5: Flexible and fluent, only occasional minor slips
   - Band 8.0+: Effortless communication, errors are rare and insignificant
   
   If the response is clearly stronger than typical Band 6.5, score MUST be at least 7.0.
   If communication is smooth with only minor slips, score MUST be at least 7.5.

## AUDIO METRICS USAGE
- WPM, pause counts, and filler counts are DIAGNOSTIC TOOLS only
- Use them to EXPLAIN feedback and suggest improvements
- They MUST NOT directly determine or reduce band scores
- Never say "your WPM was low so your fluency score is reduced"

## FINAL FAIRNESS CHECK
Before returning scores, ask: "Would a trained, fair IELTS examiner agree with this score?"
If the score feels harsh relative to communicative effectiveness, adjust upward to the nearest justified band.

## IMPORTANT CONTEXT
- The final score is the arithmetic mean of all four criteria, rounded to nearest 0.5
- Consider the test part context (Part 1 expects shorter answers, Part 2 expects 1-2 min monologue, Part 3 expects developed opinions)
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

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON
2. Ensure all strings are properly escaped (use \\" for quotes inside strings)
3. Do not include any trailing commas
4. Complete the entire JSON structure - do not truncate
5. No additional text before or after the JSON`;

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
{
  "modelAnswer": "<the full answer text>",
  "keyVocabulary": ["<word1>", "<word2>", "<word3>"],
  "grammarHighlights": ["<structure1>", "<structure2>"]
}`;

  return prompt;
}

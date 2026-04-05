export const generateDrillFeedbackPrompt = ({
  drillType,
  category,
  instruction,
  content,
  correctAnswer,
  userAnswer,
  nativeLanguage,
  mode,
}: {
  drillType: string;
  category: string;
  instruction: string;
  content: string;
  correctAnswer: string;
  userAnswer: string;
  nativeLanguage?: string | null;
  mode?: 'validate' | 'feedback_only';
}) => {
  const languageContext = nativeLanguage
    ? `\n## STUDENT PROFILE\nThe student is a native ${nativeLanguage} speaker. Consider common grammar/vocabulary transfer errors typical for ${nativeLanguage} to English translation in your feedback.\n`
    : '';

  // Build category-specific evaluation criteria
  const categoryNorm = category.toLowerCase();
  let categoryCriteria = '';

  if (categoryNorm === 'grammar') {
    categoryCriteria = `
## EVALUATION CRITERIA (Grammar Correction)
- Accept ANY grammatically valid correction of the original error.
- The user's correction does NOT need to match the model answer word-for-word.
- Multiple valid fixes exist (e.g., semicolon vs. period vs. conjunction for run-ons).
- Mark as correct if the specific grammar error has been fixed AND no new errors introduced.`;
  } else if (categoryNorm === 'vocabulary') {
    categoryCriteria = `
## EVALUATION CRITERIA (Vocabulary Upgrade)
- Accept any accurate synonym or collocation upgrade.
- The replacement must be natural in context and at least equal register level.
- Multiple valid collocations exist for most pairs.`;
  } else if (categoryNorm === 'coherence') {
    categoryCriteria = `
## EVALUATION CRITERIA (Coherence/Cohesion)
- Accept any answer that correctly fulfills the coherence task.
- For discourse markers: accept any semantically appropriate linker.
- For paragraph rewrites: focus on whether the structural issue was resolved.`;
  } else if (categoryNorm === 'task_response') {
    categoryCriteria = `
## EVALUATION CRITERIA (Task Response)
- Accept any answer that demonstrates an understanding of the task requirements.
- For thesis statements: accept any clear position that addresses the prompt.
- For supporting ideas: accept any relevant, logically sound point.
- Focus on whether the response would score well on IELTS Task Response criteria.`;
  }

  return `You are an IELTS Writing tutor providing feedback on a practice drill.
${languageContext}
## DRILL DETAILS
Type: ${drillType}
Category: ${category}
Instruction: "${instruction}"
Original Content: "${content}"

## ANSWERS
Correct Answer: "${correctAnswer}"
User's Answer: "${userAnswer}"

## YOUR TASK
${
  mode === 'validate'
    ? 'Evaluate if the user\'s answer correctly and effectively fulfills the drill instruction compared to the suggested Correct Answer. If it is a valid alternative formulation, mark it as correct. Provide constructive feedback.'
    : 'The user\'s answer does not match the expected answer. Evaluate whether it could still be considered correct (set isCorrect accordingly). Explain what is wrong and why the Correct Answer is better, or confirm the answer is valid if it is a reasonable alternative.'
}

Return JSON:

\`\`\`json
{
  "isCorrect": <boolean>,
  "feedback": "<2-3 sentences explaining why the answer is correct/incorrect>",
  "relatedConcept": "<the grammar/vocabulary concept being tested>",
  "additionalExamples": [
    "<similar example 1>",
    "<similar example 2>"
  ]
}
\`\`\`
${categoryCriteria}

## GENERAL EVALUATION CRITERIA:
- If the user's answer is semantically equivalent to the correct answer, mark it as correct. For open-ended rewrites, accept valid alternative expressions.
- Minor spelling errors should not count as incorrect if the meaning is clear.
- Focus on whether the core grammar/vocabulary/coherence issue has been addressed.
- Be encouraging but honest in feedback.`;
};

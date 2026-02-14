export const generateDrillFeedbackPrompt = ({
  drillType,
  category,
  instruction,
  content,
  correctAnswer,
  userAnswer,
}: {
  drillType: string;
  category: string;
  instruction: string;
  content: string;
  correctAnswer: string;
  userAnswer: string;
}) => {
  return `You are an IELTS Writing tutor providing feedback on a practice drill.

## DRILL DETAILS
Type: ${drillType}
Category: ${category}
Instruction: "${instruction}"
Original Content: "${content}"

## ANSWERS
Correct Answer: "${correctAnswer}"
User's Answer: "${userAnswer}"

## YOUR TASK
Evaluate if the user's answer is correct and provide constructive feedback. Return JSON:

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

EVALUATION CRITERIA:
- If the user's answer is semantically equivalent to the correct answer, mark it as correct
- Minor spelling errors should not count as incorrect if the meaning is clear
- Focus on whether the core grammar/vocabulary issue has been addressed
- Be encouraging but honest in feedback`;
};

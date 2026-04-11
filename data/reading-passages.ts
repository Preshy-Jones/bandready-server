import { ReadingPassageSeed } from './reading-passages-types';
import { academicEasyPassages } from './reading-passages-academic-easy';
import { academicMediumPassages } from './reading-passages-academic-medium';
import { academicHardPassages } from './reading-passages-academic-hard';
import { generalTrainingPassages } from './reading-passages-gt';

export type { ReadingPassageSeed };

export const allReadingPassages: ReadingPassageSeed[] = [
  ...academicEasyPassages,
  ...academicMediumPassages,
  ...academicHardPassages,
  ...generalTrainingPassages,
];

// Re-export for convenience
export {
  academicEasyPassages,
  academicMediumPassages,
  academicHardPassages,
  generalTrainingPassages,
};

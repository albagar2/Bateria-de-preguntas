// ============================================
// Spaced Repetition Algorithm (SM-2 variant)
// For intelligent question repetition
// ============================================

/**
 * Calculate next review date and ease factor
 * Based on SuperMemo SM-2 algorithm
 * @param {number} quality - Answer quality (0-5)
 *   0: Complete failure
 *   1: Incorrect, remembered after seeing answer
 *   2: Incorrect, but close
 *   3: Correct with serious difficulty
 *   4: Correct with hesitation
 *   5: Perfect response
 * @param {number} easeFactor - Current ease factor (min 1.3)
 * @param {number} interval - Current interval in days
 * @returns {{ nextInterval: number, nextEaseFactor: number, nextReview: Date }}
 */
function calculateSpacedRepetition(quality, easeFactor = 2.5, interval = 1) {
  let nextEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Minimum ease factor is 1.3
  if (nextEaseFactor < 1.3) nextEaseFactor = 1.3;

  let nextInterval;

  if (quality < 3) {
    // Failed — reset interval
    nextInterval = 1;
  } else {
    if (interval === 1) {
      nextInterval = 1;
    } else if (interval === 2) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(interval * nextEaseFactor);
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + nextInterval);

  return {
    nextInterval,
    nextEaseFactor: Math.round(nextEaseFactor * 100) / 100,
    nextReview,
  };
}

/**
 * Convert boolean correct/incorrect to SM-2 quality score
 * @param {boolean} isCorrect
 * @param {number} responseTimeMs - Response time in ms
 * @returns {number} quality 0-5
 */
function getQualityFromAnswer(isCorrect, responseTimeMs = null) {
  if (!isCorrect) return 1;

  // If response time is available, use it to determine quality
  if (responseTimeMs !== null) {
    if (responseTimeMs < 5000) return 5;   // < 5s = perfect
    if (responseTimeMs < 15000) return 4;  // < 15s = good
    if (responseTimeMs < 30000) return 3;  // < 30s = acceptable
    return 3;
  }

  return 4; // Default correct quality
}

module.exports = { calculateSpacedRepetition, getQualityFromAnswer };

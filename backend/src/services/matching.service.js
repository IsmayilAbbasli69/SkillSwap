const LEVEL_RANK = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3
};

const getCategory = score => {
  if (score >= 75) {
    return "EXCELLENT";
  }
  if (score >= 50) {
    return "GOOD";
  }
  if (score >= 1) {
    return "AVAILABLE";
  }
  return "NOT_MATCHED";
};

const calculateMatchScore = (currentUser, candidate, context) => {
  let score = 0;

  if (context.reciprocal) {
    score += 50;
  }

  if (currentUser.unitId && currentUser.unitId === candidate.profile.unit_id) {
    score += 20;
  }

  const requestedLevel = context.requestedLevel;
  const offeredLevel = candidate.offeredSkill.level;
  if (!requestedLevel || LEVEL_RANK[offeredLevel] >= LEVEL_RANK[requestedLevel]) {
    score += 30;
  }

  return {
    score,
    category: getCategory(score),
    reciprocal: context.reciprocal
  };
};

module.exports = {
  LEVEL_RANK,
  calculateMatchScore
};

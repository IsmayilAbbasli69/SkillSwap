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
  const reasons = [];

  if (context.reciprocal) {
    score += 50;
    reasons.push("You can help each other with wanted skills");
  }

  if (currentUser.unitId && currentUser.unitId === candidate.profile.unit_id) {
    score += 20;
    reasons.push("You are in the same institution unit");
  }

  const requestedLevel = context.requestedLevel;
  const offeredLevel = candidate.offeredSkill?.level;
  if (offeredLevel && (!requestedLevel || LEVEL_RANK[offeredLevel] >= LEVEL_RANK[requestedLevel])) {
    score += 30;
    reasons.push(requestedLevel ? "Their experience meets your requested level" : "They offer the selected skill");
  }

  return {
    score,
    reasons,
    category: getCategory(score),
    reciprocal: context.reciprocal
  };
};

module.exports = {
  LEVEL_RANK,
  calculateMatchScore
};

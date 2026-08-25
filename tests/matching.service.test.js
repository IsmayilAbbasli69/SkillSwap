const test = require("node:test");
const assert = require("node:assert/strict");

const {
  LEVEL_RANK,
  calculateMatchScore
} = require("../backend/src/services/matching.service.js");


test("defines skill levels in increasing order", () => {
  assert.equal(LEVEL_RANK.BEGINNER, 1);
  assert.equal(LEVEL_RANK.INTERMEDIATE, 2);
  assert.equal(LEVEL_RANK.ADVANCED, 3);
});


test("returns an excellent match for reciprocal students in the same unit with a suitable skill level", () => {
  const currentUser = {
    unitId: "engineering"
  };

  const candidate = {
    profile: {
      unit_id: "engineering"
    },
    offeredSkill: {
      level: "ADVANCED"
    }
  };

  const context = {
    reciprocal: true,
    requestedLevel: "INTERMEDIATE"
  };

  const result = calculateMatchScore(
    currentUser,
    candidate,
    context
  );

  assert.equal(result.score, 100);
  assert.equal(result.category, "EXCELLENT");
  assert.equal(result.reciprocal, true);

  assert.deepEqual(result.reasons, [
    "You can help each other with wanted skills",
    "You are in the same institution unit",
    "Their experience meets your requested level"
  ]);
});


test("returns a good match when students have reciprocal skills only", () => {
  const currentUser = {
    unitId: "engineering"
  };

  const candidate = {
    profile: {
      unit_id: "business"
    }
  };

  const context = {
    reciprocal: true,
    requestedLevel: "INTERMEDIATE"
  };

  const result = calculateMatchScore(
    currentUser,
    candidate,
    context
  );

  assert.equal(result.score, 50);
  assert.equal(result.category, "GOOD");
  assert.equal(result.reciprocal, true);
});


test("returns an available match when the candidate offers the requested skill at a suitable level", () => {
  const currentUser = {
    unitId: "engineering"
  };

  const candidate = {
    profile: {
      unit_id: "business"
    },
    offeredSkill: {
      level: "INTERMEDIATE"
    }
  };

  const context = {
    reciprocal: false,
    requestedLevel: "BEGINNER"
  };

  const result = calculateMatchScore(
    currentUser,
    candidate,
    context
  );

  assert.equal(result.score, 30);
  assert.equal(result.category, "AVAILABLE");
  assert.equal(result.reciprocal, false);
});


test("does not award skill-level points when the offered level is below the requested level", () => {
  const currentUser = {
    unitId: "engineering"
  };

  const candidate = {
    profile: {
      unit_id: "business"
    },
    offeredSkill: {
      level: "BEGINNER"
    }
  };

  const context = {
    reciprocal: false,
    requestedLevel: "ADVANCED"
  };

  const result = calculateMatchScore(
    currentUser,
    candidate,
    context
  );

  assert.equal(result.score, 0);
  assert.equal(result.category, "NOT_MATCHED");
});


test("returns not matched when no matching conditions are satisfied", () => {
  const currentUser = {
    unitId: "engineering"
  };

  const candidate = {
    profile: {
      unit_id: "business"
    }
  };

  const context = {
    reciprocal: false,
    requestedLevel: "INTERMEDIATE"
  };

  const result = calculateMatchScore(
    currentUser,
    candidate,
    context
  );

  assert.equal(result.score, 0);
  assert.equal(result.category, "NOT_MATCHED");
  assert.deepEqual(result.reasons, []);
});
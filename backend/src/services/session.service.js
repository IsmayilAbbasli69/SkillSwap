const requestRepository = require("../repositories/request.repository");
const sessionRepository = require("../repositories/session.repository");
const { ensureEnum, ensureUuid } = require("../utils/validators");
const HttpError = require("../utils/http-error");

const createSession = async ({ currentUser, requestId, payload }) => {
  ensureUuid(requestId, "requestId");
  ensureEnum(payload.meetingType, "meetingType", ["ONLINE", "IN_PERSON"]);

  const duration = Number(payload.duration);
  if (!Number.isInteger(duration) || duration < 15 || duration > 180) {
    throw new HttpError(422, "VALIDATION_ERROR", "duration must be between 15 and 180");
  }

  const request = await requestRepository.findById(requestId);
  if (!request) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Request not found");
  }

  if (![request.sender_id, request.receiver_id].includes(currentUser.id)) {
    throw new HttpError(403, "FORBIDDEN", "Only request participants can schedule");
  }

  if (request.status !== "ACCEPTED") {
    throw new HttpError(409, "CONFLICT", "Session requires an accepted request");
  }

  const existingSession = await sessionRepository.findBySwapRequestId(requestId);
  if (existingSession && existingSession.status !== "CANCELLED") {
    throw new HttpError(409, "CONFLICT", "An active session already exists for this request");
  }

  const row = await sessionRepository.createSession({
    swapRequestId: requestId,
    scheduledAt: payload.scheduledAt,
    duration,
    meetingType: payload.meetingType,
    meetingUrl: payload.meetingUrl || null,
    locationNote: payload.locationNote || null
  });

  return {
    id: row.id,
    requestId: row.swap_request_id,
    scheduledAt: row.scheduled_at,
    duration: row.duration,
    meetingType: row.meeting_type,
    meetingUrl: row.meeting_url || null,
    locationNote: row.location_note || null,
    status: row.status
  };
};

const listSessions = async ({ currentUser, query }) => {
  if (query.status) {
    ensureEnum(query.status, "status", ["SCHEDULED", "COMPLETED", "CANCELLED"]);
  }

  const requests = await requestRepository.listForUser({ userId: currentUser.id });
  const requestIds = requests.map(request => request.id);

  let sessions = await sessionRepository.listForRequestIds(requestIds);
  if (query.status) {
    sessions = sessions.filter(session => session.status === query.status);
  }

  return sessions.map(session => ({
    id: session.id,
    requestId: session.swap_request_id,
    scheduledAt: session.scheduled_at,
    duration: session.duration,
    meetingType: session.meeting_type,
    meetingUrl: session.meeting_url || null,
    locationNote: session.location_note || null,
    status: session.status
  }));
};

const updateSessionStatus = async ({ currentUser, sessionId, payload }) => {
  ensureUuid(sessionId, "id");
  ensureEnum(payload.status, "status", ["COMPLETED", "CANCELLED"]);

  const session = await sessionRepository.findById(sessionId);
  if (!session) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Session not found");
  }

  const request = await requestRepository.findById(session.swap_request_id);
  if (![request.sender_id, request.receiver_id].includes(currentUser.id)) {
    throw new HttpError(403, "FORBIDDEN", "Only participants can update session");
  }

  if (session.status !== "SCHEDULED") {
    throw new HttpError(409, "CONFLICT", "Only scheduled sessions can be updated");
  }

  const row = await sessionRepository.updateSessionStatus({ id: sessionId, status: payload.status });
  return {
    id: row.id,
    status: row.status
  };
};

const createReview = async ({ currentUser, sessionId, payload }) => {
  ensureUuid(sessionId, "sessionId");
  ensureUuid(payload.revieweeId, "revieweeId");

  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(422, "VALIDATION_ERROR", "rating must be between 1 and 5");
  }

  const session = await sessionRepository.findById(sessionId);
  if (!session) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Session not found");
  }

  const request = await requestRepository.findById(session.swap_request_id);
  const participants = [request.sender_id, request.receiver_id];

  if (session.status !== "COMPLETED") {
    throw new HttpError(409, "CONFLICT", "Only completed sessions can be reviewed");
  }

  if (!participants.includes(currentUser.id)) {
    throw new HttpError(403, "FORBIDDEN", "Only participants can review" );
  }

  if (!participants.includes(payload.revieweeId) || payload.revieweeId === currentUser.id) {
    throw new HttpError(422, "INVALID_REQUEST", "revieweeId must be the other participant");
  }

  const existing = await sessionRepository.findReviewBySessionAndReviewer({
    sessionId,
    reviewerId: currentUser.id
  });

  if (existing) {
    throw new HttpError(409, "CONFLICT", "You have already reviewed this session");
  }

  const row = await sessionRepository.createReview({
    sessionId,
    reviewerId: currentUser.id,
    revieweeId: payload.revieweeId,
    rating,
    comment: payload.comment
  });

  return {
    id: row.id,
    rating: row.rating,
    comment: row.comment
  };
};

module.exports = {
  createSession,
  listSessions,
  updateSessionStatus,
  createReview
};

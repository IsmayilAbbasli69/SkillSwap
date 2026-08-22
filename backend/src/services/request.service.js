const requestRepository = require("../repositories/request.repository");
const profileRepository = require("../repositories/profile.repository");
const skillRepository = require("../repositories/skill.repository");
const userRepository = require("../repositories/user.repository");
const { ensureEnum, ensureUuid } = require("../utils/validators");
const HttpError = require("../utils/http-error");

const createRequest = async ({ currentUser, payload }) => {
  ensureUuid(payload.receiverId, "receiverId");
  ensureUuid(payload.requestedSkillId, "requestedSkillId");
  if (payload.offeredSkillId) {
    ensureUuid(payload.offeredSkillId, "offeredSkillId");
  }

  if (payload.receiverId === currentUser.id) {
    throw new HttpError(409, "CONFLICT", "Cannot create request to yourself");
  }

  const receiver = await profileRepository.findById(payload.receiverId);
  if (!receiver) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Receiver not found");
  }

  if (receiver.institution_id !== currentUser.institutionId) {
    throw new HttpError(403, "FORBIDDEN", "Receiver is outside your institution");
  }

  if (receiver.status !== "ACTIVE") {
    throw new HttpError(409, "CONFLICT", "Receiver account is not active");
  }

  const requestedSkill = await skillRepository.findSkillById(payload.requestedSkillId);
  if (!requestedSkill || requestedSkill.status !== "ACTIVE") {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Requested skill not found");
  }

  const receiverSkills = await skillRepository.listUserSkills(receiver.id);
  const receiverOffersRequested = receiverSkills.some(
    skill => skill.type === "OFFER" && skill.skill_id === payload.requestedSkillId
  );

  if (!receiverOffersRequested) {
    throw new HttpError(422, "INVALID_REQUEST", "Requested skill is not offered by receiver");
  }

  if (payload.offeredSkillId) {
    const senderSkills = await skillRepository.listUserSkills(currentUser.id);
    const senderOffers = senderSkills.some(
      skill => skill.type === "OFFER" && skill.skill_id === payload.offeredSkillId
    );

    if (!senderOffers) {
      throw new HttpError(422, "INVALID_REQUEST", "Offered skill is not offered by sender");
    }
  }

  const duplicate = await requestRepository.findDuplicateActiveRequest({
    senderId: currentUser.id,
    receiverId: receiver.id,
    requestedSkillId: payload.requestedSkillId
  });

  if (duplicate) {
    throw new HttpError(409, "CONFLICT", "Duplicate active request already exists");
  }

  const row = await requestRepository.createSwapRequest({
    institution_id: currentUser.institutionId,
    sender_id: currentUser.id,
    receiver_id: receiver.id,
    requested_skill_id: payload.requestedSkillId,
    offered_skill_id: payload.offeredSkillId,
    message: payload.message
  });

  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    requestedSkillId: row.requested_skill_id,
    offeredSkillId: row.offered_skill_id,
    message: row.message,
    status: row.status,
    createdAt: row.created_at
  };
};

const listRequests = async ({ currentUser, query }) => {
  if (query.status) {
    ensureEnum(query.status, "status", ["PENDING", "ACCEPTED", "DECLINED"]);
  }

  if (query.type) {
    ensureEnum(query.type, "type", ["incoming", "outgoing"]);
  }

  const rows = await requestRepository.listForUser({
    userId: currentUser.id,
    type: query.type,
    status: query.status
  });

  const records = [];
  for (const row of rows) {
    const sender = await profileRepository.findById(row.sender_id);
    const receiver = await profileRepository.findById(row.receiver_id);
    const skill = await skillRepository.findSkillById(row.requested_skill_id);
    const offeredSkill = row.offered_skill_id
      ? await skillRepository.findSkillById(row.offered_skill_id)
      : null;

    // Determine who is the "peer" from the current user's perspective
    const isCurrentUserSender = row.sender_id === currentUser.id;
    const peerProfile = isCurrentUserSender ? receiver : sender;

    // Disclose peer email only when request is ACCEPTED
    let peerEmail = undefined;
    if (row.status === "ACCEPTED" && peerProfile) {
      const peerUser = await userRepository.findById(peerProfile.id);
      peerEmail = peerUser ? peerUser.email : undefined;
    }

    records.push({
      id: row.id,
      status: row.status,
      message: row.message || null,
      createdAt: row.created_at,
      peer: peerProfile ? {
        id: peerProfile.id,
        name: `${peerProfile.first_name} ${peerProfile.last_name}`,
        ...(peerEmail !== undefined && { email: peerEmail })
      } : null,
      sender: {
        id: sender.id,
        name: `${sender.first_name} ${sender.last_name}`
      },
      receiver: {
        id: receiver.id,
        name: `${receiver.first_name} ${receiver.last_name}`
      },
      requestedSkill: skill ? { id: skill.id, name: skill.name } : null,
      offeredSkill: offeredSkill ? { id: offeredSkill.id, name: offeredSkill.name } : null
    });
  }

  return records;
};

const updateRequestStatus = async ({ currentUser, requestId, payload }) => {
  ensureUuid(requestId, "id");
  ensureEnum(payload.status, "status", ["ACCEPTED", "DECLINED"]);

  const request = await requestRepository.findById(requestId);
  if (!request) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Request not found");
  }

  if (request.receiver_id !== currentUser.id) {
    throw new HttpError(403, "FORBIDDEN", "Only receiver can update request");
  }

  if (request.status !== "PENDING") {
    throw new HttpError(409, "CONFLICT", "Only pending requests can be updated");
  }

  const row = await requestRepository.updateStatus(requestId, payload.status);
  return {
    id: row.id,
    status: row.status
  };
};

module.exports = {
  createRequest,
  listRequests,
  updateRequestStatus
};

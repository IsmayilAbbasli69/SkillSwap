const { getSupabaseClient } = require("../config/supabase");
const { randomUUID } = require("crypto");

const createSwapRequest = async payload => {
  const supabase = getSupabaseClient();
  const row = {
    id: randomUUID(),
    institution_id: payload.institution_id,
    sender_id: payload.sender_id,
    receiver_id: payload.receiver_id,
    requested_skill_id: payload.requested_skill_id,
    offered_skill_id: payload.offered_skill_id || null,
    message: payload.message || null,
    status: "PENDING"
  };

  const { data, error } = await supabase
    .from("swap_requests")
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findById = async id => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("swap_requests")
    .select("*")
    .eq("id", id)
    .single();
  return error ? null : data;
};

const listForUser = async ({ userId, type, status }) => {
  const supabase = getSupabaseClient();
  let query = supabase.from("swap_requests").select("*");

  if (type === "incoming") {
    query = query.eq("receiver_id", userId);
  } else if (type === "outgoing") {
    query = query.eq("sender_id", userId);
  } else {
    query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  return error ? [] : data;
};

const updateStatus = async (id, status) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("swap_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return error ? null : data;
};

const findDuplicateActiveRequest = async ({ senderId, receiverId, requestedSkillId }) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("swap_requests")
    .select("*")
    .eq("sender_id", senderId)
    .eq("receiver_id", receiverId)
    .eq("requested_skill_id", requestedSkillId)
    .eq("status", "PENDING")
    .maybeSingle();
  return error ? null : data;
};

module.exports = {
  createSwapRequest,
  findById,
  listForUser,
  updateStatus,
  findDuplicateActiveRequest
};

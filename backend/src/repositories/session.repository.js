const { getSupabaseClient } = require("../config/supabase");
const { randomUUID } = require("crypto");

const createSession = async ({ swapRequestId, scheduledAt, duration, meetingType, meetingUrl, locationNote }) => {
  const supabase = getSupabaseClient();
  const row = {
    id: randomUUID(),
    swap_request_id: swapRequestId,
    scheduled_at: scheduledAt,
    duration,
    meeting_type: meetingType,
    meeting_url: meetingUrl || null,
    location_note: locationNote || null,
    status: "SCHEDULED"
  };

  const { data, error } = await supabase
    .from("sessions")
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findById = async id => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .single();
  return error ? null : data;
};

const findBySwapRequestId = async swapRequestId => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("swap_request_id", swapRequestId)
    .maybeSingle();
  return error ? null : data;
};

const listForRequestIds = async requestIds => {
  if (!requestIds || requestIds.length === 0) return [];
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .in("swap_request_id", requestIds);
  return error ? [] : data;
};

const updateSessionStatus = async ({ id, status }) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("sessions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return error ? null : data;
};

const createReview = async ({ sessionId, reviewerId, revieweeId, rating, comment }) => {
  const supabase = getSupabaseClient();
  const row = {
    id: randomUUID(),
    session_id: sessionId,
    reviewer_id: reviewerId,
    reviewee_id: revieweeId,
    rating,
    comment: comment || null
  };

  const { data, error } = await supabase
    .from("reviews")
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const findReviewBySessionAndReviewer = async ({ sessionId, reviewerId }) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("session_id", sessionId)
    .eq("reviewer_id", reviewerId)
    .maybeSingle();
  return error ? null : data;
};

const getUserReviewStats = async userId => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("reviewee_id", userId);

  if (error || !data || data.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const totalReviews = data.length;
  const sum = data.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = Number((sum / totalReviews).toFixed(2));

  return { averageRating, totalReviews };
};

const getRecentReviews = async (userId, limit = 5) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return error ? [] : data;
};

module.exports = {
  createSession,
  findById,
  findBySwapRequestId,
  listForRequestIds,
  updateSessionStatus,
  createReview,
  findReviewBySessionAndReviewer,
  getUserReviewStats,
  getRecentReviews
};

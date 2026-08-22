const { getSupabaseClient } = require("../config/supabase");

const listUnitsByInstitutionId = async institutionId => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("institution_units")
    .select("*")
    .eq("institution_id", institutionId);
  return error ? [] : data;
};

const getInstitutionById = async id => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("institutions")
    .select("*")
    .eq("id", id)
    .single();
  return error ? null : data;
};

const getRequestStats = async institutionId => {
  const supabase = getSupabaseClient();
  const { data: rows, error } = await supabase
    .from("swap_requests")
    .select("status")
    .eq("institution_id", institutionId);

  if (error || !rows) {
    return { total: 0, accepted: 0, pending: 0, declined: 0 };
  }

  return {
    total: rows.length,
    accepted: rows.filter(item => item.status === "ACCEPTED").length,
    pending: rows.filter(item => item.status === "PENDING").length,
    declined: rows.filter(item => item.status === "DECLINED").length
  };
};

const getSessionStats = async institutionId => {
  const supabase = getSupabaseClient();
  const { data: swapRequests, error: reqError } = await supabase
    .from("swap_requests")
    .select("id")
    .eq("institution_id", institutionId);

  if (reqError || !swapRequests || swapRequests.length === 0) {
    return { scheduled: 0, completed: 0 };
  }

  const requestIds = swapRequests.map(r => r.id);
  const { data: sessions, error: sesError } = await supabase
    .from("sessions")
    .select("status")
    .in("swap_request_id", requestIds);

  if (sesError || !sessions) {
    return { scheduled: 0, completed: 0 };
  }

  return {
    scheduled: sessions.filter(session => session.status === "SCHEDULED").length,
    completed: sessions.filter(session => session.status === "COMPLETED").length
  };
};

const getSkillDemandStats = async ({ institutionId, type }) => {
  const supabase = getSupabaseClient();
  const { data: profiles, error: profError } = await supabase
    .from("profiles")
    .select("id")
    .eq("institution_id", institutionId);

  if (profError || !profiles || profiles.length === 0) return [];

  const institutionUserIds = profiles.map(p => p.id);
  
  const { data: userSkills, error: usError } = await supabase
    .from("user_skills")
    .select("skill_id, type")
    .in("user_id", institutionUserIds)
    .eq("type", type);

  if (usError || !userSkills) return [];

  const counts = {};
  for (const userSkill of userSkills) {
    counts[userSkill.skill_id] = (counts[userSkill.skill_id] || 0) + 1;
  }

  const { data: skills, error: skillsError } = await supabase
    .from("skills")
    .select("id, name")
    .in("id", Object.keys(counts));

  if (skillsError || !skills) return [];

  const result = Object.entries(counts)
    .map(([skillId, count]) => {
      const skill = skills.find(item => item.id === skillId);
      return {
        skill: skill ? skill.name : "Unknown",
        count
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return result;
};

const createInstitution = async (payload) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("institutions")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
};

const createInstitutionUnit = async (payload) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("institution_units")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
};

module.exports = {
  listUnitsByInstitutionId,
  getInstitutionById,
  getRequestStats,
  getSessionStats,
  getSkillDemandStats,
  createInstitution,
  createInstitutionUnit
};

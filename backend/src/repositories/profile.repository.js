const { getSupabaseClient } = require("../config/supabase");

const findById = async id => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  return error ? null : data;
};

const create = async payload => {
  const supabase = getSupabaseClient();
  const row = {
    id: payload.id,
    institution_id: payload.institutionId,
    unit_id: payload.unitId || null,
    first_name: payload.firstName,
    last_name: payload.lastName,
    bio: payload.bio || "",
    avatar_url: null,
    department: payload.department || null,
    academic_year: payload.academicYear || null,
    role: payload.role || "STUDENT",
    status: payload.status || "ACTIVE"
  };

  const { data, error } = await supabase
    .from("profiles")
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateById = async (id, updates) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return data;
};

const findByInstitution = async ({ institutionId, role, status, search }) => {
  const supabase = getSupabaseClient();
  let query = supabase.from("profiles").select("*").eq("institution_id", institutionId);

  if (role) query = query.eq("role", role);
  if (status) query = query.eq("status", status);

  if (search) {
    const q = search.toLowerCase();
    query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,department.ilike.%${q}%`);
  }

  const { data, error } = await query;
  return error ? [] : data;
};

const findSkillCandidates = async ({ institutionId, currentUserId, skillId, unitId, level }) => {
  const supabase = getSupabaseClient();
  const levelRank = {
    BEGINNER: 1,
    INTERMEDIATE: 2,
    ADVANCED: 3
  };

  let profileQuery = supabase
    .from("profiles")
    .select("*")
    .eq("institution_id", institutionId)
    .eq("role", "STUDENT")
    .eq("status", "ACTIVE")
    .neq("id", currentUserId);

  if (unitId) {
    profileQuery = profileQuery.eq("unit_id", unitId);
  }

  // If skillId is provided, filter to only those who OFFER that skill
  if (skillId) {
    let offerQuery = supabase
      .from("user_skills")
      .select("user_id, level")
      .eq("skill_id", skillId)
      .eq("type", "OFFER");

    const { data: offerSkills, error: offerError } = await offerQuery;
    if (offerError || !offerSkills || offerSkills.length === 0) return [];

    const qualifiedUserIds = offerSkills
      .filter(us => !level || levelRank[us.level] >= levelRank[level])
      .map(us => us.user_id);

    if (qualifiedUserIds.length === 0) return [];
    const uniqueOfferingIds = Array.from(new Set(qualifiedUserIds));
    profileQuery = profileQuery.in("id", uniqueOfferingIds);
  }

  const { data: profiles, error: profError } = await profileQuery;
  if (profError || !profiles || profiles.length === 0) return [];

  const candidateIds = profiles.map(p => p.id);
  const { data: candidateSkills, error: skillsError } = await supabase
    .from("user_skills")
    .select("*")
    .in("user_id", candidateIds);

  if (skillsError) return [];

  return profiles.map(profile => {
    const offer = skillId ? candidateSkills.find(
      us => us.user_id === profile.id && us.skill_id === skillId && us.type === "OFFER"
    ) : null;
    const wants = candidateSkills.filter(
      us => us.user_id === profile.id && us.type === "WANT"
    );

    return {
      profile,
      offeredSkill: offer,
      wants
    };
  });
};

module.exports = {
  findById,
  create,
  updateById,
  findByInstitution,
  findSkillCandidates
};

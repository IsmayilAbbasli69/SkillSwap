const { getSupabaseClient } = require("../config/supabase");
const { randomUUID } = require("crypto");

const listVisibleSkills = async ({ institutionId, search, category }) => {
  const supabase = getSupabaseClient();
  let query = supabase.from("skills").select("*").eq("status", "ACTIVE");

  if (institutionId) {
    query = query.or(`institution_id.is.null,institution_id.eq.${institutionId}`);
  } else {
    query = query.is("institution_id", null);
  }

  if (category) {
    query = query.ilike("category", category);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;
  return error ? [] : data;
};

const findSkillById = async id => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("id", id)
    .single();
  return error ? null : data;
};

const createUserSkill = async ({ userId, skillId, type, level }) => {
  const supabase = getSupabaseClient();
  const row = {
    id: randomUUID(),
    user_id: userId,
    skill_id: skillId,
    type,
    level
  };

  const { data, error } = await supabase
    .from("user_skills")
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const listUserSkills = async userId => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("user_skills")
    .select("*")
    .eq("user_id", userId);
  return error ? [] : data;
};

const findUserSkillById = async id => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("user_skills")
    .select("*")
    .eq("id", id)
    .single();
  return error ? null : data;
};

const deleteUserSkillById = async id => {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("user_skills")
    .delete()
    .eq("id", id);
  return !error;
};

const createInstitutionSkill = async ({ institutionId, name, category }) => {
  const supabase = getSupabaseClient();
  const row = {
    id: randomUUID(),
    institution_id: institutionId,
    name,
    category: category || null,
    status: "ACTIVE"
  };

  const { data, error } = await supabase
    .from("skills")
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return data;
};

const updateSkillById = async (id, updates) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("skills")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  return error ? null : data;
};

module.exports = {
  listVisibleSkills,
  findSkillById,
  createUserSkill,
  listUserSkills,
  findUserSkillById,
  deleteUserSkillById,
  createInstitutionSkill,
  updateSkillById
};

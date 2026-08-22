const { getSupabaseClient } = require("../config/supabase");

const findByEmail = async email => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();
  
  if (error || !data) return null;
  return data;
};

const findById = async id => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
};

const create = async payload => {
  const supabase = getSupabaseClient();
  const row = {
    id: payload.id,
    email: payload.email,
    password_hash: payload.passwordHash
  };
  
  const { data, error } = await supabase
    .from("users")
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return data;
};

module.exports = {
  findByEmail,
  findById,
  create
};

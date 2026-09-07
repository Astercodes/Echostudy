import { createClient } from "@supabase/supabase-js";
// Public browser configuration for EchoStudy. This publishable key is not an
// admin credential. Environment overrides must supply a complete project pair.
const defaultProject = {
  url: "https://efgeyhovbidwvaxcyyzk.supabase.co",
  key: "sb_publishable_uDMzir8BdAc8Itu3Z-ZiLQ_BlLJmWt5",
};
const configuredUrl = import.meta.env.VITE_SUPABASE_URL;
const configuredKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasOverride = Boolean(configuredUrl || configuredKey);
const url = hasOverride ? configuredUrl : defaultProject.url;
const key = hasOverride ? configuredKey : defaultProject.key;
export const authConfigured = Boolean(url && key);
export const supabase = authConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
export const workspaceKey = (id) => "echostudy-v1:" + id;

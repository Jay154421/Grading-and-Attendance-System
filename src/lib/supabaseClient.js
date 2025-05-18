import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hnhkdjvtbmcysmiogczo.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuaGtkanZ0Ym1jeXNtaW9nY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MzMzMDYsImV4cCI6MjA2MjIwOTMwNn0.AqMKA3wTobjPx-fIN3nJO_dAw7th6BOaerYB31Ng_RE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

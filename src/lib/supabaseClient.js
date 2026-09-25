import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qsyoqcwmorglnqlwbhmx.supabase.co";
const supabaseAnonKey =
  "sb_publishable_dgABR5X0WHEW0DU1IqXLzg_zgxHze7L";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

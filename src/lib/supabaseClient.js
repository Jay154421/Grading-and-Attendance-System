import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://pqlmhhncibfjdsovrwap.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxbG1oaG5jaWJmamRzb3Zyd2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc3NjAwNDksImV4cCI6MjA2MzMzNjA0OX0.3OcyjaMSUTfq5tbTGE3VKxbdXaIQGIJ23j91vaD9tRY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

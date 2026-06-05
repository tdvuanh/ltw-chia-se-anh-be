import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

// Dùng placeholder URL/Key trong môi trường test/chưa cấu hình để tránh crash app lúc khởi động
const supabaseUrl = ENV.SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseKey = ENV.SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseKey);

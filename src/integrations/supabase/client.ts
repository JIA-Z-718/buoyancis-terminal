import { createClient } from '@supabase/supabase-js';

// 你的 10.0 協議資料庫金鑰
const supabaseUrl = 'https://ashklwdilmknamwcosvc.supabase.co';
const supabaseAnonKey = 'sb_publishable_qr0CFI-g9AENJnuiCAZtvw_kLckW9hr';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
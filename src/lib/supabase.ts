import { createClient } from '@supabase/supabase-js';
import { config } from '../config/constants';

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

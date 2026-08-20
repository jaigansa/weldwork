import { createClient } from '@supabase/supabase-js';
import { PARAMS } from '../config';

export const supabase = createClient(
  PARAMS.supabase_url,
  PARAMS.supabase_anon_key
);

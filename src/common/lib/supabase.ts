import { createClient } from "./../../../node_modules/@supabase/supabase-js/src/index";
import { env } from "./../config/env";

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
);

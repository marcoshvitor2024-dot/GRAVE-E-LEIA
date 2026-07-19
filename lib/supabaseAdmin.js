import { createClient } from "@supabase/supabase-js";

// ATENCAO: este arquivo so pode ser importado dentro de app/api/* (codigo de servidor).
// A SUPABASE_SERVICE_ROLE_KEY nunca deve chegar ao navegador.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

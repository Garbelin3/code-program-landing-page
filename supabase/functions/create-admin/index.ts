
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({
        error: "Missing environment variables for Supabase connection",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }

  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check if admin user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", "admin@codeprogram.com.br")
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingUser) {
      return new Response(
        JSON.stringify({
          message: "Admin user already exists",
          user: existingUser,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Admin doesn't exist, create it
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@codeprogram.com.br",
      password: "codeprogram2025@Admin",
      email_confirm: true,
      user_metadata: {
        full_name: "Administrador",
      },
    });

    if (authError) throw authError;

    // Update profile role to admin
    if (authUser.user) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", authUser.user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      return new Response(
        JSON.stringify({
          message: "Admin user created successfully",
          user: profileData,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      throw new Error("Failed to create admin user");
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message || String(error),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return new Response("Email is required", { status: 400, headers: corsHeaders });
    }

    // Initialize Supabase client (using built-in environment variables)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists in the waitlist
    const { data: existingEntry } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEntry) {
      return new Response(
        JSON.stringify({ message: 'Email already on the waitlist.' }), 
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add the new email to the waitlist
    const { error: insertError } = await supabase
      .from('waitlist')
      .insert({ email, created_at: new Date().toISOString() });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return new Response("Failed to save email", { status: 500, headers: corsHeaders });
    }

    // Send emails using SendGrid
    const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");
    if (!SENDGRID_API_KEY) {
      console.error("Missing SendGrid API key");
      return new Response("Email service configuration error", { status: 500, headers: corsHeaders });
    }

    // Send both user confirmation and admin notification in a single API call
    const combinedPayload = {
      personalizations: [
        // User confirmation email
        { 
          to: [{ email }],
          subject: "You are on the GameShare Waitlist!",
          dynamic_template_data: { user_email: email }
        },
        // Admin notification email
        {
          to: [{ email: "tahmeed@gameshareit.com" }],
          subject: "New Waitlist Signup",
          dynamic_template_data: { user_email: email }
        }
      ],
      from: { email: "tahmeed@gameshareit.com", name: "GameShare It" },
      content: [
        {
          type: "text/plain",
          value: "Thank you for signing up for the GameShare waitlist! Stay tuned for the future of gaming entertainment."
        }
      ]
    };

    // Send both emails in a single API call
    const emailRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(combinedPayload)
    });

    if (!emailRes.ok) {
      const err = await emailRes.json().catch(() => ({}));
      console.error("SendGrid combined email error:", err);
      // Still return success since the email was saved to database
    } else {
      console.log(`Successfully sent emails for new waitlist signup: ${email}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Successfully joined the waitlist!" }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Waitlist function error:', error);
    return new Response("An unexpected error occurred", { status: 500, headers: corsHeaders });
  }
}); 
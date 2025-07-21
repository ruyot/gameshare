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

    // Send user confirmation email
    const userPayload = {
      personalizations: [
        { 
          to: [{ email }],
          subject: "🎮 Welcome to the GameShare Waitlist!"
        }
      ],
      from: { email: "tahmeed@gameshareit.com", name: "GameShare" },
      content: [
        {
          type: "text/html",
          value: `
            <h2 style="color: #19FFE1;">You're on the GameShare Waitlist! 🎮</h2>
            <p>Thank you for joining the GameShare waitlist!</p>
            <p>You're now in line for early access to the future of entertainment and rewards.</p>
            <p>We'll keep you posted.</p>
            <br>
            <p style="color: #FF5C8D;">Cheers,<br>Tahmeed - Founder of GameShare</p>
            <hr>
            <p style="font-size: 12px; color: #666;">
              GameShare - Entertainment for Everyone<br>
              <a href="https://gameshareit.com">gameshareit.com</a>
            </p>
          `
        }
      ]
    };

    // Send admin notification email
    const adminPayload = {
      personalizations: [
        { 
          to: [{ email: "tahmeed@gameshareit.com" }],
          subject: "🔔 New GameShare Waitlist Signup"
        }
      ],
      from: { email: "tahmeed@gameshareit.com", name: "GameShare Waitlist" },
      content: [
        {
          type: "text/html",
          value: `
            <h3>New Waitlist Signup 📧</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <hr>
            <p>Another person joined the GameShare waitlist!</p>
          `
        }
      ]
    };

    // Send user confirmation email
    const userEmailRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userPayload)
    });

    // Send admin notification email
    const adminEmailRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(adminPayload)
    });

    // Log results
    if (!userEmailRes.ok) {
      const userErr = await userEmailRes.json().catch(() => ({}));
      console.error("SendGrid user email error:", userErr);
    } else {
      console.log(`Successfully sent confirmation email to: ${email}`);
    }

    if (!adminEmailRes.ok) {
      const adminErr = await adminEmailRes.json().catch(() => ({}));
      console.error("SendGrid admin email error:", adminErr);
    } else {
      console.log(`Successfully sent admin notification for: ${email}`);
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
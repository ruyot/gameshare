import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  // Check if email already exists
  const { data: existing, error: selectError } = await supabase
    .from('waitlist')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json({ alreadySignedUp: true });
  }

  // Insert new email
  const { error: insertError } = await supabase
    .from('waitlist')
    .insert({ email });
  if (insertError) {
    return NextResponse.json({ error: 'Failed to save email' }, { status: 500 });
  }

  // Send emails
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.WAITLIST_EMAIL_USER,
      pass: process.env.WAITLIST_EMAIL_PASS,
    },
  });

  // Email to admin
  await transporter.sendMail({
    from: process.env.WAITLIST_EMAIL_USER,
    to: 'tabeeb700@gmail.com',
    subject: 'New wait-list signup',
    text: `New subscriber: ${email}`,
  });

  // Thank you email to user
  await transporter.sendMail({
    from: process.env.WAITLIST_EMAIL_USER,
    to: email,
    subject: 'Thank you for signing up for the GameShare waitlist!',
    text: 'Thank you for signing up for the GameShare waitlist! Stay tuned for the future of entertainment.',
  });

  return NextResponse.json({ ok: true });
} 
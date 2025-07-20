// pages/api/waitlist-email.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if email already exists in the waitlist
    const { data: existingEntry } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEntry) {
      return res.status(200).json({ message: 'Email already on the waitlist.' });
    }

    // Add the new email to the waitlist
    const { error: insertError } = await supabase.from('waitlist').insert({ email });

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save email.' });
    }

    // Send notification and thank you emails
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
      to: 'tahmeed@gameshareit.com',
      subject: 'New Waitlist Signup',
      text: `A new user has signed up for the waitlist: ${email}`,
    });

    // Email to the user
    await transporter.sendMail({
      from: process.env.WAITLIST_EMAIL_USER,
      to: email,
      subject: 'You are on the GameShare Waitlist!',
      text: 'Thank you for signing up for the GameShare waitlist! Stay tuned for the future of entertainment.',
    });

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Waitlist API Error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred.' });
  }
} 
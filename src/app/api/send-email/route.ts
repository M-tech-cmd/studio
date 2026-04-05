import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Server-side Email Dispatcher using Resend API.
 */
export async function POST(request: NextRequest) {
  const { to, subject, html } = await request.json();
  
  try {
    const data = await resend.emails.send({
      from: 'St. Martin De Porres <onboarding@resend.dev>',
      to,
      subject,
      html,
    });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[Resend] API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 500 }
    );
  }
}
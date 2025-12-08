import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

const API_KEY = process.env.SENDGRID_API_KEY;

if (API_KEY) {
    sgMail.setApiKey(API_KEY);
} else {
    console.warn('SENDGRID_API_KEY is not set');
}

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json({ error: 'SendGrid API key not configured' }, { status: 500 });
    }

    try {
        const { to, from, subject, text, html, replyTo } = await req.json();

        if (!to || !from || !subject || (!text && !html)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const fromEmail = typeof from === 'object' && from !== null ? from.email : from;

        const msg = {
            to,
            from,
            subject,
            text,
            html: html || text,
            replyTo: replyTo,
            headers: {
                'Sender': fromEmail,
                'X-Original-Sender': fromEmail,
                'Precedence': 'normal'
            },
            trackingSettings: {
                clickTracking: {
                    enable: false,
                    enableText: false
                },
                openTracking: {
                    enable: false
                },
                subscriptionTracking: {
                    enable: false
                }
            }
        };

        await sgMail.send(msg);
        console.log(`[SendGrid] Email sent to ${to}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[SendGrid] Error sending email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        return NextResponse.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        );
    }
}

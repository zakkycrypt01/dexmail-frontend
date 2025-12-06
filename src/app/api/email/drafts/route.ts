import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Draft from '@/lib/models/Draft';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        }

        await connectDB();
        const drafts = await Draft.find({ address }).sort({ timestamp: -1 });
        return NextResponse.json(drafts);
    } catch (error) {
        console.error('Failed to fetch drafts:', error);
        return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, to, subject, body: emailBody, timestamp, address } = body;

        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        }

        await connectDB();

        // Upsert draft
        const draft = await Draft.findOneAndUpdate(
            { draftId: id, address }, // Compound key ensures ownership
            {
                draftId: id,
                address,
                to,
                subject,
                body: emailBody,
                timestamp
            },
            { upsert: true, new: true }
        );

        return NextResponse.json(draft);
    } catch (error) {
        console.error('Failed to save draft:', error);
        return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const address = searchParams.get('address');

        if (!id || !address) {
            return NextResponse.json({ error: 'Draft ID and Address are required' }, { status: 400 });
        }

        await connectDB();
        await Draft.findOneAndDelete({ draftId: id, address });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete draft:', error);
        return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 });
    }
}

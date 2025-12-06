import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import EmailStatus from '@/lib/models/EmailStatus';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json({ error: 'Address is required' }, { status: 400 });
        }

        await connectDB();
        const statuses = await EmailStatus.find({ userAddress: address });

        // Convert array to map for easier client consumption
        const statusMap: Record<string, any> = {};
        statuses.forEach((status) => {
            statusMap[status.messageId] = {
                read: status.read,
                spam: status.spam,
                archived: status.archived,
                deleted: status.deleted,
                draft: status.draft,
                labels: status.labels,
                deletedAt: status.deletedAt,
                purged: status.purged
            };
        });

        return NextResponse.json(statusMap);
    } catch (error) {
        console.error('Failed to fetch email statuses:', error);
        return NextResponse.json({ error: 'Failed to fetch email statuses' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { messageId, status, address } = body;

        if (!messageId || !status || !address) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectDB();

        const updatedStatus = await EmailStatus.findOneAndUpdate(
            { messageId, userAddress: address },
            { $set: status },
            { upsert: true, new: true }
        );

        return NextResponse.json(updatedStatus);
    } catch (error) {
        console.error('Failed to update email status:', error);
        return NextResponse.json({ error: 'Failed to update email status' }, { status: 500 });
    }
}

import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailStatus extends Document {
    userAddress: string;
    messageId: string;
    read: boolean;
    spam: boolean;
    archived: boolean;
    deleted: boolean;
    draft: boolean;
    labels: string[];
    deletedAt?: number;
    purged?: boolean;
}

const EmailStatusSchema: Schema = new Schema({
    userAddress: { type: String, required: true, index: true },
    messageId: { type: String, required: true, index: true },
    read: { type: Boolean, default: false },
    spam: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    deleted: { type: Boolean, default: false },
    draft: { type: Boolean, default: false },
    labels: { type: [String], default: [] },
    deletedAt: { type: Number },
    purged: { type: Boolean, default: false }
});

// Compound index for user and message lookup
EmailStatusSchema.index({ userAddress: 1, messageId: 1 }, { unique: true });

// Prevent model recompilation error in development
const EmailStatus: Model<IEmailStatus> = mongoose.models.EmailStatus || mongoose.model<IEmailStatus>('EmailStatus', EmailStatusSchema);

export default EmailStatus;

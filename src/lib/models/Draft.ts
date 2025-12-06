import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDraft extends Document {
    address: string;
    to: string;
    subject: string;
    body: string;
    timestamp: number;
    draftId: string;
}

const DraftSchema: Schema = new Schema({
    address: { type: String, required: true, index: true },
    to: { type: String, default: '' },
    subject: { type: String, default: '' },
    body: { type: String, default: '' },
    timestamp: { type: Number, required: true },
    draftId: { type: String, required: true, unique: true }
});

// Prevent model recompilation error in development
const Draft: Model<IDraft> = mongoose.models.Draft || mongoose.model<IDraft>('Draft', DraftSchema);

export default Draft;

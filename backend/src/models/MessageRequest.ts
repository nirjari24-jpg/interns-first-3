import mongoose, { Schema, Document } from 'mongoose';

export interface IMessageRequest extends Document {
  sender: string;
  recipient: string;
  status: 'pending' | 'accepted' | 'declined';
}

const MessageRequestSchema: Schema = new Schema({
  sender: { type: String, required: true, index: true },
  recipient: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
}, {
  timestamps: true
});

MessageRequestSchema.index({ sender: 1, recipient: 1 }, { unique: true });

export default mongoose.models.MessageRequest || mongoose.model<IMessageRequest>('MessageRequest', MessageRequestSchema);

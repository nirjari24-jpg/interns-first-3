import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  sender: string;
  recipient: string;
  text: string;
  imageUrl?: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

const MessageSchema: Schema = new Schema({
  sender: { type: String, required: true, index: true },
  recipient: { type: String, required: true, index: true },
  text: { type: String },
  imageUrl: { type: String },
  time: { type: String, required: true },
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }
}, {
  timestamps: true
});

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

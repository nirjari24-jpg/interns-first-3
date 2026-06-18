import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  avatarUrl: string;
  category?: string;
  bio?: string;
  statusText?: string;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true },
  password: { type: String, required: true },
  avatarUrl: { type: String, required: true },
  category: { type: String },
  bio: { type: String },
  statusText: { type: String }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

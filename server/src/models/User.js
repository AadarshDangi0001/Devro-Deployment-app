import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },
    providerId: { type: String, required: true },
    email: { type: String },
    name: { type: String },
    avatar: { type: String },
    raw: { type: Object },
  },
  { timestamps: true }
);

userSchema.index({ provider: 1, providerId: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export default User;

import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    // expiresAt: {
    createdAt:{
    type: Date,
    // default: () => new Date(Date.now() +1 * 60 * 1000),
    default:Date.now,
    expires:60
  },
    lastSentAt: {
    type: Date,
    default: Date.now
  }
});
// otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });


export default mongoose.model("Otp", otpSchema);
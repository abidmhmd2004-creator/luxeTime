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
    expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000) 
  },
    lastSentAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Otp", otpSchema);
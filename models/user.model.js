import mongoose from "mongoose";


const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lovercase: true,
            index: true
        },
        phone: {
            type: String,
            default: null,
            sparse: true
        },
        password: {
            type: String
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true
        },
        otp: {
            type: String
        },
        otpExpiry: {
            type: Date
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        dob: {
            type: Date
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        profileImage: {
            url: {
                type: String,
                default: ""
            },
            publicId: {
                type: String,
                default: ""
            }
        },

        referralCode: String,
        referredBy: String
    }, { timestamps: true });

export default mongoose.model("User", userSchema);
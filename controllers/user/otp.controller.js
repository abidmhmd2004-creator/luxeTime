import Otp from "../../models/otp.model.js";
import User from "../../models/user.model.js";
import crypto from "crypto";
import { createAndSendOtp } from "../../utils/otp.util.js";
import asyncHandler from "../../utils/asyncHandler.js";


export const verifyOtp =asyncHandler( async (req, res) => {
   
        const { otp } = req.body;
        if (!req.session.otp) {
            return res.send("Session expired");
        }

        const { userId, purpose } = req.session.otp;

        const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

        const otpRecord = await Otp.findOne({ userId, otp: hashedOtp });

        if (!otpRecord) {
            req.flash("error", "Invalid OTP");
            return res.redirect("/verify-otp");
        }
        if (otpRecord.otp !== hashedOtp) {
            req.flash("error", "Incorrect OTP");
            return res.redirect("/verify-otp");
        }

        if (otpRecord.expiresAt < new Date()) {
            await Otp.deleteMany({ userId }); // clean up
            req.flash("error", "OTP expired");
            return res.redirect("/verify-otp");
        }

        if (purpose === "signup") {
            await User.findByIdAndUpdate(userId, {
                isVerified: true
            });
            const user = await User.findById(userId);


            req.session.user = {
                id: user._id,
                name: user.name,
                email: user.email,
                // phone:user.phone,
                // dob:user.DOB
            }

            await Otp.deleteMany({ userId });
            delete req.session.otp;

            return res.redirect("/home");
        }
        if (purpose === "forgot-password") {
            req.session.resetUserId = userId;
            await Otp.deleteMany({ userId });
            delete req.session.otp;

            return res.redirect("/reset-password");
        }

        if (purpose === "change-email") {

            await User.findByIdAndUpdate(userId, {
                email: req.session.otp.email
            })
            delete req.session.otp;
            return res.redirect("/profile");
        }


        res.redirect("/login");
   
});





export const resentOtp = async (req, res) => {
    try {
        if (!req.session.otp) {
            return res.status(401).json({
                success: false,
                message: "Session expired. Please try again."
            });
        }
        const { userId, email, purpose } = req.session.otp;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        if (!email) {
            return res.status(404).json({
                success: false,
                message: "User email not found"
            })
        }

         await createAndSendOtp({ _id: userId, email }, purpose);

        return res.json({
            success: true,
            message: "OTP resent successfully"
        });

    } catch (err) {
        if (err.message === "otp-cooldown") {
            return res.status(200).json({
                success: false,
                message: "Please wait 60 seconds before resending OTP"
            });
        }

        console.error("Resend OTP error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to resend OTP. Please try again later."
        });
    }
};


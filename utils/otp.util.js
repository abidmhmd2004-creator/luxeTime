import nodemailer from "nodemailer";
import Otp from "../models/otp.model.js";
import crypto from "crypto";

export const otpEmailTemplates = {
    signup: {
        subject: "Verify your LuxeTime account",
        getHtml: (otp) => `
      <h2>Welcome to LuxeTime </h2>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>This OTP is valid for <b>1 minutes</b>.</p>`
    },

    "forgot-password": {
        subject: "Reset your LuxeTime password",
        getHtml: (otp) => `
      <h2>Password Reset Request</h2>
      <p>Use the OTP below to reset your password:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>This OTP expires in <b>1 minutes</b>.</p>
      <p>If you didn’t request this, ignore this email.</p>`
    },

    "change-email": {
        subject: "Reset your LuxeTime email",
        getHtml: (otp) => `
      <h2>Email Reset Request</h2>
      <p>Use the OTP below to reset your email:</p>
      <h1 style="letter-spacing:4px">${otp}</h1>
      <p>This OTP expires in <b>1 minutes</b>.</p>
      <p>If you didn’t request this, ignore this email.</p>`
    },
};



const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpMail = async (email, otp, purpose) => {
    try {

        // console.log(purpose);
        // console.log(email);

        const template = otpEmailTemplates[purpose];
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASSWORD
            }
        })

        await transporter.sendMail({
            from: `LuxeTime <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject: template.subject,
            html: template.getHtml(otp)
        });

        console.log("otp sented");
        return true;
    } catch (err) {
        console.log(err);
    }
};

export const createAndSendOtp = async (user, purpose) => {
    if (!user?.email) {
        throw new Error("OTP email missing");
    }

    const existingOtp = await Otp.findOne({ userId: user._id });

    if (existingOtp) {
        const now = Date.now();
        const diff = (now - existingOtp.lastSentAt.getTime()) / 1000;
        if (diff < 30) {
            throw new Error("otp-cooldown");
        }

        await Otp.deleteMany({ userId: user._id });
    }

    const otpCode = generateOtp();

    const hashedOtp = crypto.createHash("sha256").update(otpCode).digest("hex");

    await Otp.create({
        userId: user._id,
        otp: hashedOtp,
        lastSentAt: new Date()
    });


    await sendOtpMail(user.email, otpCode, purpose);
}




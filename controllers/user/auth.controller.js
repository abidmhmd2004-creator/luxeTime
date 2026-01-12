import express from "express";
import bcrypt from "bcrypt";
import User from "../../models/user.model.js";
import { createAndSendOtp } from "../../utils/otp.util.js";

export const showSignup = async (req, res) => {
    try {
        res.render("user/signup");
    } catch (err) {
        console.log("Error loading signup page");
        res.status(500).send("Server error")
    }
};


export const postSignup = async (req, res) => {
    try {
        const { name, email, phone, referralCode, password } = req.body;

        if (!name || !/^[A-Za-z ]+$/.test(name)) {
            req.flash("error", "Name can only contain letters")

            return res.redirect("/signup");
        }

        if (name.length > 30 || name.length < 3) {
            req.flash("error", "Name should be between 3-30 characters");
            return res.redirect("/signup");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            req.flash("error", "Please enter a valid email address")

            return res.redirect("/signup");
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(phone)) {
            req.flash("error", "Please enter a valid Phone Number")

            return res.redirect("/signup");
        }

        if (password.length < 6) {
            req.flash("error", "Password need minimum 6 characters")

            return res.redirect("/signup");
        }


        const existingUser = await User.findOne({ email });
        console.log(existingUser);


        if (existingUser && existingUser.isVerified) {
            req.flash("error", "Email already registered,Please login!");
            return res.redirect("/signup");
        }


        const hashedPassword = await bcrypt.hash(password, 10);


        const user = await User.findOneAndUpdate(
            { email },
            {
                name,
                email,
                phone,
                referralCode,
                password: hashedPassword,
                isVerified: false,
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );


        await createAndSendOtp(user, "signup");

        req.session.otp = {
            userId: user._id.toString(),
            email: user.email,
            purpose: "signup"

        }
        res.redirect("/verify-otp");
    } catch (err) {
        if (err.message === "otp-cooldown") {
            req.flash("error", "OTP already sent. Please wait 30 seconds");
            return res.redirect("/verify-otp");
        }
        console.error(err);
        req.flash("error", "Something went wrong");
        return res.redirect("/signup");
    }
}

export const showVerifyOtp = async (req, res) => {
    try {
        res.render("user/verify-otp")
    } catch (err) {
        console.log(err);
        res.satus(500).send("Failed to load ");
    }
}




export const showLogin = async (req, res) => {
    try {
        return res.render("user/login");
    } catch (err) {
        console.log("Error loading login page");
        res.status(500).send("Server error");
    }
};


export const postLogin = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            req.flash("error", "ALl fields are required");
            return res.redirect("/login");
        }

        const user = await User.findOne({ email });

        if (!user) {
            req.flash("error", "Invalid  email or password");
            return res.redirect("/login");
        }

        if (!user.isVerified) {
            req.flash("error", "PLease verify your email first");
            return res.redirect("/login");
        }

        if (user.isBlocked) {
            req.flash("error", "Your acount is blocked by admin");
            return res.redirect("/login");
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
            req.flash("error", "Invalid email or password");
            return res.redirect("/login");
        }

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email
        };
        res.redirect("/home");

    } catch (err) {
        console.log(err);
        res.status(500).send("Login failed");
    }
}






export const loadForgotPass = async (req, res) => {
    try {


        delete req.session.email;
        delete req.session.purpose;
        return res.render("user/forgot-password");
    } catch (err) {
        console.log("Error loading page");
        res.status(500).send("server error");
    }
}


export const postForgotPass = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            req.flash("error", "Email is required");
            return res.redirect("/forgot-password")
        }

        const user = await User.findOne({ email });

        if (!user) {
            req.flash("error", "No account found with this email");
            return res.redirect("/forgot-password");
        }


        await createAndSendOtp(user, "forgot-password");

        req.session.otp = {
            userId: user._id.toString(),
            email: user.email,
            purpose: "forgot-password"

        }
        res.redirect("/verify-otp")
    } catch (err) {
        console.error(err);
        if (err.message == "otp-cooldown") {
            req.flash("error", "OTPalready sent.Please wait.")
            return res.redirect("/verify-otp");
        }
        throw err;
    }
}



export const getResetPassword = (req, res) => {
    try {
        if (!req.session.resetUserId) {
            return res.redirect("/forgot-password")
        }
        res.render("user/reset-password")
    } catch (err) {
        console.error(err);
        res.status(500).send("Somethng went wrong");
    }
}


export const postResetPassword = async (req, res) => {
    try {
        if (!req.session.resetUserId) {
            req.flash("error", "Unauthorized request");
            return res.redirect("/reset-password")
        }

        const { newPassword, confirmPassword } = req.body;

        if (!newPassword || !confirmPassword) {
            req.flash("error", "All fields are required");
        }

        if (newPassword.length < 6) {
            req.flash("error", "Password must be at least 6 charactors");
            return res.redirect("/reset-password");
        }

        if (newPassword !== confirmPassword) {
            req.flash("error", "Password do not macth");
        }

        const userId = req.session.resetUserId;

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const data = await User.findByIdAndUpdate(userId, { password: hashedPassword });

        delete req.session.resetUserId;

        res.redirect("/login");


    } catch (err) {
        console.log(err);
        res.status(500).send("failed to reset password");

    }
}



export const logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.send("Logout failed");
        }

        res.clearCookie("luxetime.sid");
        res.redirect("/")
    })
}

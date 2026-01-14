import User from "../../models/user.model.js";
import bcrypt from "bcrypt"
import { createAndSendOtp } from "../../utils/otp.util.js";
import cloudinary from "../../config/cloudinary.js";

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select("-password");
        res.render("user/profile", { user });
    } catch (err) {
        next(err)
    }
}

export const loadEditProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).select("-password");
        res.render("user/edit-profile", { user });
    } catch (error) {
        next(error)
    }
}


export const postEditProfile = async (req, res) => {
    try {

        const { name, phone, dob } = req.body;

        if (!name) {
            req.flash("error", "Name is required");
            return res.redirect("/edit-profile")
        }

        await User.findByIdAndUpdate(req.session.user.id, {
            name,
            phone
        });
        req.session.user.name = name;
        res.redirect("/profile")
    } catch (err) {
        next(err)
    }

}

export const getChangePassword = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id)
        if (!user.password && user.googleId) {
            req.flash("error", "Google users cannot change password");
            return res.redirect("/profile");
        }
        res.render("user/change-password");
    } catch (err) {
        next(err)
    }
}


export const postChangePassword = async (req, res) => {

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        req.flash("error", "Passwords do not match");
        return res.redirect("/change-password")
    }

    const user = await User.findById(req.session.user.id);

    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match) {
        req.flash("error", "Current Password is incorrect");
        return res.redirect("/change-password");
    }
    const hashed = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(user._id, { password: hashed });

    res.redirect("/profile");
}






export const loadChangeEmail = async (req, res) => {
    try {
        res.render("user/change-email");
    } catch (err) {
        next(err)
    }
}


export const postChangeEmail = async (req, res) => {
    try {

        const { newEmail } = req.body;

        const exists = await User.findOne({ newEmail });
        if (exists) {
            req.falsh("error", "newEmail already in use");
            return res.redirect("/change-email");
        }

        const user = await User.findById(req.session.user.id);


        await createAndSendOtp({ _id: user._id, email: newEmail }, "change-email");

        req.session.otp = {
            userId: user._id.toString(),
            email: newEmail,
            purpose: "change-email"
        }
        res.redirect("/verify-otp")

    } catch (error) {
        next(err)

    }
}


export const uploadProfileImage = async (req, res) => {
    try {
        const imageUrl = req.file.path;
        const publicId = req.file.filename;
        console.log(publicId)

        await User.findByIdAndUpdate(req.session.user.id, {
            profileImage: {
                url: imageUrl,
                publicId: publicId,
            }
        });
        return res.redirect("/profile");
    } catch (err) {
        next(err)
    }
}

export const deleteProfileImage = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        console.log(user.publicId)

        if (!user || !user.profileImage?.publicId) {
            return res.redirect("/profile")
        }


        await cloudinary.uploader.destroy(user.profileImage.publicId);

        user.profileImage = {
            url: "",
            publicId: ""
        }
        await user.save();

        return res.redirect("/profile")
    } catch (err) {
       next(err)
    }
}





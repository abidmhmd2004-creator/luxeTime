import User from "../models/user.model.js"

export const checkUser = (req, res, next) => {
    if (req.session.user) {
        res.locals.user = req.session.user;
    } else {
        res.locals.user = null;
    }
    next();
}


export const requireAuth = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.redirect("/login")
        }
        const user = await User.findById(req.session.user.id);

        if (!user || user.isBlocked) {
            req.session.user = null;
            return res.redirect("/login");
        }
        next();
    } catch (err) {
        console.log(err);
        res.redirect("/login");
    }
}

export const redirectIfAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return res.redirect("/home");
    }
    next();
}


export const requireOtpSession = async (req, res, next) => {
    if (!req.session.otp) {
        return res.redirect("/signup");
    }
    next();
}

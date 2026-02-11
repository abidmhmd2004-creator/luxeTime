import User from "../models/user.model.js";

export const checkBlockedUser = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user) {
      return next();
    }

    const userId = req.session.user.id;

    const user = await User.findById(userId);

    if (!user || user.isBlocked) {
      req.session.user = null;
      req.flash("error", "Your account is blocked by admin!");

      return res.redirect("/login");
    }
    next();
  } catch (err) {
    console.log(err);
    req.session.user = null;

    return res.redirect("/login");
  }
};

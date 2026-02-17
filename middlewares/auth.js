import User from '../models/user.model.js';

export const checkUser = (req, res, next) => {
  if (req.session.user) {
    res.locals.user = req.session.user;
  } else {
    res.locals.user = null;
  }
  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

export const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
};

export const requireOtpSession = async (req, res, next) => {
  if (!req.session.otp) {
    return res.redirect('/signup');
  }
  next();
};

import User from '../../models/user.model.js';
import bcrypt from 'bcrypt';
import { createAndSendOtp } from '../../utils/otp.util.js';
import cloudinary from '../../config/cloudinary.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.session.user.id).select('-password');
  res.render('user/profile', { user });
});

export const loadEditProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.session.user.id).select('-password');
  res.render('user/edit-profile', { user });
});

export const postEditProfile = asyncHandler(async (req, res) => {
  const { name, phone, dob } = req.body;

  if (!name) {
    req.flash('error', 'Name is required');
    return res.redirect('/edit-profile');
  }

  await User.findByIdAndUpdate(req.session.user.id, {
    name,
    phone,
    dob,
  });
  req.session.user.name = name;
  res.redirect('/profile');
});

export const getChangePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.session.user.id);
  if (!user.password && user.googleId) {
    req.flash('error', 'Google users cannot change password');
    return res.redirect('/profile');
  }
  res.render('user/change-password');
});

export const postChangePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    req.flash('error', 'Passwords do not match');
    return res.redirect('/change-password');
  }

  const user = await User.findById(req.session.user.id);

  const match = await bcrypt.compare(currentPassword, user.password);

  if (!match) {
    req.flash('error', 'Current Password is incorrect');
    return res.redirect('/change-password');
  }
  const hashed = await bcrypt.hash(newPassword, 10);

  await User.findByIdAndUpdate(user._id, { password: hashed });

  req.session.destroy(() => {
    res.clearCookie('luxetime.user.sid');
    return res.redirect('/login');
  });
};

export const loadChangeEmail = asyncHandler(async (req, res) => {
  res.render('user/change-email');
});

export const postChangeEmail = asyncHandler(async (req, res) => {
  const { newEmail } = req.body;

  const exists = await User.findOne({ email: newEmail });
  if (exists && exists.isVerified) {
    req.flash('error', 'newEmail already in use');
    return res.redirect('/change-email');
  }

  if (exists && !exists.isVerified) {
    await User.deleteOne({ email: newEmail });
  }

  const user = await User.findById(req.session.user.id);

  await createAndSendOtp({ _id: user._id, email: newEmail }, 'change-email');

  req.session.otp = {
    userId: user._id.toString(),
    email: newEmail,
    purpose: 'change-email',
  };
  res.redirect('/verify-otp');
});

export const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.redirect('/profile');

  const imageUrl = req.file.path;
  const publicId = req.file.filename;

  await User.findByIdAndUpdate(req.session.user.id, {
    profileImage: {
      url: req.file.path,
      publicId: req.file.filename,
    },
  });
  return res.redirect('/profile');
});

export const deleteProfileImage = asyncHandler(async (req, res) => {
  const user = await User.findById(req.session.user.id);

  if (!user || !user.profileImage?.publicId) {
    return res.redirect('/profile');
  }

  await cloudinary.uploader.destroy(user.profileImage.publicId);

  user.profileImage = {
    url: '',
    publicId: '',
  };
  await user.save();

  return res.redirect('/profile');
});

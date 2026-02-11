import express from "express";
import bcrypt from "bcrypt";
import User from "../../models/user.model.js";
import asyncHandler from "../../utils/asyncHandler.js";

export const loadAdminLogin = asyncHandler(async (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  res.render("admin/login", { layout: "layouts/admin" });
});

export const postAdminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await User.findOne({ email, role: "admin" });

  if (!admin) {
    req.flash("error", "Unauthorized access");
    return res.redirect("/admin/login");
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    req.flash("error", "Invalid Credintials");
    return res.redirect("/admin/login");
  }

  req.session.admin = {
    id: admin._id.toString(),
    email: admin.email,
    role: admin.role,
  };
  return res.redirect("/admin/dashboard");
});

export const adminLogout = asyncHandler(async (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("luxetime.admin.sid");
    return res.redirect("/admin/login");
  });
});

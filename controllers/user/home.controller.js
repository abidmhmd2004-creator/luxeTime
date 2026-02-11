import asyncHandler from "../../utils/asyncHandler.js";

export const showhomePage = asyncHandler(async (req, res) => {
  const user = req.session.user;
  return res.render("user/home");
});

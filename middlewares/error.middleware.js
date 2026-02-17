export const errorHandler = (err, req, res, next) => {
  console.error('SERVER ERROR!', err);

  res.status(500).render('user/500', { layout: false });
};

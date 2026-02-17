import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import session from 'express-session';
import flash from 'connect-flash';
import nocache from 'nocache';
import path from 'path';
import methodsOverride from 'method-override';
import { fileURLToPath } from 'url';
import expressLayouts from 'express-ejs-layouts';
import userRoutes from './routes/user.routes.js';
import { adminSession, userSession } from './config/sessionStore.js';
import passport from 'passport';
import './config/passport.js';
import { checkUser } from './middlewares/auth.js';
import adminRoutes from './routes/admin.routes.js';
import morgan from 'morgan';
import { checkBlockedUser } from './middlewares/checkBlockeduser.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

console.log('MONGO_URI =>', process.env.MONGODB_URI);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(methodsOverride('_method'));

app.use('/admin', adminSession);
app.use(userSession);

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  next();
});

app.use(nocache());

app.use(expressLayouts);

app.use(morgan('dev'));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.set('layout', 'layouts/user');

app.use('/', checkBlockedUser, checkUser, userRoutes);
app.use('/admin', adminRoutes);

app.get('/admin', (req, res) => {
  res.redirect('/admin/login');
});

app.use((req, res) => {
  res.status(404).render('user/404');
});

app.use(errorHandler);

export default app;

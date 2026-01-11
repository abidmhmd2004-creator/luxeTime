import dotenv from "dotenv";
dotenv.config();
import express from "express";
import session from "express-session";
import flash from "connect-flash";
import nocache from "nocache";
import path from "path";
import { fileURLToPath } from "url";
import expressLayouts from "express-ejs-layouts";
import userRoutes from "./routes/user.routes.js";
import sessionConfig from "./config/sessionStore.js";
import passport from "passport";
import "./config/passport.js";
import { checkUser } from "./middlewares/auth.js";
import adminRoutes from "./routes/admin.routes.js";
// import { userContext } from "./middlewares/userContext.middleware.js";
import morgan from "morgan";

const app=express();

console.log("MONGO_URI =>", process.env.MONGODB_URI);

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

app.use(express.static(path.join(__dirname,"public")));

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(sessionConfig);

app.use(flash());

app.use((req, res, next) => {
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(nocache());

app.use(expressLayouts);

app.use((req,res,next)=>{
    res.locals.currentUser=req.session.user||null;
    next();
})

app.use(passport.initialize());
app.use(passport.session());

app.use(checkUser);
// app.use(userContext);

app.use(morgan("dev"));

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

app.set("layout","layouts/user");

app.use("/",userRoutes);
app.use("/admin",adminRoutes);



app.get("/",(req,res)=>{
    res.redirect("/home");
})
app.get("/admin",(req,res)=>{
    res.redirect("/admin/login");
})



app.use((req,res)=>{
    res.status(404).render("user/404");
})


export default app;
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



console.log("MONGO_URI =>", process.env.MONGODB_URI);

const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);


const app=express();

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


app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));

app.set("layout","layouts/user");

app.use("/",userRoutes);

app.get("/",(req,res)=>{
    res.redirect("/home");
})

export default app;
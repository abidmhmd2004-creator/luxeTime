import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage ({
    cloudinary,
    params:{
        folder:"luxe-time/profile",
        allowed_format :["jpg","png","jpeg"]
    }
});

const uplaod = multer ({storage});

export default uplaod;
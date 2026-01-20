import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";


const createUploader =(folderName) =>{
const storage = new CloudinaryStorage ({
    cloudinary,
    params:{
        folder:`luxe-time/${folderName}`,
        allowed_formats :["jpg","png","jpeg"]
    }
});

return multer({storage})
};

export default createUploader;
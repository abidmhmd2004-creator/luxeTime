import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const createUploader = (folderName) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `luxe-time/${folderName}`,
      allowed_formats: ['jpg', 'png', 'jpeg','webp'],
      transformation: [{ width: 400, height: 400, crop: 'fill', quality: 'auto' }],
    },
  });

  return multer({ storage });
};

export default createUploader;

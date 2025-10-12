// config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const connectCloudinary = () => {
    try {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
        console.log('✅ Cloudinary Connected');
    } catch (error) {
        console.error(`❌ Cloudinary Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectCloudinary;
// Import the cloudinary v2 SDK

import cloudinary from 'cloudinary';

// Call cloudinary.config() with cloud_name, api_key, api_secret from process.env
//   (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Export the configured cloudinary instance
export default cloudinary.v2;
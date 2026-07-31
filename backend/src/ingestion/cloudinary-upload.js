// Import the configured cloudinary instance from config/cloudinary.js
// Import fs (for reading the local Multer temp file buffer/path)

import cloudinary from '.././config/cloudinary.js';
import fs from 'fs';

// Function: uploadFileToCloudinary(localFilePath, options = {})
//   - options may include folder (e.g. `users/${clerkUserId}/module-${moduleNumber}`)
//   - Call cloudinary.uploader.upload(localFilePath, {
//       resource_type: "auto",   // IMPORTANT: "auto" or "raw" — do NOT default to "image",
//                                 // otherwise non-image files (pdf, docx, srt, vtt, csv, txt) break silently
//       folder: options.folder || "uploads",
//       use_filename: true,
//       unique_filename: true,
//       overwrite: false
//     })
//   - On success, return { secureUrl: result.secure_url, publicId: result.public_id, resourceType: result.resource_type, format: result.format }
//   - On failure, throw a descriptive error (include original filename in the error message for easier debugging)
//   - After successful upload, delete the local Multer temp file (fs.unlink) to avoid disk buildup
//     — wrap in try/catch so a delete failure doesn't crash the upload flow, just log a warning

export async function uploadFileToCloudinary(localFilePath, options = {}) {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // IMPORTANT: "auto" or "raw" — do NOT default to "image"
      folder: options.folder || "uploads",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    // After successful upload, delete the local Multer temp file
    try {
      fs.unlinkSync(localFilePath);
    } catch (unlinkError) {
      console.warn(`Warning: Failed to delete local file ${localFilePath}:`, unlinkError);
    }

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,   
    resourceType: result.resource_type,
        format: result.format,
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed for file ${localFilePath}: ${error.message}`);
  }
}


// Function: deleteFileFromCloudinary(publicId, resourceType = "auto")
//   - Call cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
//   - Used later for cleanup if a user deletes a document from the app

export async function deleteFileFromCloudinary(publicId, resourceType = "auto") {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary deletion failed for publicId ${publicId}: ${error.message}`);
  }
}
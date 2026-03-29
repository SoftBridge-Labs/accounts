import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export const uploadImage = async (fileUri: string, folder: string) => {
  try {
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: folder,
      resource_type: 'auto',
    });
    return result;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

export const deleteImage = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Extracts public_id from a Cloudinary URL
 * Example: https://res.cloudinary.com/dqnuljiwh/image/upload/v1711712345/softbridge/profiles/uid.jpg
 * public_id: softbridge/profiles/uid
 */
export const extractPublicId = (url: string) => {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Everything after the version (v123456789) is part of the public_id (including folders)
    // Until the file extension
    const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    
    if (lastDotIndex === -1) return publicIdWithExtension;
    return publicIdWithExtension.substring(0, lastDotIndex);
  } catch (error) {
    console.error('Error extracting public_id:', error);
    return null;
  }
};

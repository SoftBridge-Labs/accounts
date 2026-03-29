'use server';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Extracts public_id from a Cloudinary URL
 */
function extractPublicId(url: string) {
  if (!url || !url.includes('cloudinary.com')) return null;
  
  try {
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Everything after the version (v123456789) is part of the public_id
    const components = parts.slice(uploadIndex + 2);
    const publicIdWithExtension = components.join('/');
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    
    if (lastDotIndex === -1) return publicIdWithExtension;
    return publicIdWithExtension.substring(0, lastDotIndex);
  } catch (error) {
    return null;
  }
}

export async function uploadToCloudinary(base64Image: string, folder: string) {
  try {
    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
    });
    
    return { 
      success: true, 
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteFromCloudinary(publicId: string | null) {
  if (!publicId) return { success: true };
  
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    return { success: false, error: error.message };
  }
}

export async function handleProfilePhotoChange(base64Image: string, oldPhotoUrl: string | null, folder: string) {
    // 1. Upload new photo
    const uploadResult = await uploadToCloudinary(base64Image, folder);
    
    if (!uploadResult.success) {
        return uploadResult;
    }

    // 2. If upload success and there was an old photo, delete it
    if (oldPhotoUrl) {
        const oldPublicId = extractPublicId(oldPhotoUrl);
        if (oldPublicId) {
            await deleteFromCloudinary(oldPublicId);
        }
    }

    return uploadResult;
}

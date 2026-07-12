import cloudinary from '../config/cloudinaryConfig.js';

const UPLOAD_FOLDER = 'car-dealership-vehicles';

export async function uploadImage(file) {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: UPLOAD_FOLDER,
    resource_type: 'image',
  });
  return { imageUrl: result.secure_url, publicId: result.public_id };
}

export async function deleteImage(publicId) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}

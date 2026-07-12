// Manual ESM-compatible mock for cloudinaryService
// Returns fixed URLs without calling the real Cloudinary API.

export async function uploadImage() {
  return {
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/car-dealership-vehicles/mock.jpg',
    publicId: 'car-dealership-vehicles/mock',
  };
}

export async function deleteImage() {
  return undefined;
}

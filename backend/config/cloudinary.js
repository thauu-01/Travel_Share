const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- Storage for user avatars ---
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'travelshare/avatars',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }]
  }
});

// --- Dynamic storage for post & place images (grouped by post_id) ---
const postStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const postId = req.params?.id || req.body?.post_id || 'temp';
    return {
      folder: `travelshare/posts/${postId}`,
      transformation: [{ width: 1200, height: 800, crop: 'limit', quality: 'auto' }]
    };
  }
});

const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadPost   = multer({ storage: postStorage,   limits: { fileSize: 10 * 1024 * 1024 } });

module.exports = { cloudinary, uploadAvatar, uploadPost };

// middleware/upload.js
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'news_ads_images', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'bmp', 'webp', 'tiff', 'svg', 'avif']
  },
});

const upload = multer({ storage: storage });

module.exports = upload;

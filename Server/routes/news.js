const express = require('express');
const router = express.Router();
const News = require('../models/News');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');

// Get all news
router.get('/', async (req, res) => {
  try {
    const news = await News.find().sort({ timestamp: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a news item (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  const { body } = req;
  const image = req.file ? req.file.path : null;
  const news = new News({
    ...body,
    image,
  });

  try {
    const newNews = await news.save();
    res.status(201).json(newNews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a news item (admin only)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  const news = await News.findById(req.params.id);

  if (!news) {
    return res.status(404).json({ message: 'News not found' });
  }

  if (req.file) {
    // Delete old image from Cloudinary
    const oldImage = news.image;
    if (oldImage) {
      const public_id = oldImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(public_id);
    }
    news.image = req.file.path; // Set new image
  }

  Object.assign(news, req.body);

  try {
    const updatedNews = await news.save();
    res.json(updatedNews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a news item (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (news && news.image) {
      const public_id = news.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(public_id);
    }
    res.json({ message: 'News deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
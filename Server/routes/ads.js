const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');
const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');

// Get all ads
router.get('/', async (req, res) => {
  try {
    const ads = await Ad.find();
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add an ad (admin only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  const { body } = req;
  const image = req.file ? req.file.path : null; // Cloudinary image URL
  const ad = new Ad({
    ...body,
    image,
  });

  try {
    const newAd = await ad.save();
    res.status(201).json(newAd);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an ad (admin only)
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  const ad = await Ad.findById(req.params.id);

  if (!ad) {
    return res.status(404).json({ message: 'Ad not found' });
  }

  if (req.file) {
    // If new image uploaded, delete old one
    const oldImage = ad.image;
    if (oldImage) {
      const public_id = oldImage.split('/').pop().split('.')[0]; // Extract Cloudinary ID
      await cloudinary.uploader.destroy(public_id); // Delete old image
    }
    ad.image = req.file.path; // Set new Cloudinary image URL
  }

  Object.assign(ad, req.body); // Update other fields

  try {
    const updatedAd = await ad.save();
    res.json(updatedAd);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an ad (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);
    if (ad && ad.image) {
      const public_id = ad.image.split('/').pop().split('.')[0]; // Extract Cloudinary ID
      await cloudinary.uploader.destroy(public_id); // Delete Cloudinary image
    }
    res.json({ message: 'Ad deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
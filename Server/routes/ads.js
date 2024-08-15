const express = require('express');
const router = express.Router();
const Ad = require('../models/Ad');

// Get all ads
router.get('/', async (req, res) => {
  try {
    const ads = await Ad.find();
    res.json(ads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add an ad
router.post('/', async (req, res) => {
  const ad = new Ad(req.body);
  try {
    const newAd = await ad.save();
    res.status(201).json(newAd);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update an ad
router.put('/:id', async (req, res) => { 
  try {
    const updatedAd = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedAd);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an ad
router.delete('/:id', async (req, res) => { 
  try {
    await Ad.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ad deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const News = require('../models/News');

// Get all news
router.get('/', async (req, res) => {
  try {
    const news = await News.find().sort({ timestamp: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a news item
router.post('/', async (req, res) => {
 
  const { title, content, image, video, tags, popularity, timestamp } = req.body;
  
  try {
    const news = await News.create({
      title,
      content,
      image,
      video,
      tags,
      popularity: popularity,
      timestamp,
    });

    res.status(201).json(news);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a news item
router.put('/:id', async (req, res) => { 
  try {
    const updatedNews = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedNews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a news item
router.delete('/:id', async (req, res) => {
  
  try {
    await News.findByIdAndDelete(req.params.id);
    res.json({ message: 'News deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
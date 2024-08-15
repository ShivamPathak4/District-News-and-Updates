const mongoose = require('mongoose');

const AdSchema = new mongoose.Schema({
  image: String,
  video: String,
  link: { type: String}
});

module.exports = mongoose.model('Ad', AdSchema);
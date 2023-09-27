const mongoose = require('mongoose');

const audioSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  gridfsFileId: mongoose.Schema.Types.ObjectId, // Add this field to store the GridFS file ID
});

module.exports = mongoose.model('Audio', audioSchema);

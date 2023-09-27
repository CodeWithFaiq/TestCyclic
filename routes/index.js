const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const Audio = require('../models/audio');
const { Readable } = require('stream'); // Add this line
const path = require('path');
const os = require('os');
const fs = require('fs');
const Busboy = require('busboy');

// Set up Multer for handling file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Handle GET request to the record page
router.get('/', (req, res) => {
  // You need to replace 'yourAudioId' with the actual ID you want to pass to the template
  const audioId = req.params.id;

  res.render('record', { audioId }); // Pass the audioId as a variable to the template
});

router.post('/record/save', upload.single('audio'),  async (req, res) => {
  console.log(req.file.buffer);

        // Set the file to be publicly accessible



 
});
// ...




module.exports = router;

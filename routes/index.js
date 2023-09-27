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
  
    const audioData = req.file.buffer;

    // Access the GridFS instance initialized in app.js
    const gfs = req.app.get('gfs');

    // Store the audio in GridFS
    const uploadStream = gfs.openUploadStream('recorded_audio.wav', {
        contentType: 'audio/wav',
    });

    // Pipe the audio data to the GridFS upload stream
    const readStream = new Readable();
    readStream.push(audioData);
    readStream.push(null);
    readStream.pipe(uploadStream);

    // Handle upload completion and errors
    uploadStream.on('error', (error) => {
        console.error('Error saving audio to GridFS:', error);
        res.status(500).send('Error saving audio.');
    });

    uploadStream.on('finish', async () => {
        console.log('Audio saved successfully to GridFS.');

        // Create an Audio document that references the GridFS file ID
        const audio = new Audio({
            filename: 'recorded_audio.wav',
            contentType: 'audio/wav',
            gridfsFileId: uploadStream.id, // Store the GridFS file ID
        });

        // Save the Audio document to MongoDB
        await audio.save();

        res.status(200).send('Audio saved successfully.');

        

    }

        // Set the file to be publicly accessible


    
 
    });
// ...




module.exports = router;

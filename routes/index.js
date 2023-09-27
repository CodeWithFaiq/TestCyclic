const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');
const Audio = require('../models/audio');
const { Readable } = require('stream'); // Add this line


// Set up Multer for handling file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Handle GET request to the record page
router.get('/', (req, res) => {
  // You need to replace 'yourAudioId' with the actual ID you want to pass to the template
  const audioId = req.params.id;

  res.render('record', { audioId }); // Pass the audioId as a variable to the template
});

// ...
router.post('/record/save', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No audio file uploaded.');
    }

    // Create a readable stream from the audio data
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
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error saving audio.');
  }
});
// ...



// Handle POST request to delete audio
router.post('/record/delete/:id', async (req, res) => {
  try {
    const audioId = req.params.id;

    // Find the Audio document by ID
    const audio = await Audio.findById(audioId);

    if (!audio) {
      return res.status(404).send('Audio not found.');
    }

    // Access the GridFS instance initialized in app.js
    const gfs = req.app.get('gfs');

    // Delete the audio file from GridFS using the gridfsFileId from the Audio document
    await gfs.delete(audio.gridfsFileId);

    // Remove the audio document from MongoDB
    await Audio.findByIdAndDelete(audioId);

    console.log('Audio deleted successfully.');

    res.status(200).send('Audio deleted successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting audio.');
  }
});

router.get('/audio/:id', async (req, res) => {
  try {
    const audioId = req.params.id;

    // Access the GridFS instance initialized in app.js
    const gfs = req.app.get('gfs');

    // Find the audio file by its ID
    const file = await gfs.find({ _id: new mongoose.Types.ObjectId(audioId) }).toArray();


    if (!file || file.length === 0) {
      return res.status(404).send('Audio not found.');
    }

    // Set the appropriate content type
    res.set('Content-Type', 'audio/wav'); // Set the correct content type based on the file format


    // Create a read stream and pipe it to the response
    const readStream = gfs.openDownloadStream(mongoose.Types.ObjectId(audioId));
    readStream.pipe(res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error serving audio.');
  }
});



// Handle GET request to display all audios
router.get('/audio', async (req, res) => {
  try {
    // Query the database to retrieve all audio records
    const audios = await Audio.find();

    // Render the 'audio.ejs' view with the list of audios
    res.render('audio', { audios });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching audios.');
  }
});


module.exports = router;

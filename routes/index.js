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

router.post('/record/save',  async (req, res) => {
    try {


 

        const busboy = Busboy({ headers: req.headers });
        const tmpdir = os.tmpdir();

        // This object will accumulate all the fields, keyed by their name
        const fields = {};

        // This object will accumulate all the uploaded files, keyed by their name.
        const uploads = {};

        // This code will process each non-file field in the form.
        busboy.on('field', (fieldname, val) => {
            console.log('in field');
            /**
             *  TODO(developer): Process submitted field values here
             */
            console.log(`Processed field ${fieldname}: ${val}.`);
            fields[fieldname] = val;
        });

        const fileWrites = [];
        let fileName = ''
        let fileBuffer=''

        // This code will process each file uploaded.
        busboy.on('file', (fieldname, file, { filename }) => {
            console.log('in file 2')
            fileName = filename
            // Note: os.tmpdir() points to an in-memory file system on GCF
            // Thus, any files in it must fit in the instance's memory.
            console.log(`Processed file ${filename}`);
            const filepath = path.join(tmpdir, filename);
            uploads[fieldname] = filepath;

            const writeStream = fs.createWriteStream(filepath);
            file.pipe(writeStream);

            // File was processed by Busboy; wait for it to be written.
            // Note: GCF may not persist saved files across invocations.
            // Persistent files must be kept in other locations
            // (such as Cloud Storage buckets).
            const promise = new Promise((resolve, reject) => {
                file.on('data',(chunk)=>{
                    fileBuffer=chunk;
                })
                file.on('end', () => {
                    writeStream.end();
                });
                writeStream.on('close', resolve);
                writeStream.on('error', reject);
            });
            fileWrites.push(promise);
        });

        // Triggered once all uploaded files are processed by Busboy.
        // We still need to wait for the disk writes (saves) to complete.
        busboy.on('finish', async () => {
            await Promise.all(fileWrites);

            /**
             * TODO(developer): Process saved files here
             */
            for (const files in uploads) {
                
                console.log(`files includes :${files}`);
                console.log(uploads);
                const audioData = fs.readFileSync(uploads.audio);
                console.log('from here');

                // Access the GridFS instance initialized in app.js
                const gfs = req.app.get('gfs');

                // Define the desired filename and content type
                // Use the original filename or customize as needed
                const contentType = 'audio/wav'; // Set the appropriate content type

                // Store the audio in GridFS
                const uploadStream = gfs.openUploadStream(fileName, {
                    contentType: contentType,
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
                        filename: fileName,
                        contentType: contentType,
                        gridfsFileId: uploadStream.id, // Store the GridFS file ID
                    });

                    // Save the Audio document to MongoDB
                    await audio.save();
                });
                res.send('successfully')






                // fs.unlinkSync(uploads[files]);
            }
            // res.send();
        });

        req.pipe(busboy);

        // Set the file to be publicly accessible



    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// ...




module.exports = router;

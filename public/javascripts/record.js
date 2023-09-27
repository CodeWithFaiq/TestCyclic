document.addEventListener('DOMContentLoaded', () => {
  const startRecordingButton = document.getElementById('startRecording');
  const stopRecordingButton = document.getElementById('stopRecording');
  const submitButton = document.getElementById('submit');
  const deleteButton = document.getElementById('delete');
  let mediaRecorder;
  let audioChunks = [];
  const headers = new Headers();
// You need to set the 'Content-Type' header to 'multipart/form-data'
  headers.append('Content-Type', 'multipart/form-data');

  startRecordingButton.addEventListener('click', () => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        mediaRecorder.start();
        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = false;
      })
      .catch((error) => {
        console.error('Error starting recording:', error);
      });
  });

  stopRecordingButton.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      startRecordingButton.disabled = false;
      stopRecordingButton.disabled = true;
    }
  });

  submitButton.addEventListener('click', () => {
    if (audioChunks.length === 0) {
      return alert('No audio recorded.');
    }

    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
    const audioFormData = new FormData();
    audioFormData.append('audio', audioBlob, 'recorded_audio.wav');

    fetch('/record/save', {
      method: 'POST',
      headers: headers,
      body: audioFormData,
    })
      .then((response) => {
        if (response.ok) {
          alert('Audio saved successfully.');
          audioChunks = [];
        } else {
          alert('Error saving audio.');
        }
      })
      .catch((error) => {
        console.error('Error saving audio:', error);
      });
  });

  deleteButton.addEventListener('click', () => {
    const audioId = deleteButton.getAttribute('data-audio-id');

    fetch(`/record/delete/${audioId}`, {
      method: 'POST',
    })
      .then((response) => {
        if (response.ok) {
          alert('Audio deleted successfully.');
          deleteButton.style.display = 'none';
        } else {
          alert('Error deleting audio.');
        }
      })
      .catch((error) => {
        console.error('Error deleting audio:', error);
      });
  });
});

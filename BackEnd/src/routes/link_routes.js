const express = require('express');
const router = express.Router();
const invitations = require('../logics/invitations.js');
const multer = require('multer');
const fs = require('fs');
const csvParser = require('csv-parser');
const { isAdmin } = require('../middleware/aut_jwt');
var admin;

const upload = multer({
  dest: 'uploads/',
});


router.post('/send-invitations', upload.single('file'), async function (req, res, next) {

  admin = isAdmin(req, res);

  if (admin) {

    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file sent' });
    }

    try {
      const result = await processFile(file, admin);

      if (result.success) {
        return res.status(200).json({ success: true, message: 'Emails sent successfully' });
      } else if (result.success === false && result.type === 'validation') {

        result.errors.forEach((error) => {
          error.errors.forEach((errMsg) => {
            console.log(` - ${errMsg}`);
          });
        });

        return res.status(400).json({ success: false, type: 'validation', message: 'Error in this field', errors: result.errors });
      } else {
        return res.status(400).json({ success: false, message: 'Something went wrong', errors: result.errors });
      }
    } catch (error) {
      console.error('Error processing file:', error.message);
      return res.status(500).json({ success: false, message: 'Error processing the file', error: error.message });
    }
  }
});

const processFile = async (file, admin) => {
  const mime = file.mimetype.toLowerCase(); // Ottieni il tipo MIME
  let data = [];

  const maxFileSize = 2 * 1024 * 1024;
  if (file.size > maxFileSize) {
    return { success: false, error: 'The file exceeds the permitted size (Max 2MB).' };
  }

  try {
    switch (mime) {
      case 'application/json':
        data = await readJSON(file.path); // Assicurati che questa sia una funzione asincrona se necessario
        break;
      case 'text/csv':
        data = await readCSV(file.path);
        break;
      default:
        throw new Error('Unsupported file format. Please use a .json or .csv file.');
    }
    
    // Controlla la validità di ogni email e chiave pubblica
    const validationErrors = data.map((item, index) => {
      const email = item.email;
      const key = item.publicKey;
      const errors = [];

      if (!validateEmail(email)) {
        errors.push(`Invalid email at entry #${index + 1}: "${email}"`);
      }

      if (!validatePublicKey(key)) {
        errors.push(`Invalid public key at entry #${index + 1}`);
      }

      return errors.length > 0 ? { index, errors } : null;
    }).filter(Boolean); // Rimuovi gli oggetti null

    // Se ci sono errori di validazione, restituisci gli errori
    if (validationErrors.length > 0) {
      return { success: false, type: 'validation', errors: validationErrors };
    }

    // Raccogliamo tutte le promesse di invio email
    const emailPromises = data.map(async (item) => {
      const email = item.email;
      const key = item.publicKey;
      try {
        await invitations.sendEmail(email, key, admin);
        console.log(`Email sent to ${email}`);
        return { email, error: null };
      } catch (error) {
        console.log(`Error sending email to ${email}: ${error.message}`);
        return { email, error: error.message };
      }
    });

    // Aspettiamo che tutte le promesse di invio email siano completate
    const emailResults = await Promise.all(emailPromises);

    // Filtriamo le email che non sono state inviate correttamente
    const errors = emailResults.filter(result => result.error).map(result => ({
      email: result.email,
      error: result.error,
    }));

    // Se ci sono errori, restituiamo gli errori
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Se tutte le email sono state inviate con successo
    return { success: true };

  } catch (error) {
    // Log per capire dove si verifica l'errore
    console.error('Error processing file:', error);
    return { success: false, error: error.message || 'Error processing file' };
  }
};

// Funzione per leggere il file JSON
const readJSON = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject('Error reading JSON file: ' + err.message);
        return null;
      } else {
        try {
          resolve(JSON.parse(data));
        } catch (parseError) {
          reject('Error parsing JSON file: ' + parseError.message);
          return null;
        }
      }
    });
  });
};

// Funzione per leggere il file CSV
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject('Error reading CSV file: ' + err.message));
  });
};

// Funzione per validare l'email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Funzione per validare la chiave pubblica PGP
const validatePublicKey = (key) => {
  const cleanedKey = key.trim();
  const pgpRegex = /-----BEGIN PGP PUBLIC KEY BLOCK-----[\s\S]+-----END PGP PUBLIC KEY BLOCK-----/;
  return pgpRegex.test(cleanedKey);
};

module.exports = router;

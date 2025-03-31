const axios = require('axios'); 
const config = require('./config');

// Effettua una richiesta GET al server Python per ottenere la chiave pubblica
const checkKey = async () => {
    try {
        const response = await axios.get('http://127.0.0.1:5000/getkey');
        const pubKey = response.data.pub_key;

        // Se la chiave pubblica è stata ricevuta, la salva
        if (pubKey) {
            config.pubKey = pubKey;
            console.log("Chiave pubblica ricevuta dal server Python:");
            return true;  // Indica che la chiave è stata ricevuta correttamente

        } else {
            console.log("Chiave pubblica non trovata nella risposta");
            return false;  // La chiave non è presente nella risposta
        }
    } catch (error) {
        // Gestisce l'errore se la richiesta al server Python fallisce
        console.error("Errore nella richiesta al server Python:", error.message);
        return false;  // Indica che c'è stato un errore
    }
};



const waitForKey = async () => {
     while (!config.pubKey) {
        const keyReceived = await checkKey();
        if (keyReceived) {
            return;
        }
        // Se la chiave non è ancora stata ricevuta, aspetta 2 secondi prima di riprovare
        console.log("Aspettando la chiave pubblica...");
        await new Promise(resolve => setTimeout(resolve, 2000));  // Aspetta 2 secondi
    }
};

module.exports={
    waitForKey
}
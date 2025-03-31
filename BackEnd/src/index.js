const express = require('express');
const cookieParser = require('cookie-parser');
const config = require('./config');
const cors = require('cors');
const app = express();

const client_routes= require('./routes/client_routes')
const lawyer_routes= require('./routes/lawyer_routes')
const admin_routes= require('./routes/admin_routes')
const keys_routes= require('./routes/keys_routes')
const server_functions=require('./logics/server_functions')
const link_routes= require('./routes/link_routes')
const PORT = 3000;
const obtainpk = require('../src/getkey')
const path = require('path');


// Configura CORS
app.use(cors({
    origin: 'http://localhost:4200',  // Permetti le richieste solo da questa origine (Angular)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Specifica i metodi HTTP consentiti
    allowedHeaders: ['Content-Type', 'Authorization'],  // Specifica gli header consentiti
    credentials: true  // Se vuoi consentire i cookie e le credenziali
}));
  
app.use(cookieParser())
app.use(express.json());

//gestione comunicazione con il server key per ricevere la chiave pubblica
initKey()

//gestione per la verifica di matching
setInterval(async () => {
    await server_functions.verifyMatching();
}, 20000);

app.use('/clients', client_routes);
app.use('/lawyer', lawyer_routes);
app.use('/admin', admin_routes);
app.use('/getKeys', keys_routes);

app.use('/', link_routes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

app.listen(PORT, () => {
    console.log(`Server in ascolto su http://localhost:${PORT}`);
});

async function initKey(){
    if(!config.pubKey){
        await obtainpk.waitForKey();
        console.log(config.pubKey);
    }
}





module.exports = app;
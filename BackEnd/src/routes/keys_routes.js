const express = require('express');
var router = express.Router();
const config = require('../config');

router.get('/server-publickey', function(req, res, next) {
    
    if (!config.pubKey) {
        return res.status(400).json({ error: 'Chiave pubblica non disponibile' });
    }
    res.status(200).json({ pub_key: config.pubKey });
});


module.exports = router;
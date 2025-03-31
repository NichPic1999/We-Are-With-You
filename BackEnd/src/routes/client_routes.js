var express = require('express');
var router = express.Router();
const client_functions = require('../logics/client_functions');
const { validationResult, body } = require('express-validator');
const { isClient } = require('../middleware/aut_jwt');
const lawyer_key_function = require("../logics/lawyer_key_function");


var client;


router.post('/signup', [ 

    body('email').trim().notEmpty().withMessage('email is not valid'),
    body('password').trim().notEmpty().withMessage('Password < 5 Caratteri'),
    body('telephoneNumber').trim().notEmpty().withMessage('telephoneNumber is not valid'),
    body('hashEmail').trim().notEmpty().withMessage('hashEmail is not valid'),

],(req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    } else {
        const { email, password, telephoneNumber, hashEmail } = req.body;
        
        client_functions.registration(req, res, { email,password,telephoneNumber,hashEmail });
    }
   
});

// scelta della chiave durante l'inserimento di un nuovo report 
router.post('/lawyer-key', [ 

    body('piValue').trim().notEmpty().withMessage('piValue is not valid'),  

], (req, res, next) => {
    
    client = isClient(req, res)

    if (client) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        } else {
            const { piValue } = req.body;
          
            lawyer_key_function.retrieveLawyerKey(req,res, {piValue})

        }
    }
    
});


//recupero chiave per cifrare il report con lo stesso avvocato
router.post('/same_lawyer-key', [ 

    body('uuidLawyer').trim().notEmpty().withMessage('uuidLawyer is not valid'),  

], (req, res, next) => {
    
    client = isClient(req, res)

    if (client) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        } else {
            const { uuidLawyer } = req.body;
            
        
            lawyer_key_function.retrieveLawyerKeybyUuid(req,res,uuidLawyer)

        }
    }
    
});


router.post('/complaint', [ 

    body('piValuePerpetrator').trim().notEmpty().withMessage('piValuePerpetrator is not valid'),
    body('cCipher').trim().notEmpty().withMessage('cCipher is not valid'),
    body('cipherKeyWithKU').trim().notEmpty().withMessage('cipherKeyWithKU is not valid'),
    body('eRecord').trim().notEmpty().withMessage('eRecord is not valid'),
    body('publicKeyLawyer').trim().notEmpty().withMessage('publicKeyLawyer is not valid'),

],(req, res, next) => {

    client = isClient(req, res)

    if (client) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        } else {
            const { piValuePerpetrator, cCipher, cipherKeyWithKU,eRecord, publicKeyLawyer } = req.body;
            
            client_functions.complaint(req, res, { piValuePerpetrator,cCipher,cipherKeyWithKU,eRecord,publicKeyLawyer });
        }
    }
   
});

router.post('/retrieve_record', [ 

    body('piValuePerpetrator').trim().notEmpty().withMessage('piValuePerpetrator is not valid'),
    body('userKey').trim().notEmpty().withMessage('userKey is not valid'),
   
],(req, res, next) => {

    client = isClient(req, res)

    if (client) {

        
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        } else {
            const { piValuePerpetrator, userKey } = req.body;
            
            client_functions.retrieve_record(req, res, { piValuePerpetrator,userKey });
        }
    }
   
});

router.post('/delete_report', [ 

    body('idReport').trim().notEmpty().withMessage('idRecord is not valid'),
    
],(req, res, next) => {

    client = isClient(req, res)

    if (client) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        } else {

            const { idReport } = req.body;

            client_functions.delete_record(req, res, { idReport });
        }
    }
   
});

router.post('/update_all_report', [ 

    body('dbTuple.piValuePerpetrator').trim().notEmpty().withMessage('piValuePerpetrator is required'),
    body('dbTuple.cCipher').trim().notEmpty().withMessage('cCipher is required'),
    body('dbTuple.cipherKeyWithKU').trim().notEmpty().withMessage('cipherKeyWithKU is required'),
    body('dbTuple.eRecord').trim().notEmpty().withMessage('eRecord is required'),
    body('idReport').trim().notEmpty().withMessage('idReport is required'),
 
   
],(req, res, next) => {

    client = isClient(req, res)

    if (client) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        } else {
            
            const { dbTuple, idReport } = req.body;

            client_functions.update_all_record(req, res, { dbTuple, idReport });
        }
    }
   
});

router.post('/update_only_details', [ 

    body('newRecord').trim().notEmpty().withMessage('newRecord is required'),
    body('idReport').trim().notEmpty().withMessage('idRecord is required'),
    
    
],(req, res, next) => {

    client = isClient(req, res)

    if (client) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        } else {
            
            const { newRecord,idReport } = req.body;
           
            client_functions.update_only_details(req, res, { newRecord,idReport });
        }
    }
   
});

router.get('/retrieve_email', function(req, res, next) {

    client = isClient(req,res);
    console.log(client)
    if(client){
        client_functions.retrieve_email(req,res,client)
    }
});


module.exports = router;
var express = require('express');
var router = express.Router();
const config = require('../config');
const { isLawyer } = require('../middleware/aut_jwt');
const server_functions = require('../logics/server_functions')
const lawyer_key_functions = require('../logics/lawyer_key_function')
var lawyer;

router.get('/last_match', function(req, res, next) {

    lawyer = isLawyer(req,res);
    
    if(lawyer){
        listOfReports = server_functions.returnLastMatchingOfLawyer(lawyer);

        if (!listOfReports) {
            return res.status(400).json({ error: 'There are no matching' });
        }
        res.status(200).json({ listReports: listOfReports});
    }
    
});

router.get('/lawyer_key', function(req, res, next) {

    lawyer = isLawyer(req,res);

    if(lawyer){
        lawyer_key_functions.retrieveLawyerKeybyUuid(req,res,lawyer)
    }
});

module.exports = router;
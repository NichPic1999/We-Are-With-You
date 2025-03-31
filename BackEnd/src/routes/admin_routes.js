var express = require('express');
var router = express.Router();
const admin_functions = require('../logics/admin_functions');
const { validationResult, body } = require('express-validator');
const { isAdmin } = require('../middleware/aut_jwt');
var admin;


router.post('/register-lawyer', [

    body('email').trim().notEmpty().withMessage('email is not valid'),
    body('password').trim().notEmpty().withMessage('password is not valid'),
    body('publicKey').trim().notEmpty().withMessage('publicKey is not valid'),

], (req, res, next) => {

    admin = isAdmin(req, res);

    if (admin) {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        } else {
            const { email, password, publicKey } = req.body;

            admin_functions.registrationLawyer(req, res, { email, password, publicKey });
        }
    }


});

module.exports = router;
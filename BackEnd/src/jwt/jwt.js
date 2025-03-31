const jwt = require('jsonwebtoken');
const config = require('../config');


// function generateTokenClient(params) {
//     return jwt.sign({
//         uuidClient: params.UuidClient,
//         email: params.Email,
//         telephoneNubmer: params.TelephoneNubmer,
//     }, config.JWT_SECRET);
// }

function verifyToken(req, res) {
    try {
        return jwt.verify(req.cookies.token, config.JWT_SECRET, (err, data) => {
            if (err) {
                res.status(403).json({ message: "Invalid token" });
                return null; 
            } else {
                return data; 
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Token verification error" });
        return null;
    }
}

function ensureToken(req, res) {
    if (req.cookies.token) {
        return req.cookies.token;
    } else {
        res.status(403).json({ message: "token not available" });
    }
}

module.exports = {
    //generateTokenClient,
    verifyToken,
    ensureToken
};
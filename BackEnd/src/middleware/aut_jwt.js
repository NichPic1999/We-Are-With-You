const { verifyToken, ensureToken } = require('../jwt/jwt');

function isClient(req, res, next) {
    const isToken = ensureToken(req, res)
    if (isToken === null) {
        res.sendStatus(403).json({
            message: "invalid"
        });
    } else {
        const entity = verifyToken(req, res, next)
        if (entity.UuidClient) {
            return entity.UuidClient
        } else {
            res.sendStatus(401).json({
                message: "You're not a client"
            })
            return false;
        }

    }
}

function isAdmin(req, res, next) {
    
    const isToken = ensureToken(req, res)
    if (isToken === null) {
        res.sendStatus(403).json({
            message: "invalid"
        });
    } else {
        const entity = verifyToken(req, res, next)
        if (entity.UuidAdmin) {
            return entity.UuidAdmin
        } else {
            res.sendStatus(401).json({
                message: "You are not a admin"
            })
            return false;
        }

    }
}

function isLawyer(req, res, next) {
    const isToken = ensureToken(req, res)
    if (isToken === null) {
        res.sendStatus(403).json({
            message: "invalid"
        });
    } else {
        const entity = verifyToken(req, res, next)
        if (entity.UuidLawyer) {
            return entity.UuidLawyer
        } else {
            res.sendStatus(401).json({
                message: "You're not a lawyer"
            })
            return false;
        }

    }
}

module.exports = {
    isClient,
    isAdmin,
    isLawyer
};
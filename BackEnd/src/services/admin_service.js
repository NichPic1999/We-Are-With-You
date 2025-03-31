const db = require('../models/connection');
const { v4: uuidv4 } = require('uuid');
const lawyers = db.lawyer;


async function createLawyer(req,res,data) {
    try {
        const lawyer = await lawyers.create({
            UuidLawyer: uuidv4(),
            Email: data.email,
            Password: data.password,
            PublicKey: data.publicKey
        });

        return {
            success: true,
            message: 'Lawyer created successfully'
        }; 
    } catch (err) {
        console.error('Error creating lawyer:', err);
        return {
            success: false,
            error: err,
            message: 'Error creating lawyer'
        }; 
    }
}


module.exports={
    createLawyer,
};

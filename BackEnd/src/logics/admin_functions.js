const admin_service = require('../services/admin_service')

async function registrationLawyer(req, res, data) {
    try {
        const result = await admin_service.createLawyer(req, res, data);

        // Se la registrazione è andata a buon fine
        if (result.success) {
            console.log('Lawyer registration successful:', result.message);
            // Restituisci una risposta di successo 
            return res.status(200).json({
                success: true,
                message: result.message
            });
        } else {
            console.error('Error in lawyer creation:', result.message);
            // Restituisci un errore 
            return res.status(400).json({
                success: false,
                message: result.message,
                error: result.error
            });
        }
    } catch (err) {
        console.error('Unexpected error during lawyer registration:', err);
        // Restituisci un errore generico 
        return res.status(500).json({
            success: false,
            message: 'Unexpected error during lawyer registration',
            error: err.message || err
        });
    }
}

module.exports={
    registrationLawyer,
};


const client_service = require('../services/client_service')
const invitation_service = require('../services/invitation_service')

async function registration(req, res, data) {
    try {
        // 1. Verifica la validità dell'invito
        const validInvitation = await invitation_service.verifyValidInvitation(req, res, data);
        if (!validInvitation.success) {
            // Se l'invito non è valido, ritorna un errore
            return res.status(400).json({
                message: validInvitation.message
            });
        }
        // 2. Se l'invito è valido, procedi alla creazione dell'utente
        const clientRes = await client_service.createClient(req, res, data);
        if (clientRes.success) {

            const updateRes = await invitation_service.updateValidityInvitation(validInvitation.message);

            // Registrazione riuscita, invia la risposta di successo
            if (updateRes.success) {
                // Se anche l'aggiornamento è riuscito, invia la risposta di successo
                return res.status(200).json({
                    message: 'Successful registration',
                });
            } else {
                // Se l'aggiornamento dell'invito fallisce, invia un errore
                return res.status(400).json({
                    message: updateRes.message || 'Failed to update invitation.'
                });
            }
        } else {
            // In caso di errore nella creazione dell'utente, invia il messaggio di errore
            return res.status(400).json({
                message: clientRes.message
            });
        }
    } catch (error) {
        // Gestisci eventuali errori imprevisti
        console.error('Error during registration:', error);
        return res.status(500).json({
            message: 'An error occurred during the registration process.',
            error: error.message
        });
    }
}


async function complaint(req, res, data) {
    
    const result = await client_service.insertReport(req, res, data);
    
    if (result.success) {
        return res.status(200).json({
            message: 'Report successfully submitted',
        });

    } else {
       return res.status(result.status).json({
            message: 'Error in report submission',
            error:result.error
        });
    }
}

async function retrieve_record(req, res, data) {

    const report = await client_service.getRecord(req, res, data);
    if (!report) {
        return res.status(405).json({
            message: 'No report was found'
        });
    } else {

        return res.status(200).json({
            message: 'Report founded',
            report:  report,
        });
    }
}

async function delete_record(req, res, data) {

    const status = await client_service.deleteReport(req, res, data);
    if (!status) {
        return res.status(405).json({
            message: 'No report was found'
        });
    } else {
        return res.status(200).json({
            message: 'The report was successfully deleted',
        });
    }
}

async function update_all_record(req, res, data) {

    const response = await client_service.updateAllReport(req, res, data);
    if (response.status === 404) {
        
        return res.status(404).json({
            message: response.message
        });

    } else if(response.status === 200){
        
        return res.status(200).json({
            message: response.message,
        });

    }else{
        return res.status(500).json({
            message: response.message,
        });
    }
}

async function update_only_details(req, res, data) {

    
    const response = await client_service.updateonlyDetails(req, res, data);
    if (response.status === 404) {
        
        return res.status(404).json({
            message: response.message
        });

    } else if(response.status === 200){
        
        return res.status(200).json({
            message: response.message,
        });

    }else{
        return res.status(500).json({
            message: response.message,
        });
    }
}

async function retrieve_email(req, res, client) {

    const result = await client_service.getEmailtByUuid(req, res, client);

    if (result.success) {
        return res.status(200).json({
            message: 'client successfully recovered',
            data: result.data
        });
    } else {
        return res.status(result.status).json({
            message: 'Error in client recovery',
            error: result.error
        });
    }

}

module.exports={
    registration,
    complaint,
    retrieve_record,
    delete_record,
    update_all_record,
    update_only_details,
    retrieve_email
};
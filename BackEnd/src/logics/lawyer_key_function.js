const lawyer_key_service = require('../services/lawyer_key_service')

async function retrieveLawyerKey(req, res, data) {

    try {

        const response = await lawyer_key_service.getReportAndLawyerByPiValueForAllLawyers(req, res, data);

        if (response.PublicKey) {

            console.log(response.PublicKey)

            res.status(200).json({
                success: true,
                message: response.message,
                data: {
                    PublicKey: response.PublicKey
                },
            });

        } else {
            console.log("non c'è l'avvocato che gestisce quel report")

            try {
                const result = await lawyer_key_service.getReportCountByLawyer(req, res);

                if (result.message) {

                    //il db è vuoto di report 
                    const firstLawyer = await lawyer_key_service.getKeyByLawyer(req, res);

                    return res.status(200).json({
                        success: true,
                        data: {
                            PublicKey: firstLawyer.PublicKey
                        },
                    });

                } else {
                    console.log('Avvocato con meno report trovato:', result);

                    return res.status(200).json({
                        success: true,
                        message: response.message,
                        data: {
                            PublicKey: result.PublicKey
                        },
                    });


                }
            } catch (error) {
                console.error('Errore durante la ricerca dell\'avvocato con meno report:', error);
            }
        }

    } catch (error) {
        // Gestione degli errori
        console.error('Errore durante la gestione della risposta:', error);

        return res.status(500).json({
            success: false,
            message: 'Si è verificato un errore durante l\'elaborazione della richiesta.',
            error: error.message,
        });
    }
}

async function retrieveLawyerKeybyUuid(req, res, lawyer) {

    const result = await lawyer_key_service.getKeyByUuidLawyer(req, res, lawyer);

    if (result.success) {
        return res.status(200).json({
            message: 'Key successfully recovered',
            data: result.data
        });
    } else {
        return res.status(result.status).json({
            message: 'Error in key recovery',
            error: result.error
        });
    }



}

module.exports = {
    retrieveLawyerKey,
    retrieveLawyerKeybyUuid
};
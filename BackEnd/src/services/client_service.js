const db = require('../models/connection');
const { v4: uuidv4 } = require('uuid');
const sodium = require('sodium-native');
const clients = db.client;
const reports = db.report;
const lawyes = db.lawyer;


async function createClient(req, res, data) {

    const existingUser = await clients.findOne({
        where: {
            HashEmail: data.hashEmail
        }
    });

    if (existingUser) {

        return { success: false, message: 'Existing user with this email.' };

    } else {

        try {
            const client = await clients.create({
                UuidClient: uuidv4(),
                Email: data.email,
                Password: data.password,
                TelephoneNumber: data.telephoneNumber,
                HashEmail: data.hashEmail
            })

            return { success: true, client: client };

        } catch (err) {
            return { success: false, message: 'Internal error during user creation.', error: err };
        }

    }


}

async function getUserByCredential(req, res, data) {
    let loginUser;

    loginUser = await clients.findOne({ where: { Email: data.email } }).then(client => {
        if (!client) {
            return false;
        }
        return client.Password = data.password

    }).then(isEqual => {
        if (isEqual !== 0) {
            return loginUser = false;
        } else
            return loginUser;
    });
    return loginUser;


}


async function insertReport(req, res, data) {

    try {
        const lawyer = await lawyes.findOne({
            where: { PublicKey: data.publicKeyLawyer },
        });

        if (!lawyer) {
            return { success: false, status: 404, message: 'Avvocato non trovato' };
        }


        await reports.create({
            UuidReport: uuidv4(),
            PiValue: data.piValuePerpetrator,
            CipherC: data.cCipher,
            CipherUser: data.cipherKeyWithKU,
            ERecord: data.eRecord,
            UuidLawyer: lawyer.UuidLawyer
        })

        return { success: true, status: 201, message: 'Report creato con successo' };

    } catch (error) {
        console.error('Error while processing the request:', error.message);
        return {
            success: false,
            status: 500,
            message: 'Error while processing the request',
            error: error.message,
        };
    }

}


async function getRecord(req, res, data) {

    let listOfReports;
    console.log(data.piValuePerpetrator)

    listOfReports = await reports.findAll({
        where: {
            PiValue: data.piValuePerpetrator
        }
    });

    if (listOfReports.length > 0) {

        const key = data.userKey;
        //converto la chiave in array di byte 
        const arrayByteKey = Buffer.from(key, 'hex');

        //converto la stringa serializzata degli aggressori in array di byte 
        const piValuePerpetratorInByte = Buffer.from(data.piValuePerpetrator, 'utf8');

        // Filtra i record per verificare quale può essere decifrato con successo
        const validRecord = listOfReports.find(report => {
            try {

                const decryptedKey = decrypt(report.CipherUser, arrayByteKey, piValuePerpetratorInByte);


                if (decryptedKey !== null) {
                    return true;  // La chiave è corretta se decifra senza errori
                }
                return false;  // La decifratura non è valida
            } catch (error) {
                // Se si verifica un errore di decifratura (chiave sbagliata), ignoriamo il record
                return false;
            }
        });

        // Se è stato trovato un record valido, restituiscilo
        if (validRecord) {

            console.log("Record decifrato correttamente:");
            return validRecord; // Restituisci il record decifrato

        } else {
            console.log("Nessun record decifrato correttamente.");
            return null;  // Nessun record valido
        }
    } else {
        console.log("Nessun record trovato.");
        return null;  // Nessun record trovato
    }
}

async function deleteReport(req, res, data) {

    try {
        // Utilizza il metodo destroy per eliminare il record con l'id specificato
        const result = await reports.destroy({
            where: {
                UuidReport: data.idReport
            }
        });

        // Verifica se un record è stato eliminato
        if (result > 0) {
            console.log(`Report eliminato con successo.`);
            return true;
        } else {
            console.log(`Nessun report trovato.`);
            return false;
        }
    } catch (error) {
        console.error('Errore durante l\'eliminazione del report:', error);
    }

}

async function updateAllReport(req, res, data) {

    try {
        const [updatedRows] = await reports.update(
            {
                PiValue: data.dbTuple.piValuePerpetrator,
                CipherC: data.dbTuple.cCipher,
                CipherUser: data.dbTuple.cipherKeyWithKU,
                ERecord: data.dbTuple.eRecord,
            },
            {
                where: { UuidReport: data.idReport },
            }
        );

        if (updatedRows === 0) {
            return { status: 404, message: 'Report not found or no changes made' };
        }

        return { status: 200, message: 'Report updated successfully' };

    } catch (error) {
        return { status: 500, message: 'Internal server error' };
    }
}

async function updateonlyDetails(req, res, data) {
    
    try {
        const [updatedRows] = await reports.update(
            {
                ERecord: data.newRecord,
            },
            {
                where: { UuidReport: data.idReport },
            }
        );

        if (updatedRows === 0) {
            return { status: 404, message: 'Report not found or no changes made' };
        }

        return { status: 200, message: 'Report updated successfully' };

    } catch (error) {
        return { status: 500, message: 'Internal server error' };
    }


}

function decrypt(text, key, piValuePerpetrator) {

    try {

        //converto il cifrato della chiave salvato in esadecimale in array di byte
        const cipherInByte = Buffer.from(text, 'hex');

        //recupero il nonce dal cifrato della chiave
        const recoveredNonce = cipherInByte.subarray(0, 24);

        //recupero il cifrato della chiave
        const cipheredkey = cipherInByte.subarray(24);

        //16 è la lunghezza del tag di autenticazione (16 byte).
        const plaintext = Buffer.alloc(cipheredkey.length - 16);

        sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
            plaintext,
            null,
            cipheredkey,                // ciprato della chiave k'
            piValuePerpetrator,   //additional data in byte
            recoveredNonce,
            key
        )

        return plaintext;

    } catch (error) {
        console.error('Non è questo il record:', error);
        return null; // Restituisce null in caso di errore
    }
}

async function getEmailtByUuid(req, res, client) {
    try {
        const result = await clients.findOne({
            where: { UuidClient: client },
        });

        if (result) {
           
            console.log(result)
            return {
                success: true,
                data: { ClientEmail: result.dataValues.Email },
            };

        } else {
            
            return {
                success: false,
                error: 'Client not found',
            };
        }
    } catch (error) {
        console.error('Error fetching client:', error);
        return {
            success: false,
            error: 'An error occurred while fetching the client',
            details: error, 
        };
    }
}


module.exports = {
    getUserByCredential,
    createClient,
    insertReport,
    getRecord,
    deleteReport,
    updateAllReport,
    updateonlyDetails,
    getEmailtByUuid
};

const db = require('../models/connection');
const { v4: uuidv4 } = require('uuid');
const sodium = require('sodium-native');
const invitation = require('../models/invitation');
const invitations = db.invitation;


async function createInvitation(AdminUuid, email) {

    try {
        let EmailHashed = generateEmailHash(email); 
        

        const TokenCreated = generateToken();
        console.log('Generated token:',TokenCreated); 

        const existingInvitation = await invitations.findOne({
            where: {
                HashEmail: EmailHashed
            }
        });
       
        if (existingInvitation) {
            return { success: false, message: 'Already made an invitation for this user' };
        } else {
            
            const invitation = await invitations.create({
                UuidInvitations: uuidv4(),
                HashEmail: EmailHashed, 
                Token: TokenCreated,
                Is_used: false,
                UuidAdmin: AdminUuid,
            });

            return { success: true, invitation: invitation };
        }
    } catch (err) {
        return { success: false, message: 'Internal error during invitation creation.', error: err };
    }

}


async function verifyValidInvitation(req,res,data) {
    try {
        // Verifica se l'invito è valido
        const validInvitation = await invitations.findOne({
            where: {
                HashEmail: data.hashEmail,  // Usa l'email passata
                Is_used: false              // Solo inviti non utilizzati
            }
        });

        if (!validInvitation) {
            // Caso: Invito non trovato
            return { success: false, message: 'Invitation not found.' };
        }

        // Caso: Invito trovato ma già utilizzato
        if (validInvitation.Is_used) {
            return { success: false, message: 'Invitation already used.' };
        }

        // Caso: Invito valido
        return { success: true, message: validInvitation.UuidInvitations };

    } catch (error) {
        // Caso: Errore imprevisto
        console.error('Error verifying invitation:', error);
        return { success: false, message: 'An error occurred while verifying the invitation.', error: error.message };
    }
}

async function updateValidityInvitation(invitationUuid) {
    try {

      
        const validInvitation = await invitations.findOne({
            where: {
                UuidInvitations: invitationUuid,
                Is_used: false
            }
        });

        if (!validInvitation) {
            return { success: false, message: 'Invitation not found' };
        }

        // Se l'invito esiste e non è stato usato, aggiorna il campo 'Is_used'
        await invitations.update(
            { Is_used: true },
            { where: { UuidInvitations: invitationUuid } }
        );

        return { success: true, message: 'Invitation used' };
    } catch (error) {
        console.error('Error updating invitation validity:', error);
        return { success: false, message: 'Error updating invitation validity' };
    }
}




const generateEmailHash = (email) => {

      // Crea un buffer per l'input (email)
  const emailBuffer = Buffer.from(email, 'utf-8');
  
  // Crea un buffer per l'output (hash)
  const hashOutput = Buffer.alloc(sodium.crypto_hash_sha256_BYTES);

  // Calcola l'hash della email
  sodium.crypto_hash_sha256(hashOutput, emailBuffer);

  // Converte l'hash in una stringa esadecimale
  const hashedEmail = hashOutput.toString('hex');

  return hashedEmail;
};

const generateToken = () => {
    // Genera un buffer con 32 byte di dati casuali (256 bit)
    const tokenBuffer = Buffer.alloc(sodium.crypto_secretbox_KEYBYTES);
    sodium.randombytes_buf(tokenBuffer);

    // Converte il buffer in una stringa esadecimale
    return tokenBuffer.toString('hex');
};


module.exports = {
    createInvitation,
    verifyValidInvitation,
    updateValidityInvitation
};

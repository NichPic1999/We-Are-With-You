const nodemailer = require('nodemailer');
const openpgp = require('openpgp');
const invitation_service = require('./../services/invitation_service')
const sodium = require('sodium-native');


// Configura il trasportatore con variabili di ambiente per maggiore sicurezza
let transporter = nodemailer.createTransport({
  host: 'smtp.libero.it',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,  // Utilizza variabili di ambiente per la sicurezza
    pass: process.env.EMAIL_PASS,
  },
});

async function encMail(publicKey,invitation) {

  const inviteLink = `http://localhost:4200/signup?token=${invitation.Token}`;
  
  const encryptedText = await openpgp.encrypt({
    message: await openpgp.createMessage({ text: `Click the link to complete the registration: ${inviteLink}` }), 
    encryptionKeys: publicKey
  });

  return encryptedText;
}



async function sendEmail(email, key, Uuidadmin) {
  try {
    const publicKeyString = key.replace(/\\n/g, '\n');
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyString });

    let invitation = await initInvitation(Uuidadmin,email);

    if (!invitation) {

      throw new Error(`Invalid invitation for email: ${email}`);
    }
   
    const encryptedText = await encMail(publicKey,invitation);

    return new Promise((resolve, reject) => {
      let mailOptions = {
        from: 'nicholasdipasquo@libero.it', //email del sistema
        to: email,
        subject: 'Platform access link',
        text: encryptedText, // Il messaggio cifrato
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return reject(error); // Rifiuta la promessa con l'errore completo
        }
        console.log(info.response);
        resolve({
          response: info.response,
          messageId: info.messageId,
        }); 
      });
    });
  } catch (error) {
    console.error('Error in sending email:', error);
    throw error; 
  }
}

// Funzione per creare un invito
const initInvitation = async (admin, email) => {
  try {
      let invitation = await invitation_service.createInvitation(admin,email)
      if(invitation.success === false){
        console.error('Invititation not valid', invitation.message);
        return false;
      }else{
        return invitation.invitation

      }
  
     
  } catch (error) {
      console.error('Error while creating the invitation:', error);
      throw error;
  }
};

module.exports = {
  sendEmail,
};

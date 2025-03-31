import { Injectable } from '@angular/core';
import sodium from 'libsodium-wrappers-sumo';
import {
  PerpetratorData,
  CoefficientsDataPerpetrator,
  SharedSecretData,
  Record,
  Ccipher,
  DBTuple,
  RetrieveReport,
  Report,
  SharedData,
} from '../../interfaces/shared';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class CryptoService {
  private pubKey_server: Uint8Array | null = null;
  private secKey_lawyer: Uint8Array | null = null;
  private emailUser: string = '';
  private encoder = new TextEncoder();

  //private piValueToMatchRecord: string[] = [];

  keyLength = 32;

  constructor() {}

  async setPublicKeyServer(pubKey: string) {
    await sodium.ready;
    this.pubKey_server = sodium.from_hex(pubKey);
  }

  encUserDataRegistration(input: string, keyToEnc: Uint8Array) {
    let randomNonce = sodium.randombytes_buf(24);
    let userInput = this.encoder.encode(input);

    const cipherKey = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      userInput,
      null,
      null,
      randomNonce,
      keyToEnc
    );

    const eKey = new Uint8Array(randomNonce.length + cipherKey.length);
    eKey.set(randomNonce, 0); // Copia il nonce nella prima parte
    eKey.set(cipherKey, randomNonce.length); // Copia il record cifrato nella seconda parte

    return eKey;
  }

  decUserDataRegistration(encryptedData: Uint8Array, keyToDec: Uint8Array) {
    // Estrai il nonce (primi 24 byte)
    const nonce = encryptedData.slice(0, 24);

    // Estrai il testo cifrato (dalla posizione 24 in avanti)
    const cipherText = encryptedData.slice(24);

    // Decrypt il testo cifrato usando la chiave e il nonce
    try {
      const decryptedData = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        cipherText,
        null,
        nonce,
        keyToDec
      );

      return sodium.to_string(decryptedData);
    } catch (error) {
      throw error;
    }
  }

  //cifro i dati inseriti utili nella fase di login con la chiave pubblica del server
  //affinchè risultino cifrati e più sicuri nel passaggio al server delle chiavi
  encryptData(input: string) {
    if (!this.pubKey_server) {
      console.log('Server public key not set.');
      return null;
    }

    const messageUint8Array = sodium.from_string(input);
    const ciphertext = sodium.crypto_box_seal(
      messageUint8Array,
      this.pubKey_server
    );
    return ciphertext;
  }

  //l'hash è calcolato esclusivamente per l'email
  generateHashForEmail(email: string): Uint8Array {
    //const encoder = new TextEncoder();
    const userInput = this.encoder.encode(email);
    const hash = sodium.crypto_hash_sha256(userInput);

    return hash;
  }

  //genero salt da fornire in input alla funzione di derivazione della chiave
  generateSalt(input: string): Uint8Array {
    //const encoder = new TextEncoder();
    const userInput = this.encoder.encode(input);
    const hash = sodium.crypto_hash_sha256(userInput);

    return hash.slice(0, 16);
  }

  deriveKey(password: string, salt: Uint8Array): Uint8Array {
    const key = sodium.crypto_pwhash(
      this.keyLength, // Lunghezza della chiave derivata
      password, // Password
      salt, // Salt
      sodium.crypto_pwhash_OPSLIMIT_MIN, // Limite di operazioni    --->> una volta finito mtti--> sodium.crypto_pwhash_OPSLIMIT_SENSITIVE
      sodium.crypto_pwhash_MEMLIMIT_MIN, // Limite di memoria --->> una volta finito mtti-->  sodium.crypto_pwhash_MEMLIMIT_SENSITIVE
      sodium.crypto_pwhash_ALG_ARGON2ID13 // Algoritmo di derivazione (sodium.crypto_pwhash_ALG_ARGON2ID13)
    );

    return key;
  }

  //unisce la generazione del salt e della password in maniera tale da restituire la chiave derivata
  resKeyToSave(password: string, email: string) {
    let salt = this.generateSalt(password + email);
    let derkey = this.deriveKey(password, salt);

    return derkey;
  }

  generateLawyerHashEmail(email: string): Uint8Array {
    const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);

    const hash = sodium.crypto_pwhash(
      this.keyLength, // Lunghezza hash
      email, // Input (l'email)
      salt, // Salt casuale
      sodium.crypto_pwhash_OPSLIMIT_MODERATE, // Limite operazioni (difficoltà calcolo)
      sodium.crypto_pwhash_MEMLIMIT_MODERATE, // Limite memoria
      sodium.crypto_pwhash_ALG_ARGON2ID13 // Algoritmo usato
    );

    const combined = new Uint8Array(salt.length + hash.length);
    combined.set(salt, 0);
    combined.set(hash, salt.length);

    return combined;
  }

  /*****Per il calcolo della OPRF */

  //ricevo i dati su cui eseguire la oprf (array di valori)
  hashDataPerpetrator(dataToOPRF: PerpetratorData) {
    const formValues = { ...dataToOPRF };
    let postData: PerpetratorData;

    if (dataToOPRF.email) {
      const hashEmail = this.resHashPerpetratorData(dataToOPRF.email);
      if (hashEmail) {
        formValues.email = sodium.to_hex(hashEmail);
      } else formValues.email = '';
    }

    if (dataToOPRF.telephoneNumber) {
      const hashTelephoneNumber = this.resHashPerpetratorData(
        dataToOPRF.telephoneNumber
      );
      if (hashTelephoneNumber) {
        formValues.telephoneNumber = sodium.to_hex(hashTelephoneNumber);
      } else formValues.telephoneNumber = '';
    }

    if (dataToOPRF.socialMediaUrl) {
      const hashSocialMediaUrl = this.resHashPerpetratorData(
        dataToOPRF.socialMediaUrl
      );
      if (hashSocialMediaUrl) {
        formValues.socialMediaUrl = sodium.to_hex(hashSocialMediaUrl);
      } else formValues.socialMediaUrl = '';
    }

    return (postData = { ...formValues } as PerpetratorData);
  }

  //Restituisce chiave+salt
  resHashPerpetratorData(perpetrator_data: string) {
    let salt = this.generateSalt(perpetrator_data);
    let derkey = this.deriveKey(perpetrator_data, salt);

    return derkey;
  }

  /******************************/

  /******* Per il calcolo dei tre valori k,a e i pi_value dato il valore della OPRF */

  //riceve i valori pseudorandomici resituiti dal calcolo dell'OPRF con il server delle chiavi (sempre dei tre valori)
  generatePerpetratorsKeys(pseudorandomPerpetratorValue: string[]) {
    let K_key: string = '';
    let A_key: string = '';
    let dataPerpetrator: CoefficientsDataPerpetrator[] = [];

    if (pseudorandomPerpetratorValue[0]) {
      let result = this.deriveThreeKeys(pseudorandomPerpetratorValue[0]);
      dataPerpetrator[0] = {
        K_key: sodium.to_hex(result[0]),
        A_key: sodium.to_hex(result[1]),
        piValuesToMatchRecord: sodium.to_hex(result[2]),
      };
    } else {
      dataPerpetrator[0] = {
        K_key: '',
        A_key: '',
        piValuesToMatchRecord: '',
      };
    }

    //socialMediaURL
    if (pseudorandomPerpetratorValue[1]) {
      let result = this.deriveThreeKeys(pseudorandomPerpetratorValue[1]);
      dataPerpetrator[1] = {
        K_key: sodium.to_hex(result[0]),
        A_key: sodium.to_hex(result[1]),
        piValuesToMatchRecord: sodium.to_hex(result[2]),
      };
    } else {
      dataPerpetrator[1] = {
        K_key: '',
        A_key: '',
        piValuesToMatchRecord: '',
      };
    }

    //telephoneNumber
    if (pseudorandomPerpetratorValue[2]) {
      let result = this.deriveThreeKeys(pseudorandomPerpetratorValue[2]);
      dataPerpetrator[2] = {
        K_key: sodium.to_hex(result[0]),
        A_key: sodium.to_hex(result[1]),
        piValuesToMatchRecord: sodium.to_hex(result[2]),
      };
    } else {
      dataPerpetrator[2] = {
        K_key: '',
        A_key: '',
        piValuesToMatchRecord: '',
      };
    }

    return dataPerpetrator;
  }

  deriveThreeKeys(pseudorandomValue: string) {
    let context = pseudorandomValue.slice(0, 8);
    let keys: Uint8Array[] = [];

    // chiave k per segreto condiviso
    keys[0] = sodium.crypto_kdf_derive_from_key(
      this.keyLength,
      1,
      context,
      sodium.from_hex(pseudorandomValue)
    );

    //chiave a usata per segreto condiviso
    keys[1] = sodium.crypto_kdf_derive_from_key(
      this.keyLength,
      2,
      context,
      sodium.from_hex(pseudorandomValue)
    );

    // chiave pi_value per il matching
    keys[2] = this.derivePiValue(pseudorandomValue);

    return keys;
  }

  derivePiValue(pseudorandomValue: string) {
    let context = pseudorandomValue.slice(0, 8);

    return sodium.crypto_kdf_derive_from_key(
      this.keyLength,
      3,
      context,
      sodium.from_hex(pseudorandomValue)
    );
  }
  /*************************************************/

  /******* Segreto condiviso *************/

  //riceve i coefficienti del campo scelti per creare un segreto condiviso recupera la mail dell'utente in quanto servirà
  //proprio nella generazione
  generateShamirSecretSharing(
    dataPerpetrator: CoefficientsDataPerpetrator[],
    userEmail: string
  ) {
    let shares: SharedSecretData[] = [];

    if (userEmail) {
      const userEmailByte = sodium.from_string(userEmail);
      let user_int = this.bytesTobigInt(userEmailByte);

      for (let i = 0; i < dataPerpetrator.length; i++) {
        shares[i] = { user: 0n, share: 0n };

        if (
          dataPerpetrator[i].K_key !== '' &&
          dataPerpetrator[i].A_key !== ''
        ) {
          let k_int = this.bytesTobigInt(
            sodium.from_hex(dataPerpetrator[i].K_key)
          );
          let A_int = this.bytesTobigInt(
            sodium.from_hex(dataPerpetrator[i].A_key)
          );

          let y: bigint = A_int * user_int + k_int;

          console.log('byte key', sodium.from_hex(dataPerpetrator[i].K_key));
          console.log('int y-->', k_int);

          shares[i].user = user_int;
          shares[i].share = y;
        } else {
          shares[i].user = 0n;
          shares[i].share = 0n;
        }
      }
      return shares;
    }

    // Restituisci null se non è stato possibile ottenere una email valida o se il token è assente/errato
    return null;
  }

  //serve per la conversione di valori in array di byte in un valore numerico
  bytesTobigInt(bytes: Uint8Array): bigint {
    let result: bigint = 0n; // Inizializzo il risultato come bigint
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) | BigInt(bytes[i]); // Shift e combinazione con il byte corrente
    }
    return result;
  }

  /*************************************/

  //generazione chiave simmetrica K' che verrà usata per cifrare il Record da inviare al DB
  generateKeyToEncRecord() {
    return sodium.randombytes_buf(32);
  }

  /************ Cifratura del Record (AEAD) *********/

  //usando un array di pi_value
  createEncRecord(
    record: Record,
    keyToEncRecord: Uint8Array,
    additionalData: string[]
  ) {
    //come additional data usiamo la mail dell'utente

    let randomNonce = sodium.randombytes_buf(24); //crypto_aead_xchacha20poly1305_ietf_NONCEBYTES

    // Serializzazione del record in una stringa JSON
    const recordJson = JSON.stringify(record);
    const recordBytes = sodium.from_string(recordJson);

    const piValueBytes = this.serialisationPiValue(additionalData);

    let encRecord = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      recordBytes,
      piValueBytes,
      null,
      randomNonce,
      keyToEncRecord
    );

    const eRecord = new Uint8Array(randomNonce.length + encRecord.length);
    eRecord.set(randomNonce, 0); // Copia il nonce nella prima parte
    eRecord.set(encRecord, randomNonce.length); // Copia il record cifrato nella seconda parte

    return eRecord;
  }

  //I pi_valure essendo un'array di valori devono essere serializzati in un JSON
  serialisationPiValue(perpetratorsPiValue: string[]) {
    const piValueJson = JSON.stringify(perpetratorsPiValue);
    const piValueBytes = sodium.from_string(piValueJson);

    return piValueBytes;
  }

  //Questa funzione viene usata per cifrare la chiave K' con la chiave Ku derivata dalla passphrase
  //che viene restituta all'utente  (questa è se si usa un array di pi_value)
  enckey(keyToEnc: Uint8Array, encKey: Uint8Array, additional_data: string[]) {
    let randomNonce = sodium.randombytes_buf(24);

    const piValueBytes = this.serialisationPiValue(additional_data);

    const cipherKey = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      keyToEnc,
      piValueBytes,
      null,
      randomNonce,
      encKey
    );

    const eKey = new Uint8Array(randomNonce.length + cipherKey.length);
    eKey.set(randomNonce, 0); // Copia il nonce nella prima parte
    eKey.set(cipherKey, randomNonce.length); // Copia il record cifrato nella seconda parte

    return eKey;
  }

  //Questa funzione viene usata per cifrare la chiave K' con le chiavi k che sono tante
  //quante gli identificativi inseriti dell'aggressore
  enckeys(
    keyToEnc: Uint8Array,
    dataPerpetrators: CoefficientsDataPerpetrator[],
    additional_data: string[]
  ) {
    const piValueBytes = this.serialisationPiValue(additional_data);
    let encKeysArray: Uint8Array[] = [];

    for (let i = 0; i < dataPerpetrators.length; i++) {
      if (dataPerpetrators[i].K_key != '') {
        let randomNonce = sodium.randombytes_buf(24);

        const cipherKey = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
          keyToEnc,
          piValueBytes,
          null,
          randomNonce,
          sodium.from_hex(dataPerpetrators[i].K_key)
        );

        const eKey = new Uint8Array(randomNonce.length + cipherKey.length);
        eKey.set(randomNonce, 0); // Copia il nonce nella prima parte
        eKey.set(cipherKey, randomNonce.length); // Copia il record cifrato nella seconda parte

        // Aggiungi l'elemento all'array
        encKeysArray.push(eKey);
      } else {
        encKeysArray.push(new Uint8Array(0));
      }
    }

    return encKeysArray;
  }

  //creazione passphrase che l'utente userà per ricreare la chiave KU
  generatepassphraseUserKey() {
    const randomBytes = sodium.randombytes_buf(32);
    const digest = sodium.crypto_generichash(12, randomBytes);
    const compressedDigest = sodium.to_base64(
      digest,
      sodium.base64_variants.URLSAFE
    );

    return compressedDigest;
  }

  // creazione chiave KU con la passphrase che viene restituita al cliente
  generateUserKey(passphrase: Uint8Array) {
    const salt = this.generateSalt(sodium.to_string(passphrase));

    const expandedKey = sodium.crypto_pwhash(
      this.keyLength, // Lunghezza della chiave derivata
      passphrase, // Passphrase
      salt, // Salt
      sodium.crypto_pwhash_OPSLIMIT_MIN, // Limite di operazioni    --->> una volta finito mtti--> sodium.crypto_pwhash_OPSLIMIT_SENSITIVE
      sodium.crypto_pwhash_MEMLIMIT_MIN, // Limite di memoria --->> una volta finito mtti-->  sodium.crypto_pwhash_MEMLIMIT_SENSITIVE
      sodium.crypto_pwhash_ALG_ARGON2ID13 // Algoritmo di derivazione (sodium.crypto_pwhash_ALG_ARGON2ID13)
    );

    return expandedKey;
  }

  /**************** Gestione del cifrato Contentente:***********************
   * - i segreti condiviso per il calcolo della chiave K, calcolati su ciascun valore del perpetrator inserito dall'utente;
   *  - i cifrati della chiave K' con la chiave K */

  //cifratura del cifrato C con la chiave pubblica dell'avvocato
  encryptCcipher(
    sharedData: SharedSecretData[],
    cipherKeyWithK: Uint8Array[],
    lawyer_key: string
  ) {
    if (!lawyer_key) {
      console.log('Chiave pubblica non impostata.');
      return null;
    }

    const cCipher = this.initCcipher(sharedData, cipherKeyWithK);
    const lawyerKeyToUse = sodium.from_hex(lawyer_key);

    // Serializzazione di cCipher in una stringa JSON
    const cCipherJson = this.serializeWithBigInt(cCipher);
    const cCipherBytes = sodium.from_string(cCipherJson);

    const ciphertext = sodium.crypto_box_seal(cCipherBytes, lawyerKeyToUse);
    return ciphertext;
  }

  //serve per serializzare il dato con tipologia bigInt
  serializeWithBigInt(obj: object): string {
    return JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  }

  //Crea l'oggetto da cifrare con la chiave pubblica dell'avvocato
  initCcipher(sharedData: SharedSecretData[], cipherKeyWithK: Uint8Array[]) {
    let cipherWithSharedDataAndKkeys: Ccipher[] = [];

    for (let i = 0; i < sharedData.length; i++) {
      cipherWithSharedDataAndKkeys[i] = {
        sharedData: { share: 0n, user: 0n },
        CipherKeyWithK: '',
      };

      if (
        sharedData[i].share != 0n &&
        sharedData[i].user != 0n &&
        cipherKeyWithK[i].length !== 0
      ) {
        cipherWithSharedDataAndKkeys[i].sharedData.share = sharedData[i].share;
        cipherWithSharedDataAndKkeys[i].sharedData.user = sharedData[i].user;
        cipherWithSharedDataAndKkeys[i].CipherKeyWithK = sodium.to_hex(
          cipherKeyWithK[i]
        );
      } else {
        cipherWithSharedDataAndKkeys[i].sharedData.share = 0n;
        cipherWithSharedDataAndKkeys[i].sharedData.user = 0n;
        cipherWithSharedDataAndKkeys[i].CipherKeyWithK = '';
      }
    }

    return cipherWithSharedDataAndKkeys;
  }

  /*********************************************************/

  /*************Creazione della tupla da salvare nel DB **************/

  //crea la tupla per il db se si ha un array di pi_value
  createTupleForDB(
    piValuePerpetrator: string[],
    cCipher: string,
    cipherKeyWithKU: string,
    eRecord: string,
    publicKeyLawyer: string
  ) {
    let dbTuple: DBTuple = {
      piValuePerpetrator: '',
      cCipher: '',
      cipherKeyWithKU: '',
      eRecord: '',
      publicKeyLawyer: '',
    };

    const serializedArray: string = JSON.stringify(piValuePerpetrator);

    dbTuple.piValuePerpetrator = serializedArray;
    dbTuple.cCipher = cCipher;
    dbTuple.cipherKeyWithKU = cipherKeyWithKU;
    dbTuple.eRecord = eRecord;
    dbTuple.publicKeyLawyer = publicKeyLawyer;

    return dbTuple;
  }

  /*************************************/

  /************** Generazione della passphrase da consegnare all'utente ******************/
  formatPassPhrase(input: string): string {
    const formatted = input.match(/.{1,4}/g)?.join(' - ');
    if (!formatted) {
      throw new Error('Errore nella formattazione della stringa');
    }
    return formatted;
  }
  /************************************************/

  /******Creazione del Json, che contiene le infromazioni da dar al db per recuperare un report già inserito */

  //nel caso in cui si tratta di un array di pi_value

  createJsonToRetrieveRecord(piValuePerpetrator: string[], userKey: string) {
    let retrieveRecord: RetrieveReport = {
      piValuePerpetrator: '',
      userKey: '',
    };

    const serializedArray: string = JSON.stringify(piValuePerpetrator);
    retrieveRecord.piValuePerpetrator = serializedArray;
    retrieveRecord.userKey = userKey;

    return retrieveRecord;
  }

  decrypt(text: string, key: Uint8Array, piValuePerpetrator: Uint8Array) {
    try {
      //converto il cifrato salvato in esadecimale in array di byte
      const cipherInByte = sodium.from_hex(text);

      //recupero il nonce dal cifrato
      const recoveredNonce = cipherInByte.subarray(0, 24);

      //recupero il cifrato della chiave
      const cipheredkey = cipherInByte.subarray(24);

      let plaintext = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
        null,
        cipheredkey, // cifrato della chiave k'
        piValuePerpetrator, //additional data in byte
        recoveredNonce,
        key
      );

      return plaintext;
    } catch (error) {
      console.error('Decryption error', error);
      return null; // Restituisce null in caso di errore
    }
  }

  //utilizzato dal lawyer per decifrare i report che risultano essere matchati
  async decryptCcipher(report: Report, lawyerPubKey_touse: Uint8Array) {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });

    if (!lawyerPubKey_touse) {
      console.log('Chiave pubblica non recuperata.');
      return null;
    }

    if (!this.secKey_lawyer) {
      this.secKey_lawyer = await this.promptForSecretKey();
      if (!this.secKey_lawyer) {
        return null;
      }
    }

    let CipherCArrayByte = sodium.from_hex(report.CipherC);

    const plainText = sodium.crypto_box_seal_open(
      CipherCArrayByte,
      lawyerPubKey_touse,
      this.secKey_lawyer
    );
    console.log("plaitext", plainText)
    return plainText;
  }

  async promptForSecretKey(): Promise<Uint8Array | null> {
    const { value: file } = await Swal.fire({
      title: 'Select SecretKey',
      input: 'file',
      inputAttributes: {
        'aria-label': 'Upload the file with secret Key',
      },
    });

    if (!file) {
      return null; // Caso in cui nessun file viene selezionato
    }

    // Controllo dimensione (max 64 byte)
    if (file.size > 100) {
      alert('The file is not of the expected size');
      return null;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const result = e.target?.result; // Contenuto del file

        if (typeof result !== 'string') {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Unable to read the file content.',
          });
          resolve(null);
          return;
        }

        const hexString = result.replace(/\s+/g, '').trim(); // Rimuove spazi e newline
        const hexRegex = /^[0-9a-fA-F]{1,100}$/;

        if (hexRegex.test(hexString)) {
          Swal.fire({
            icon: 'success',
            title: 'Key successfully inserted',
          });
          console.log(sodium.from_hex(hexString))
          resolve(sodium.from_hex(hexString)); // Converte la chiave esadecimale in un Uint8Array
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'The file does not contain a valid 64-byte public key.',
          });
          resolve(null);
        }
      };

      reader.onerror = () => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error reading the file.',
        });
        reject(new Error('Error reading the file.'));
      };

      reader.readAsText(file);
    });
  }

  //utilizzato dal lawyer per ricreare il segreto condiviso per recuperare la chiave K per decifrare i report

  SSSReconstruction(report1: any, report2: any) {
    let share1: SharedData = {
      user: 0n,
      share: 0n,
    };

    let share2: SharedData = {
      user: 0n,
      share: 0n,
    };

    let sharedData = report1.sharedData;
    let sharedData2 = report2.sharedData;

    share1.share = BigInt(sharedData.share);
    share1.user = BigInt(sharedData.user);

    share2.share = BigInt(sharedData2.share);
    share2.user = BigInt(sharedData2.user);

    // Calcolo del coefficiente angolare della retta
    let a = (share2.share - share1.share) / (share2.user - share1.user);

    // Calcolo del segreto (k)
    let keyK = share1.share - a * share1.user;

    return this.bigIntToBytes(keyK);
  }

  bigIntToBytes(bigInt: bigint): Uint8Array {
    const byteArray: number[] = [];

    // Estrae i byte da BigInt
    while (bigInt > 0n) {
      // Prendi gli ultimi 8 bit (1 byte) e convertili in un numero
      byteArray.unshift(Number(bigInt & 0xffn)); // Usa `0xffn` per BigInt
      // Sposta BigInt di 8 bit verso destra (dividi per 256)
      bigInt >>= 8n;
    }

    // Se BigInt è 0n, bisogna restituire almeno un byte (per rappresentare 0)
    if (byteArray.length === 0) {
      byteArray.push(0);
    }

    return new Uint8Array(byteArray);
  }

  decEmail(encEmail: string, passPhrase: string) {
    try {
      const userKeyByPassPhraseRegistration = this.generateUserKey(
        sodium.from_string(passPhrase)
      );

      return this.decUserDataRegistration(
        sodium.from_hex(encEmail),
        userKeyByPassPhraseRegistration
      );
    } catch (error) {
      throw error;
    }
  }
}

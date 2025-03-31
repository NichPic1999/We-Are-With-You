const sodium = require('sodium-native');

// Creare un buffer per la chiave, nonce e i dati da crittografare
const key = Buffer.alloc(sodium.crypto_secretbox_KEYBYTES);
const nonce = Buffer.alloc(sodium.crypto_secretbox_NONCEBYTES);
const message = Buffer.from('Hello, world!');
const ciphertext = Buffer.alloc(message.length + sodium.crypto_secretbox_MACBYTES);

// Generare una chiave casuale e un nonce casuale
sodium.randombytes_buf(key);
sodium.randombytes_buf(nonce);

// Crittografare il messaggio
sodium.crypto_secretbox_easy(ciphertext, message, nonce, key);

console.log('Messaggio crittografato:', ciphertext.toString('hex'));

// Decifrare il messaggio
const decrypted = Buffer.alloc(ciphertext.length - sodium.crypto_secretbox_MACBYTES);
if (sodium.crypto_secretbox_open_easy(decrypted, ciphertext, nonce, key)) {
  console.log('Messaggio decrittato:', decrypted.toString());
} else {
  console.log('Decrittazione fallita');
}
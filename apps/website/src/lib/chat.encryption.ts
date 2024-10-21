import { SignedPreKeyRecord } from '@signalapp/libsignal-client';
import _sodium from 'libsodium-wrappers';
export const generateKeys = async () => {
    try {
        await _sodium.ready;
        const sodium = _sodium;

        // generate Identity Key Pairs
        const identityKeyPair = sodium.crypto_box_keypair();
        const privateIdentityKey = identityKeyPair.privateKey;
        const publicIdentityKey = identityKeyPair.publicKey;

        // generate signed pre-key pairs
        const newKeyPair = sodium.crypto_box_keypair();
        const signedPreKeyId = Math.floor(Math.random() * 10000);
        const signedPreKeyPair = SignedPreKeyRecord.new(
            signedPreKeyId,
            Date.now(),
            newKeyPair.publicKey,
            newKeyPair.privateKey,
            Buffer.alloc(0)
        );

    } catch (error) {
        console.error(`Error while generating keys: `, error);
    };
};

// const generateKeys = async (registrationId: number, deviceId: number) => {
//     try {
//       // generating a long-term Identity Key Pair
//       const identityKeyPair = IdentityKeyPair.generate();
//       const publicIdentityKey = identityKeyPair.publicKey;
//       const privateIdentityKey = identityKeyPair.privateKey;
  
//       // generating a medium-term and used for session management, signed by Identity Key
//       const signedPreKeyId = Math.floor(Math.random() * 10000);
//       const newKeyPair = await window.crypto.subtle.generateKey(
//         "Ed25519",
//         true,
//         ["encrypt", "decrypt"]
//       );
//       const signedPreKeyPair = SignedPreKeyRecord.new(
//         signedPreKeyId,
//         Date.now(),
//         newKeyPair.
//         PrivateKey,
//         Buffer.alloc(0)
//       );
//       const signedPreKeyPublicKey = signedPreKeyPair.getPublicKey();
//       const signedPreKeySecretKey = signedPreKeyPair.getSecretKey();
//       const signedPreKeySignature = privateIdentityKey.sign(signedPreKeyPublicKey.serialize());
  
//       const signedPreKeyWithSignature = SignedPreKeyRecord.new(
//         signedPreKeyId,
//         Date.now(),
//         signedPreKeyPublicKey,
//         signedPreKeyPair.privateKey(),
//         signedPreKeySignature
//       );
  
//       // generating an array of One-Time PreKeys
//       const numberOfPreKeys = 100;
//       const preKeys = [];
//       for(let i=0; i<numberOfPreKeys; i++){
//         const preKeyId = Math.floor(Math.random() * 10000);
//         const preKeyPair = PreKeyRecord.new(preKeyId, publicIdentityKey, privateIdentityKey);
//         preKeys.push(preKeyPair);
//       };
  
//       const preKeyBundle = PreKeyBundle.new(
//         registrationId,
//         deviceId,
//         preKeys[0].id(),
//         preKeys[0].publicKey(),
//         signedPreKeyId,
//         signedPreKeyPublicKey,
//         signedPreKeySignature,
//         publicIdentityKey
//       );
  
//       console.log('pre key bundle: ', preKeyBundle);
//     } catch (error) {
//       console.error(`Error while generating keys: `, error);
//     };
//   };
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { pipeline } = require('stream');
const { promisify } = require('util');


const getCipherKey = require('./getCipherKey');

function decrypt({ file, password, compressed }) {
  // First, get the initialization vector from the file.
  const readInitVect = fs.createReadStream(file, { end: 15 });

  let initVect;
  readInitVect.on('data', (chunk) => {
    initVect = chunk;
  });

  // Once we’ve got the initialization vector, we can decrypt the file.
  readInitVect.on('close', async () => {
    const cipherKey = getCipherKey(password);
    const readStream = fs.createReadStream(file, { start: 16 });
    const decipher = crypto.createDecipheriv('aes256', cipherKey, initVect);
    const unzip = zlib.createGunzip();
    const newFile = file + '.decrypted';
    const writeStream = fs.createWriteStream(newFile);
    
    const pipelineAsync = promisify(pipeline);
    await pipelineAsync(
      readStream,
      decipher,
      //...(compressed ? [unzip] : []),
      writeStream,
    );
      console.log(`file decrypted on ${newFile}`);
    });
}

const [ file, password, compressed ] = process.argv.slice(2);

decrypt({file, password, compressed});
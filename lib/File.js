'use strict';

const fs = require('fs');
const { readFile } = require('node:fs/promises');
const { readStreamLines } = require('./Stream');

function writeObjectToFile(obj, filePath) {
  const data = JSON.stringify(obj, null, 2);
  fs.writeFileSync(filePath, data);
}
module.exports.writeObjectToFile = writeObjectToFile;

function writeStringToFile(str, filePath) {
  fs.writeFileSync(filePath, str);
}
module.exports.writeStringToFile = writeStringToFile;

function readObjectFromFile(filePath) {
  return new Promise(async (resolve, reject) => {
    const contents = await readFile(filePath, { encoding: 'utf8' });
    resolve(JSON.parse(contents));
  });
}
module.exports.readObjectFromFile = readObjectFromFile;

function readFileLines(filename) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(filename);

    readStream.on('error', function(err) {
      process.stderr.write(`${filename}: ${err}\n`);
      reject(err);
    });

    readStream.on('ready', function(err) {
      resolve(readStreamLines(readStream, filename));
    });
  });
}
module.exports.readFileLines = readFileLines;

function getFileStat(filename) {
  return new Promise((resolve, reject) => {
    fs.stat(filename, function(err, stats) {
      if (err)
        return reject(err);
      return resolve(stats);
    });
  });
}
module.exports.getFileStat = getFileStat;

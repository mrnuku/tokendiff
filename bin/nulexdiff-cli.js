#!/usr/bin/env node
'use strict';

/*[
  'D:\\things\\nodejs\\node.exe',
  'C:\\Users\\mrnuku\\AppData\\Roaming\\npm\\node_modules\\nulexdiff\\bin\\nulexdiff-cli.js',
  'src/Layers/xrRenderDX10/3DFluid/dx103DFluidRenderer.h',
  'C:\\msys64\\tmp/git-blob-a14192/dx103DFluidRenderer.h',
  'f3849fa387075fe10d1edfc1481b9bc5be2aa25d',
  '100644',
  'src/Layers/xrRenderDX10/3DFluid/dx103DFluidRenderer.h',
  '0000000000000000000000000000000000000000',
  '100644'
]*/

const fs = require('fs');
const readline = require('readline');
const { nuLexer } = require('../lib/Lexer');
const _ = require('lodash');
const { patienceDiff, patienceDiffPlus } = require('../lib/PatienceDiff');

if (process.argv.length < 4) {
  console.log('Usage: nulexdiff FILENAME_A FILENAME_B');
  process.exit(1);
}

/*fs.readFile(process.argv[2], 'utf8', function(err1, data1) {
  if (err1) {
    process.stderr.write(`error reading a file: ${process.argv[2]}: ${err1}\n`);
  }
  fs.readFile(process.argv[3], 'utf8', function(err2, data2) {
    if (err2) {
      process.stderr.write(`error reading b file: ${process.argv[3]}: ${err2}\n`);
    }
  });
});*/

function compareTokens(tokensA, tokensB, linesA, linesB, outputStream) {
  return new Promise(async (resolve, reject) => {
    if(_.isEqual(tokensA, tokensB)) {
      return;
    }
    const diff1 = await patienceDiff(tokensA, tokensB, accessed => accessed.toString(), (a, b) => a.equals(b));
    const diff2 = await patienceDiffPlus(tokensA, tokensB, accessed => accessed.toString(), (a, b) => a.equals(b));
    outputStream.write(`diff ${process.argv[2]}: ${tokensA.length}/${tokensB.length}\n`);
  });
}

function openParseInputFiles(outputStream) {
  return new Promise((resolve, reject) => {
    const readStreamA = fs.createReadStream(process.argv[2]);
    const readStreamB = fs.createReadStream(process.argv[3]);

    readStreamA.on('error', function(err) {
      process.stderr.write(`ERROR streaming file 'a': ${err}\n`);
      process.exit(1);
    });

    readStreamB.on('error', function(err) {
      process.stderr.write(`ERROR streaming file 'b': ${err}\n`);
      process.exit(1);
    });

    const rlA = readline.createInterface({
      input: readStreamA,
      output: outputStream,
      terminal: false
    });

    const rlB = readline.createInterface({
      input: readStreamB,
      output: outputStream,
      terminal: false
    });

    const linesA = [];
    const linesB = [];

    rlA.on('line', function(line) {
      linesA.push(line);
    });

    rlB.on('line', function(line) {
      linesB.push(line);
    });

    var closedA = false;
    var closedB = false;
    var tokensA = [];
    var tokensB = [];

    rlA.on('close', async () => {
      closedA = true;
      tokensA = new nuLexer(linesA).Parse();
      if (closedA && closedB) {
        // process.stderr.write(`${process.argv[2]}: ${tokensA.length}/${tokensB.length}\n`);
        resolve([tokensA, tokensB, linesA, linesB, outputStream]);
      }
    });

    rlB.on('close', async () => {
      closedB = true;
      tokensB = new nuLexer(linesB).Parse();
      if (closedA && closedB) {
        // process.stderr.write(`${process.argv[2]}: ${tokensA.length}/${tokensB.length}\n`);
        resolve([tokensA, tokensB, linesA, linesB, outputStream]);
      }
    });
  });
}

return openParseInputFiles(process.stdout)
.then(([tokensA, tokensB, linesA, linesB, outputStream]) => compareTokens(tokensA, tokensB, linesA, linesB, outputStream));

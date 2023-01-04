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
const { readFile } = require('node:fs/promises');
const readline = require('readline');
const { nuLexer } = require('../lib/Lexer');
const _ = require('lodash');
const { patienceDiff, patienceDiffPlus } = require('../lib/PatienceDiff');
const { Splitter, Myers, formats, changed } = require('../lib/MyersDiff');

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

function writeObjectToFile(obj, filePath) {
  const data = JSON.stringify(obj, null, 2);
  fs.writeFileSync(filePath, data);
}

function writeStringToFile(str, filePath) {
  fs.writeFileSync(filePath, str);
}

function readObjectFromFile(filePath) {
  return new Promise(async (resolve, reject) => {
    const contents = await readFile(filePath, { encoding: 'utf8' });
    resolve(JSON.parse(contents));
  });
}

function getMyersPatchLine(diffMD, idx) {
  for (const rec of diffMD) {
    if (rec.lhs.at == idx) return rec;
  }
  return null;
}

function printMyersDiff(diffMD, tokensA, tokensB, linesA, linesB, outputStream) {
  for (var i = 0; i < tokensA.length; i++) {
    const tokenA = tokensA[i];
    const patchLine = getMyersPatchLine(diffMD, i);
    if (patchLine) {
      for (var j = patchLine.rhs.at; j < patchLine.rhs.at + patchLine.rhs.length; j++) {
        const tokenB = tokensB[j];
        outputStream.write(`${tokenB.whitespace.str}${tokenB.str}`);
      }
      i += patchLine.lhs.length > 1 ? patchLine.lhs.length - 1 : 0;
    }
    if (!patchLine || patchLine.lhs.length === 0) {
      outputStream.write(`${tokenA.whitespace.str}${tokenA.str}`);
    }
  }
}

function compareTokens(tokensA, tokensB, linesA, linesB, outputStream) {
  return new Promise(async (resolve, reject) => {
    if(_.isEqual(tokensA, tokensB)) {
      return resolve();
    }
    const diffMD = Myers.diff(tokensA, tokensB, {compare: 'chars'});
    // const diffPD = await patienceDiff(tokensA, tokensB, accessed => accessed.toString(), (a, b) => a.equals(b));
    // const diffPDP = await patienceDiffPlus(tokensA, tokensB, accessed => accessed.toString(), (a, b) => a.equals(b));
    // const patchMD = formats.GnuNormalFormat(diffMD);
    // outputStream.write(`diff ${process.argv[2]}: ${tokensA.length}/${tokensB.length}\n`);

    printMyersDiff(diffMD, tokensA, tokensB, linesA, linesB, outputStream);

    // outputStream.write(`${patchMD}\n`);
    // writeObjectToFile(diffMD, "diffMD.json");
    // writeObjectToFile(diffPD, "diffPD.json");
    // writeObjectToFile(diffPDP, "diffPDP.json");
    // writeStringToFile(patchMD, "patchMD.patch");

    // for (const rec of diffMD) { delete rec.lhs.text.whitespace; delete rec.lhs.text.token; delete rec.rhs.text.whitespace; delete rec.rhs.text.token; }
    // for (const rec of diffPD.lines) { delete rec.line.whitespace; delete rec.line.token; }
    // for (const rec of diffPDP.lines) { delete rec.line.whitespace; delete rec.line.token; }
    // const diffMDFile = await readObjectFromFile("diffMD.json");
    // const diffMDEq = _.isEqual(JSON.parse(JSON.stringify(diffMD)), diffMDFile);
    // const diffPDFile = await readObjectFromFile("diffPD.json");
    // const diffPDEq = _.isEqual(JSON.parse(JSON.stringify(diffPD)), diffPDFile);
    // const diffPDPFile = await readObjectFromFile("diffPDP.json");
    // const diffPDPEq = _.isEqual(JSON.parse(JSON.stringify(diffPDP)), diffPDPFile);
    // outputStream.write(`diffMDEq:${diffMDEq} diffPDEq:${diffPDEq} diffPDPEq:${diffPDPEq}\n`);
    return resolve();
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
      // output: outputStream,
      terminal: false
    });

    const rlB = readline.createInterface({
      input: readStreamB,
      // output: outputStream,
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
      linesA.push('');
      tokensA = new nuLexer(linesA).Parse();
      if (closedA && closedB) {
        // process.stderr.write(`${process.argv[2]}: ${tokensA.length}/${tokensB.length}\n`);
        resolve([tokensA, tokensB, linesA, linesB, outputStream]);
      }
    });

    rlB.on('close', async () => {
      closedB = true;
      linesB.push('');
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

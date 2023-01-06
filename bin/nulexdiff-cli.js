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

// diff --git a/src/Layers/xrAPI/stdafx.h b/src/Layers/xrAPI/stdafx.h
// index c3afe5b..a2a6319 100644

const fs = require('fs');
const { readFile } = require('node:fs/promises');
const readline = require('readline');
const { PassThrough } = require('node:stream');
const { nuLexer } = require('../lib/Lexer');
const _ = require('lodash');
const { patienceDiff, patienceDiffPlus } = require('../lib/PatienceDiff');
const { Splitter, Myers, formats, changed } = require('../lib/MyersDiff');

if (process.argv.length < 7) {
  process.stderr.write('Usage: nulexdiff <FILENAME_A> <FILENAME_B> <INDEX> <FILEMOD> <FILENAME>\n');
  process.exit(1);
}

if (process.argv[4].length != 40) {
  process.stderr.write('nulexdiff wrong INDEX parameter\n');
  process.exit(1);
}

if (process.argv[5].length != 6) {
  process.stderr.write('nulexdiff wrong FILEMOD parameter\n');
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
    const diffMD = Myers.diff(tokensA, tokensB, {compare: 'chars'});
    // const diffPD = await patienceDiff(tokensA, tokensB, accessed => accessed.toString(), (a, b) => a.equals(b));
    // const diffPDP = await patienceDiffPlus(tokensA, tokensB, accessed => accessed.toString(), (a, b) => a.equals(b));
    // const patchMD = formats.GnuNormalFormat(diffMD);
    // outputStream.write(`diff ${process.argv[2]}: ${tokensA.length}/${tokensB.length}\n`);

    const stream = new PassThrough();
    const rlC = readline.createInterface({
      input: stream,
      terminal: false
    });

    const linesC = [];

    rlC.on('line', function(line) {
      linesC.push(line);
    });

    rlC.on('close', async () => {
      linesC.push('');
      resolve([tokensA, tokensB, linesA, linesB, linesC, outputStream]);
    });

    printMyersDiff(diffMD, tokensA, tokensB, linesA, linesB, stream);
    stream.end();

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
    // return resolve();
  });
}

function printLines(prefix, lines, start, length, outputStream) {
  for (var i = start; i < start + length; i++) {
    outputStream.write(`${prefix}${lines[i]}\n`);
  }
}

function printStage2MyersDiff(diffMD, linesA, linesC, outputStream) {
  const mergeDistance = 10;
  const peekDistanceStart = 3;
  const peekDistanceEnd = 3;
  const hunks = [];
  for (var i = 0; i < diffMD.length; i++) {
    const baseRec = diffMD[i];
    const hunk = [baseRec];
    for (var j = i + 1; j < diffMD.length; j++) {
      const nextRec = diffMD[j];
      const prevRec = hunk[hunk.length - 1];
      if (nextRec.lhs.at - (prevRec.lhs.at + prevRec.lhs.length) <= mergeDistance) {
        hunk.push(nextRec);
        i++;
      }
    }
    hunks.push(hunk);
  }
  for (const hunk of hunks) {
    const firstLineAt = Math.max(hunk[0].lhs.at - peekDistanceStart, 0);
    const lastLinesBeginAt = hunk[hunk.length - 1].lhs.at + hunk[hunk.length - 1].lhs.length;
    const lastLinesNum = Math.min(linesA.length - lastLinesBeginAt, peekDistanceEnd);
    const numLines = (lastLinesBeginAt + lastLinesNum) - firstLineAt;
    const newFirstLineAt = Math.max(hunk[0].rhs.at - peekDistanceStart, 0);
    const deletedLines = hunk.map(e => e.lhs.length).reduce((a, b) => a + b, 0);
    const newNumLines = hunk.map(e => e.rhs.length).reduce((a, b) => a + b, numLines) - deletedLines;
    outputStream.write(`@@ -${firstLineAt + 1},${numLines} +${newFirstLineAt + 1},${newNumLines} @@\n`);
    printLines(' ', linesA, firstLineAt, peekDistanceStart, outputStream);
    for (var i = 0; i < hunk.length; i++) {
      const part = hunk[i];
      printLines('-', linesA, part.lhs.at, part.lhs.length, outputStream);
      printLines('+', linesC, part.rhs.at, part.rhs.length, outputStream);
      if (i + 1 < hunk.length) {
        const nextPart = hunk[i + 1];
        printLines(' ', linesA, part.lhs.at + part.lhs.length, nextPart.lhs.at - (part.lhs.at + part.lhs.length), outputStream);
      }
    }
    printLines(' ', linesA, lastLinesBeginAt, lastLinesNum, outputStream);
  }
}

function comparePatched(linesA, linesC, outputStream) {
  return new Promise(async (resolve, reject) => {
    const diffMD = Myers.diff(linesA, linesC, {compare: 'chars'});
    outputStream.write(`diff --git a/${process.argv[6]} b/${process.argv[6]}\n`);
    outputStream.write(`index ${process.argv[4].substring(0, 7)}..${process.argv[4].slice(-7)} ${process.argv[5]}\n`);
    outputStream.write(`--- a/${process.argv[6]}\n`);
    outputStream.write(`+++ b/${process.argv[6]}\n`);
    printStage2MyersDiff(diffMD, linesA, linesC, outputStream);
    return resolve();
  });
}

function parseInputFiles(linesA, linesB, outputStream) {
  return new Promise((resolve, reject) => {
    const lexerA = new nuLexer(linesA, process.argv[2]);
    const lexerB = new nuLexer(linesB, process.argv[3]);
    const tokensA = lexerA.Parse();
    const tokensB = lexerB.Parse();

    if (lexerA.errors.length || lexerB.errors.length) {
      return resolve(comparePatched(linesA, linesB, outputStream));
    }

    if(_.isEqual(tokensA, tokensB)) {
      process.exit(0);
      // return resolve();
    }

    const promise = compareTokens(tokensA, tokensB, linesA, linesB, outputStream)
    .then(([tokensA, tokensB, linesA, linesB, linesC, outputStream]) => comparePatched(linesA, linesC, outputStream));
    return resolve(promise);
  });
}

function processInputFiles(outputStream) {
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
      terminal: false
    });

    const rlB = readline.createInterface({
      input: readStreamB,
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

    rlA.on('close', async () => {
      closedA = true;
      linesA.push('');
      if (closedA && closedB) {
        resolve(parseInputFiles(linesA, linesB, outputStream));
      }
    });

    rlB.on('close', async () => {
      closedB = true;
      linesB.push('');
      if (closedA && closedB) {
        resolve(parseInputFiles(linesA, linesB, outputStream));
      }
    });
  });
}

return processInputFiles(process.stdout);

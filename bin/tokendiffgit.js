#!/usr/bin/env node
'use strict';

const { readFileLines } = require('../lib/File');
const { isEmptyStream } = require('../lib/Stream');
const { nuLexer } = require('../lib/Lexer');
const { applyTokenPatch } = require('../lib/Apply');
const { emitGitUnifiedPatch } = require('../lib/Emit');
const {
  initConfig,
  setupTokensComparator,
} = require('../lib/Config');

if (process.argv.length < 7) {
  process.stderr.write('Usage: tokendiffgit <FILENAME> <FILENAME_A> <INDEX_A> <FILEMOD_A> <FILENAME_B>\n');
  process.exit(1);
}

const params = {
  filename: process.argv[2],
  filenameA: process.argv[3],
  indexA: process.argv[4],
  modA: process.argv[5],
  filenameB: process.argv[6],
  // indexB: process.argv[7],
  // modB: process.argv[8],
};

if (params.indexA.length != 40) {
  process.stderr.write('tokendiffgit wrong INDEX parameter\n');
  process.exit(1);
}

if (params.modA.length != 6) {
  process.stderr.write('tokendiffgit wrong FILEMOD parameter\n');
  process.exit(1);
}

function parseInputFiles(linesA, linesB, outputStream) {
  return new Promise(async (resolve, reject) => {
    if (isEmptyStream(linesA) || isEmptyStream(linesB)) {
      if (isEmptyStream(linesA) && isEmptyStream(linesB))
        return resolve();
      return resolve(emitGitUnifiedPatch(linesA, linesB, params, outputStream));
    }

    const lexerA = new nuLexer(linesA, params.filenameA);
    const lexerB = new nuLexer(linesB, params.filenameB);
    const tokensA = lexerA.Parse();
    const tokensB = lexerB.Parse();
    setupTokensComparator(tokensA, 'left');
    setupTokensComparator(tokensB, 'right');

    if (lexerA.errors.length || lexerB.errors.length) {
      return resolve(emitGitUnifiedPatch(linesA, linesB, params, outputStream));
    }

    if (nuLexer.CompareParsed(tokensA, tokensB)) {
      return resolve();
    }

    const linesC = await applyTokenPatch(tokensA, tokensB);
    return resolve(emitGitUnifiedPatch(linesA, linesC, params, outputStream));
  });
}

function tokenDiffGitMain(outputStream) {
  return new Promise(async (resolve, reject) => {
    try {
      await initConfig(params.filename);
      const linesA = await readFileLines(params.filenameA);
      const linesB = await readFileLines(params.filenameB);
      return resolve(parseInputFiles(linesA, linesB, outputStream));
    } catch(err) {
      process.exit(1);
    }
  });
}

return tokenDiffGitMain(process.stdout);

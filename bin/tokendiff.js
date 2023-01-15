#!/usr/bin/env node
'use strict';

const { readFileLines } = require('../lib/File');
const { isEmptyStream } = require('../lib/Stream');
const { nuLexer } = require('../lib/Lexer');
const { applyTokenPatch } = require('../lib/Apply');
const { emitDiffUnifiedPatch } = require('../lib/Emit');
const {
  initConfig,
  setupTokensComparator,
} = require('../lib/Config');

if (process.argv.length < 4) {
  process.stderr.write('Usage: tokendiff <FILENAME_A> <FILENAME_B>\n');
  process.exit(1);
}

const params = {
  filenameA: process.argv[2],
  filenameB: process.argv[3],
};

function parseInputFiles(linesA, linesB, outputStream) {
  return new Promise(async (resolve, reject) => {
    if (isEmptyStream(linesA) || isEmptyStream(linesB)) {
      if (isEmptyStream(linesA) && isEmptyStream(linesB))
        return resolve();
      return resolve(emitDiffUnifiedPatch(linesA, linesB, params, outputStream));
    }

    const lexerA = new nuLexer(linesA, params.filenameA);
    const lexerB = new nuLexer(linesB, params.filenameB);
    const tokensA = lexerA.Parse();
    const tokensB = lexerB.Parse();
    setupTokensComparator(tokensA);
    setupTokensComparator(tokensB);

    if (lexerA.errors.length || lexerB.errors.length) {
      return resolve(emitDiffUnifiedPatch(linesA, linesB, params, outputStream));
    }

    if (nuLexer.CompareParsed(tokensA, tokensB)) {
      return resolve();
    }

    const linesC = await applyTokenPatch(tokensA, tokensB);
    return resolve(emitDiffUnifiedPatch(linesA, linesC, params, outputStream));
  });
}

function tokenDiffMain(outputStream) {
  return new Promise(async (resolve, reject) => {
    try {
      await initConfig();
      const linesA = await readFileLines(params.filenameA);
      const linesB = await readFileLines(params.filenameB);
      return resolve(parseInputFiles(linesA, linesB, outputStream));
    } catch(err) {
      process.exit(1);
    }
  });
}

return tokenDiffMain(process.stdout);

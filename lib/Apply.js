'use strict';

const { PassThrough } = require('node:stream');
const {
  patienceDiff,
  patienceDiffPlus,
} = require('./PatienceDiff');
const {
  Splitter,
  Myers,
  formats,
  changed,
} = require('./MyersDiff');
const { readStreamLines } = require('./Stream');
const { emitTokenDiff } = require('./Emit');

function applyTokenPatch(tokensA, tokensB) {
  return new Promise(async (resolve, reject) => {
    const diffMD = Myers.diff(tokensA, tokensB, {compare: 'tokens'});
    const stream = new PassThrough();
    emitTokenDiff(diffMD, tokensA, tokensB, stream);
    stream.end();
    resolve(readStreamLines(stream, 'patchedfile'));
  });
}
module.exports.applyTokenPatch = applyTokenPatch;

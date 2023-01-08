'use strict';

const readline = require('readline');

function readStreamLinesReadline(stream, filename) {
  return new Promise((resolve, reject) => {
    const lines = [];
    const utf8BOM = Buffer.from([208, 191, 194, 187, 209, 151]);
    const rl = readline.createInterface({
      input: stream,
      terminal: false
    });

    rl.on('line', function(line) {
      if (!lines.length) {
        const lineBuffer = Buffer.from(line);
        if (lineBuffer.length > 5 && !utf8BOM.compare(lineBuffer.slice(0, 6))) {
          line = lineBuffer.slice(6).toString();
          process.stderr.write(`${filename}: WARN stripped UTF-8 BOM\n`);
        }
      }
      lines.push(line);
    });

    rl.on('close', async () => {
      lines.push('');
      resolve(lines);
    });
  });
}
module.exports.readStreamLinesReadline = readStreamLinesReadline;

function readStreamLines(stream, filename) {
  return new Promise((resolve, reject) => {
    const lines = [];
    const utf8BOM = Buffer.from([208, 191, 194, 187, 209, 151]);
    const nlUnix = Buffer.from('\n');
    const nlMac = Buffer.from('\r');
    const nlWin = Buffer.from('\r\n');
    var inputBuffer;
    var sumChunkSize = 0;
    var newline = null;

    function guessNewlineType(last) {
      for (var i = 0; i < inputBuffer.length - (nlWin.length - 1); i++) {
        if (!inputBuffer.compare(nlWin, 0, nlWin.length, i, i + nlWin.length)) {
          // if crlf found we can be pretty sure its win format
          newline = nlWin;
          return;
        }
      }
      for (var i = 0; i < inputBuffer.length; i++) {
        if (!inputBuffer.compare(nlUnix, 0, nlUnix.length, i, i + nlUnix.length)) {
          // if lf found we can be pretty sure its unix format after we deducted win
          newline = nlUnix;
          return;
        }
      }
      for (var i = 0; i < inputBuffer.length; i++) {
        if (!inputBuffer.compare(nlMac, 0, nlMac.length, i, i + nlMac.length)) {
          // we can be sure if its a mac format if its not at the end of our current chunk or we finished the file read
          if (i < inputBuffer.length - nlMac.length || last) {
            newline = nlMac;
          }
          return;
        }
      }
    }

    function emitData(last) {
      var processed = 0;
      if (newline === null) guessNewlineType(last);
      for (var i = 0; newline !== null && i < inputBuffer.length - (newline.length - 1); i++) {
        if (!inputBuffer.compare(newline, 0, newline.length, i, i + newline.length)) {
          const str = inputBuffer.toString('utf8', processed, i);
          lines.push(str);
          processed = i + newline.length;
        }
      }
      inputBuffer = inputBuffer.slice(processed);
      if (last) {
        const str = inputBuffer.toString();
        lines.push(str);
      }
    }

    function handleUtf8BOM(chunk) {
      if (!sumChunkSize) {
        if (chunk.length > 5 && !chunk.compare(utf8BOM, 0, utf8BOM.length, 0, utf8BOM.length)) {
          process.stderr.write(`${filename}: WARN stripped UTF-8 BOM\n`);
          return chunk.slice(utf8BOM.length);
        }
      }
      return chunk;
    }

    stream.on('data', function (chunk) {
      chunk = handleUtf8BOM(chunk);
      inputBuffer = sumChunkSize ? Buffer.concat([inputBuffer, chunk]) : chunk;
      sumChunkSize += chunk.length;
      emitData(false);
    });

    stream.on('end', function () {
      emitData(true);
      resolve(lines);
    });

    stream.resume();
  });
}
module.exports.readStreamLines = readStreamLines;

'use strict';

const readline = require('readline');

function readStreamLines(stream, filename) {
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
module.exports.readStreamLines = readStreamLines;

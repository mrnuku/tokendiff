const { nuLexer } = require('lib/Lexer');
      const hunkHeaderLineSplit = hunkHeaderLine.split('@@ ');

      const mergedALines = [];
      const mergedBLines = [];

      if (hunkHeaderLineSplit.length == 3) {
        mergedALines.push(hunkHeaderLineSplit[2]);
        mergedBLines.push(hunkHeaderLineSplit[2]);
      }
          mergedBLines.push(lineContent);
          mergedALines.push(lineContent);
        } else if (line.startsWith('\\')) {
          const lineContent = line.substr(1);
        } else {
          const lineContent = line.substr(1);
          // fileData.lines.push({ lineNumber: nA, line });
          mergedALines.push(lineContent);
          mergedBLines.push(lineContent);
        }
      const mergedATokens = new nuLexer(mergedALines).Parse();
      const mergedBTokens = new nuLexer(mergedBLines).Parse();
        processGitPatch(data, fd, process.stdout.fd);
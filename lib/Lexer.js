'use strict';

/*
  NOERRORS:                   don't print any errors
  NOWARNINGS:                 don't print any warnings
  NOFATALERRORS:              errors aren't fatal
  NOSTRINGCONCAT:             multiple strings seperated by whitespaces are not concatenated
  NOSTRINGESCAPECHARS:        no escape characters inside strings
  NODOLLARPRECOMPILE:         don't use the $ sign for precompilation
  NOBASEINCLUDES:             don't include files embraced with < >
  ALLOWPATHNAMES:             allow path seperators in names
  ALLOWNUMBERNAMES:           allow names to start with a number
  ALLOWIPADDRESSES:           allow ip addresses to be parsed as numbers
  ALLOWFLOATEXCEPTIONS:       allow float exceptions like 1.#INF or 1.#IND to be parsed
  ALLOWDETECTLONGLITERALS:    allow reporting of multi character literals
  ALLOWBACKSLASHSTRINGCONCAT: allow multiple strings seperated by '\' to be concatenated
  ONLYSTRINGS:                parse as whitespace deliminated strings (quoted strings keep quotes)
  UNREFSTRINGS:               keep external quotes on strings
  UNKNOWN:                    allow emiting UNKNOWN tokens
  NOPOSITIONS:                don't add source file position into token
  NOWHITESPACEDATA:           don't add whitespace token to the parent token
  ALLOWDETECTNESTEDCOMMENT:   allow reporting of nested comments
*/

const LFL = {
  NOERRORS: 'NOERRORS',
  NOWARNINGS: 'NOWARNINGS',
  NOFATALERRORS: 'NOFATALERRORS',
  NOSTRINGCONCAT: 'NOSTRINGCONCAT',
  NOSTRINGESCAPECHARS: 'NOSTRINGESCAPECHARS',
  NODOLLARPRECOMPILE: 'NODOLLARPRECOMPILE',
  NOBASEINCLUDES: 'NOBASEINCLUDES',
  ALLOWPATHNAMES: 'ALLOWPATHNAMES',
  ALLOWNUMBERNAMES: 'ALLOWNUMBERNAMES',
  ALLOWIPADDRESSES: 'ALLOWIPADDRESSES',
  ALLOWFLOATEXCEPTIONS: 'ALLOWFLOATEXCEPTIONS',
  ALLOWDETECTLONGLITERALS: 'ALLOWMULTICHARLITERALS',
  ALLOWBACKSLASHSTRINGCONCAT: 'ALLOWBACKSLASHSTRINGCONCAT',
  ONLYSTRINGS: 'ONLYSTRINGS',
  UNREFSTRINGS: 'UNREFSTRINGS',
  UNKNOWN: 'UNKNOWN',
  NOPOSITIONS: 'NOPOSITIONS',
  NOWHITESPACEDATA: 'NOWHITESPACEDATA',
  ALLOWDETECTNESTEDCOMMENT: 'ALLOWDETECTNESTEDCOMMENT',
};

const TT = {
  NONE: 'NONE',
  STRING: 'STRING',
  LITERAL: 'LITERAL',
  NUMBER: 'NUMBER',
  NAME: 'NAME',
  PUNCTUATION: 'PUNCTUATION',
  EOF: 'EOF',
  WHITESPACE: 'WHITESPACE',
  UNKNOWN: 'UNKNOWN',
};

const TNT = {
  INTEGER: 'INTEGER',
  DECIMAL: 'DECIMAL',
  HEX: 'HEX',
  OCTAL: 'OCTAL',
  BINARY: 'BINARY',
  LONG: 'LONG',
  UNSIGNED: 'UNSIGNED',
  FLOAT: 'FLOAT',
  SINGLE_PRECISION: 'SINGLE_PRECISION',
  DOUBLE_PRECISION: 'DOUBLE_PRECISION',
  EXTENDED_PRECISION: 'EXTENDED_PRECISION',
  INFINITE: 'INFINITE',
  INDEFINITE: 'INDEFINITE',
  NAN: 'NAN',
  IPADDRESS: 'IPADDRESS',
  IPPORT: 'IPPORT',
  VALUESVALID: 'VALUESVALID',
};

const PT = {
  RSHIFT_ASSIGN: 'RSHIFT_ASSIGN',
  LSHIFT_ASSIGN: 'LSHIFT_ASSIGN',
  PARMS: 'PARMS',
  PRECOMPMERGE: 'PRECOMPMERGE',
  LOGIC_AND: 'LOGIC_AND',
  LOGIC_OR: 'LOGIC_OR',
  LOGIC_GEQ: 'LOGIC_GEQ',
  LOGIC_LEQ: 'LOGIC_LEQ',
  LOGIC_EQ: 'LOGIC_EQ',
  LOGIC_UNEQ: 'LOGIC_UNEQ',
  MUL_ASSIGN: 'MUL_ASSIGN',
  DIV_ASSIGN: 'DIV_ASSIGN',
  MOD_ASSIGN: 'MOD_ASSIGN',
  ADD_ASSIGN: 'ADD_ASSIGN',
  SUB_ASSIGN: 'SUB_ASSIGN',
  INC: 'INC',
  DEC: 'DEC',
  BIN_AND_ASSIGN: 'BIN_AND_ASSIGN',
  BIN_OR_ASSIGN: 'BIN_OR_ASSIGN',
  BIN_XOR_ASSIGN: 'BIN_XOR_ASSIGN',
  RSHIFT: 'RSHIFT',
  LSHIFT: 'LSHIFT',
  POINTERREF: 'POINTERREF',
  CPP1: 'CPP1',
  CPP2: 'CPP2',
  MUL: 'MUL',
  DIV: 'DIV',
  MOD: 'MOD',
  ADD: 'ADD',
  SUB: 'SUB',
  ASSIGN: 'ASSIGN',
  BIN_AND: 'BIN_AND',
  BIN_OR: 'BIN_OR',
  BIN_XOR: 'BIN_XOR',
  BIN_NOT: 'BIN_NOT',
  LOGIC_NOT: 'LOGIC_NOT',
  LOGIC_GREATER: 'LOGIC_GREATER',
  LOGIC_LESS: 'LOGIC_LESS',
  REF: 'REF',
  COMMA: 'COMMA',
  SEMICOLON: 'SEMICOLON',
  COLON: 'COLON',
  QUESTIONMARK: 'QUESTIONMARK',
  PARENTHESESOPEN: 'PARENTHESESOPEN',
  PARENTHESESCLOSE: 'PARENTHESESCLOSE',
  BRACEOPEN: 'BRACEOPEN',
  BRACECLOSE: 'BRACECLOSE',
  SQBRACKETOPEN: 'SQBRACKETOPEN',
  SQBRACKETCLOSE: 'SQBRACKETCLOSE',
  BACKSLASH: 'BACKSLASH',
  PRECOMP: 'PRECOMP',
  DOLLAR: 'DOLLAR',
};

const PTB = [
  [">>=", PT.RSHIFT_ASSIGN],
  ["<<=", PT.LSHIFT_ASSIGN],
  ["...", PT.PARMS],
  ["##", PT.PRECOMPMERGE],
  ["&&", PT.LOGIC_AND],
  ["||", PT.LOGIC_OR],
  [">=", PT.LOGIC_GEQ],
  ["<=", PT.LOGIC_LEQ],
  ["==", PT.LOGIC_EQ],
  ["!=", PT.LOGIC_UNEQ],
  ["*=", PT.MUL_ASSIGN],
  ["/=", PT.DIV_ASSIGN],
  ["%=", PT.MOD_ASSIGN],
  ["+=", PT.ADD_ASSIGN],
  ["-=", PT.SUB_ASSIGN],
  ["++", PT.INC],
  ["--", PT.DEC],
  ["&=", PT.BIN_AND_ASSIGN],
  ["|=", PT.BIN_OR_ASSIGN],
  ["^=", PT.BIN_XOR_ASSIGN],
  [">>", PT.RSHIFT],
  ["<<", PT.LSHIFT],
  ["->", PT.POINTERREF],
  ["::", PT.CPP1],
  [".*", PT.CPP2],
  ["*", PT.MUL],
  ["/", PT.DIV],
  ["%", PT.MOD],
  ["+", PT.ADD],
  ["-", PT.SUB],
  ["=", PT.ASSIGN],
  ["&", PT.BIN_AND],
  ["|", PT.BIN_OR],
  ["^", PT.BIN_XOR],
  ["~", PT.BIN_NOT],
  ["!", PT.LOGIC_NOT],
  [">", PT.LOGIC_GREATER],
  ["<", PT.LOGIC_LESS],
  [".", PT.REF],
  [",", PT.COMMA],
  [";", PT.SEMICOLON],
  [":", PT.COLON],
  ["?", PT.QUESTIONMARK],
  ["(", PT.PARENTHESESOPEN],
  [")", PT.PARENTHESESCLOSE],
  ["{", PT.BRACEOPEN],
  ["}", PT.BRACECLOSE],
  ["[", PT.SQBRACKETOPEN],
  ["]", PT.SQBRACKETCLOSE],
  ["\\", PT.BACKSLASH],
  ["#", PT.PRECOMP],
  ["$", PT.DOLLAR],
];

function nuToken(initPos) {
  this.str = '';
  this.type = TT.NONE;
  this.subtype = 0;
  if (initPos === true) {
    this.pos = {
      line: 0,
      column: 0,
    };
  }
}

nuToken.prototype.equals = function(b) {
  return this.str === b.str && this.type === b.type /*&& this.subtype === b.subtype*/;
}

nuToken.prototype.toString = function() {
  return `${this.str} ${this.type} ${this.subtype}`;
}

function nuLexer(sourceLines, fileName, flags, userPuncTable) {
  this.sourceLines = sourceLines.slice();
  this.source = this.sourceLines.shift();
  this.fileName = fileName === undefined ? '<no-file-name>' : fileName;
  this.line = 0;
  this.column = 0;
  this.flags = flags === undefined ? [] : flags;
  this.userPuncTable = _sortPuncTable(userPuncTable === undefined ? PTB : userPuncTable.concat(PTB));
}

nuLexer.prototype._advanceLine = function() {
  if (!this.sourceLines.length) {
    this._warning("_advanceLine: out of lines!");
    return;
  }
  this.source = this.sourceLines.shift();
  this.line++;
  this.column = 0;
}

nuLexer.prototype._advanceColumn = function(cnt = 1) {
  if (this.source.length < cnt) {
    this._warning("_advanceColumn: out of characters!");
    return;
  }
  this.source = this.source.slice(cnt);
  this.column++;
}

nuLexer.prototype._getState = function() {
  return {
    sourceLines: this.sourceLines.slice(),
    source: this.source,
    line: this.line,
    column: this.column,
  };
}

nuLexer.prototype._setState = function(state) {
  this.sourceLines = state.sourceLines;
  this.source = state.source;
  this.line = state.line;
  this.column = state.column;
}

nuLexer.prototype._error = function(text) {
  if (!this.flags.includes(LFL.NOERRORS)) process.stderr.write(`${this.fileName}:${this.line + 1} WARN ${text}\n`);
}

nuLexer.prototype._warning = function(text) {
  if (!this.flags.includes(LFL.NOWARNINGS)) process.stderr.write(`${this.fileName}:${this.line + 1} ERR ${text}\n`);
}

nuLexer.prototype.ReadWhiteSpace = function(whitespace) {
  const emitWhiteSpaceData = whitespace !== undefined && !this.flags.includes(LFL.NOWHITESPACEDATA);
  var whiteSpaceStr = "";
  while (1) {
    while(!this.source.length || this.source[0] <= ' ') { // skip white space
      if (!this.source.length) {
        if (!this.sourceLines.length) {
          if (emitWhiteSpaceData) whitespace.str = whiteSpaceStr;
          return 2;
        }
        else {
          if (emitWhiteSpaceData) whiteSpaceStr += '\n';
          this._advanceLine();
          continue;
        }
      }
      if (emitWhiteSpaceData) whiteSpaceStr += this.source[0];
      this._advanceColumn();
    }
    if (this.source[0] == '/') { // skip comments
      if (this.source[1] == '/') { // comments //
        if (!this.sourceLines.length) return 0;
        if (emitWhiteSpaceData) whiteSpaceStr += `${this.source}\n`;
        this._advanceLine();
        continue;
      } else if (this.source[1] == '*') { // comments /* */
        if (emitWhiteSpaceData) whiteSpaceStr += this.source[0];
        this._advanceColumn();
        while (1) {
          if (!this.source.length) {
            if (!this.sourceLines.length) return 0;
            if (emitWhiteSpaceData) whiteSpaceStr += '\n';
            this._advanceLine();
            continue;
          }
          const lastChar = this.source[0];
          if (emitWhiteSpaceData) whiteSpaceStr += this.source[0];
          this._advanceColumn();
          if (this.source[0] == '/') {
            if (lastChar == '*') break;
          }
          if (this.source[1] == '*' && this.flags.includes(LFL.ALLOWDETECTNESTEDCOMMENT)) {
            this._warning("nested comment");
          }
        }
        if (emitWhiteSpaceData) whiteSpaceStr += this.source[0];
        this._advanceColumn();
        if (!this.source.length) {
          if (!this.sourceLines.length) return 0;
        }
        continue;
      }
    }
    break;
  }
  if (emitWhiteSpaceData) whitespace.str = whiteSpaceStr;
  return 1;
}

nuLexer.prototype.ReadEscapeCharacter = function(ch) {
  var c, val, i;
  this._advanceColumn(); // step over the leading '\\'
  switch(this.source[0]) { // determine the escape character
    case '\\': c = '\\'; break;
    case 'n': c = '\n'; break;
    case 'r': c = '\r'; break;
    case 't': c = '\t'; break;
    case 'v': c = '\v'; break;
    case 'b': c = '\b'; break;
    case 'f': c = '\f'; break;
    case 'a': c = '\a'; break;
    case '\'': c = '\''; break;
    case '\"': c = '\"'; break;
    case '\?': c = '\?'; break;
    case 'x': {
      this._advanceColumn();
      for (i = 0, val = 0; ; i++) {
        c = this.source[i];
        if (c >= '0' && c <= '9') c = c - '0';
        else if (c >= 'A' && c <= 'Z') c = c - 'A' + 10;
        else if (c >= 'a' && c <= 'z') c = c - 'a' + 10;
        else break;
        val = (val << 4) + c;
      }
      this.source = this.source.slice(i);
      if (val > 0xFF) {
        this._warning("too large value in escape character");
        val = 0xFF;
      }
      c = val;
      break;
    }
    default: { //NOTE: decimal ASCII code, NOT octal
      if (this.source[0] < '0' || this.source[0] > '9') this._error("unknown escape char");
      for (i = 0, val = 0; ; i++) {
        c = this.source[i];
        if (c >= '0' && c <= '9') c = c - '0';
        else break;
        val = val * 10 + c;
      }
      this.source = this.source.slice(i);
      if (val > 0xFF) {
        this._warning("too large value in escape character");
        val = 0xFF;
      }
      c = val;
      break;
    }
  }
  this._advanceColumn(); // step over the escape character or the last digit of the number
  ch.ch = c; // store the escape character
  return 1; // succesfully read escape character
}

nuLexer.prototype.ReadString = function(token, quote) {
  var str = "";
  if (quote == '\"') token.type = TT.STRING;
  else token.type = TT.LITERAL;
  this._advanceColumn(); // leading quote
  while (1) {
    // if there is an escape character and escape characters are allowed
    if (this.source[0] == '\\' && this.flags.includes(LFL.STRINGESCAPECHARS)) {
      const ch = {};
      if (!this.ReadEscapeCharacter(ch)) return 0;
      str += ch.ch;
    } else if (this.source[0] == quote) { // if a trailing quote
      this._advanceColumn(); // step over the quote
      // if consecutive strings should not be concatenated
      if (this.flags.includes(LFL.NOSTRINGCONCAT) && (!this.flags.includes(LFL.ALLOWBACKSLASHSTRINGCONCAT) || (quote != '\"'))) break;
      const tmpState = this._getState();
      if (!this.ReadWhiteSpace()) { // read white space between possible two consecutive strings
        this._setState(tmpState);
        break;
      }
      if (this.flags.includes(LFL.NOSTRINGCONCAT)) {
        if (this.source[0] != '\\') {
          this._setState(tmpState);
          break;
        }
        this._advanceColumn(); // step over the '\\'
        if (!this.ReadWhiteSpace() || (this.source[0] != quote)) {
          this._error("expecting string after '\\' terminated line");
          return 0;
        }
      }
      if (this.source[0] != quote) { // if there's no leading qoute
        this._setState(tmpState);
        break;
      }
      this._advanceColumn(); // step over the new leading quote
    } else {
      if (this.source[0] == '\0') {
        this._error("missing trailing quote");
        return 0;
      }
      if (this.source[0] == '\n') {
        this._error("newline inside string");
        return 0;
      }
      str += this.source[0];
      this._advanceColumn();
    }
  }
  token.str = this.flags.includes(LFL.UNREFSTRINGS) ? str : `${quote}${str}${quote}`;
  if (token.type == TT.LITERAL) {
    if (this.flags.includes(LFL.ALLOWDETECTLONGLITERALS)) {
      if (token.str.length != 1) this._warning("literal is not one character long");
    }
    token.subtype = str[0];
  } else {
    token.subtype = token.str.length; // the sub type is the length of the string
  }
  return 1;
}

nuLexer.prototype.ReadName = function(token) {
  var c;
  var str = "";
  token.type = TT.NAME;
  do {
    str += this.source[0];
    this._advanceColumn();
    c = this.source[0];
  } while ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '_' ||
    // if treating all tokens as strings, don't parse '-' as a seperate token
    (this.flags.includes(LFL.ONLYSTRINGS) && (c == '-')) ||
    // if special path name characters are allowed
    (this.flags.includes(LFL.ALLOWPATHNAMES) && (c == '/' || c == '\\' || c == ':' || c == '.')) );
  token.str = str;
  token.subtype = token.str.length; // the sub type is the length of the name
  return 1;
}

nuLexer.prototype.ReadNumber = function(token) {
  var str = "";
  token.type = TT.NUMBER;
  token.subtype = [];
  var c = this.source[0];
  var c2 = this.source[1];
  if (c == '0' && c2 != '.') {
    if (c2 == 'x' || c2 == 'X') { // check for a hexadecimal number
      str += this.source[0];
      this._advanceColumn();
      str += this.source[0];
      this._advanceColumn();
      c = this.source[0];
      while ((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
        str += c;
        this._advanceColumn();
        c = this.source[0];
      }
      token.subtype = [TNT.HEX, TNT.INTEGER];
    } else if (c2 == 'b' || c2 == 'B') { // check for a binary number
      str += this.source[0];
      this._advanceColumn();
      str += this.source[0];
      this._advanceColumn();
      c = this.source[0];
      while (c == '0' || c == '1') {
        str += c;
        this._advanceColumn();
        c = this.source[0];
      }
      token.subtype = [TNT.BINARY, TNT.INTEGER];
    } else { // its an octal number
      str += this.source[0];
      this._advanceColumn();
      c = this.source[0];
      while (c >= '0' && c <= '7') {
        str += c;
        this._advanceColumn();
        c = this.source[0];
      }
      token.subtype = [TNT.OCTAL, TNT.INTEGER];
    }
  } else { // decimal integer or floating point number or ip address
    var dot = 0;
    while (1) {
      if (c >= '0' && c <= '9') {}
      else if (c == '.')dot++;
      else break;
      str += c;
      this._advanceColumn();
      c = this.source[0];
    }
    if (c == 'e' && dot == 0) dot++; // We have scientific notation without a decimal point
    if (dot == 1) { // if a floating point number
      token.subtype = [TNT.DECIMAL, TNT.FLOAT];
      if (c == 'e') { // check for floating point exponent
        str += c; // Append the e for parseFloat
        this._advanceColumn();
        c = this.source[0];
        if (c == '-') {
          str += c;
          this._advanceColumn();
          c = this.source[0];
        } else if (c == '+') {
          str += c;
          this._advanceColumn();
          c = this.source[0];
        }
        while (c >= '0' && c <= '9') {
          str += c;
          this._advanceColumn();
          c = this.source[0];
        }
      } else if (c == '#') { // check for floating point exception infinite 1.#INF or indefinite 1.#IND or NaN
        c2 = 4;
        if (this.source.startsWith("INF")) token.subtype.push(TNT.INFINITE);
        else if (this.source.startsWith("IND")) token.subtype.push(TNT.INDEFINITE);
        else if (this.source.startsWith("NAN")) token.subtype.push(TNT.NAN);
        else if (this.source.startsWith("QNAN")) {
          token.subtype.push(TNT.NAN);
          c2++;
        } else if (this.source.startsWith("SNAN")) {
          token.subtype.push(TNT.NAN);
          c2++;
        }
        for (var i = 0; i < c2; i++) {
          str += c;
          this._advanceColumn();
          c = this.source[0];
        }
        while (c >= '0' && c <= '9') {
          str += c;
          this._advanceColumn();
          c = this.source[0];
        }
        if (!this.flags.includes(LFL.ALLOWFLOATEXCEPTIONS)) this._error(`parsed ${str}`);
      }
    } else if (dot > 1) {
      if (!this.flags.includes(LFL.ALLOWIPADDRESSES)) {
        this._error("more than one dot in number");
        return 0;
      }
      if (dot != 3) {
        this._error("ip address should have three dots");
        return 0;
      }
      token.subtype = [TNT.IPADDRESS];
    } else token.subtype = [TNT.DECIMAL, TNT.INTEGER];
  }
  if (token.subtype.includes(TNT.FLOAT)) {
    if (c > ' ') {
      if (c == 'f' || c == 'F') { // single-precision: float
        token.subtype.push(TNT.SINGLE_PRECISION);
        this._advanceColumn();
      } else if (c == 'l' || c == 'L') { // extended-precision: long double
        token.subtype.push(TNT.EXTENDED_PRECISION);
        this._advanceColumn();
      } else { // default is double-precision: double
        token.subtype.push(TNT.DOUBLE_PRECISION);
      }
    } else token.subtype.push(TNT.DOUBLE_PRECISION);
  } else if (token.subtype.includes(TNT.INTEGER)) {
    if (c > ' ') { // default: signed long
      for (var i = 0; i < 2; i++) {
        if (c == 'l' || c == 'L') token.subtype.push(TNT.LONG); // long integer
        else if (c == 'u' || c == 'U') token.subtype.push(TNT.UNSIGNED); // unsigned integer
        else break;
        this._advanceColumn();
        c = this.source[0];
      }
    }
  } else if (token.subtype.includes(TNT.IPADDRESS)) {
    if (c == ':') {
      str += c;
      this._advanceColumn();
      c = this.source[0];
      while (c >= '0' && c <= '9') {
        str += c;
        this._advanceColumn();
        c = this.source[0];
      }
      token.subtype.push(TNT.IPPORT);
    }
  }
  token.str = str;
  return 1;
}

nuLexer.prototype.ReadPunctuation = function(token) {
  for (const punc of this.userPuncTable) {
    if (this.source.startsWith(punc[0])) { // check for this punctuation in the script
      token.str = punc[0];
      this._advanceColumn(punc[0].length);
      token.type = TT.PUNCTUATION;
      token.subtype = punc[1]; // sub type is the punctuation id
      return 1;
    }
  }
  return 0;
}

nuLexer.prototype.ReadUnknown = function(token) {
  token.str = this.source[0];
  token.type = TT.UNKNOWN;
  token.subtype = 0;
  this._advanceColumn();
  return 1;
}

nuLexer.prototype.ReadEOF = function(token) {
  token.str = '';
  token.type = TT.EOF;
  token.subtype = 0;
  return 2;
}

nuLexer.prototype.ReadToken = function(token) {
  var whitespace;
  if (!this.flags.includes(LFL.NOWHITESPACEDATA)) {
    whitespace = new nuToken(!this.flags.includes(LFL.NOPOSITIONS));
    whitespace.type = TT.WHITESPACE;
    if (!this.flags.includes(LFL.NOPOSITIONS)) {
      whitespace.pos.line = this.line;
      whitespace.pos.column = this.column;
    }
    token.whitespace = whitespace;
  }
  const wsret = this.ReadWhiteSpace(whitespace); // read white space before token
  if (!wsret) return 0;
  if (!this.flags.includes(LFL.NOPOSITIONS)) {
    token.pos.line = this.line;
    token.pos.column = this.column;
  }
  if (wsret == 2) { // clean exit
    return this.ReadEOF(token);
  }
  var c = this.source[0];
  if (this.flags.includes(LFL.ONLYSTRINGS)) { // if we're keeping everything as whitespace deliminated strings
    if (c == '\"' || c == '\'') { // if there is a leading quote
      if (!this.ReadString(token, c)) return 0;
    } else if (!this.ReadName(token)) return 0;
  } else if ((c >= '0' && c <= '9') || (c == '.' && (this.source[1] >= '0' && this.source[1] <= '9')) ) { // if there is a number
    if (!this.ReadNumber(token)) return 0;
    if (this.flags.includes(LFL.ALLOWNUMBERNAMES)) { // if names are allowed to start with a number
      c = this.source[0];
      if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_') {
        if (!this.ReadName(token)) return 0;
      }
    }
  } else if (c == '\"' || c == '\'') { // if there is a leading quote
    if (!this.ReadString(token, c)) return 0;
  } else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c == '_') { // if there is a name
    if (!this.ReadName(token)) return 0;
  } else if (this.flags.includes(LFL.ALLOWPATHNAMES) && ((c == '/' || c == '\\') || c == '.' )) { // names may also start with a slash when pathnames are allowed
    if (!this.ReadName(token)) return 0;
  } else if (!this.ReadPunctuation(token)) { // check for punctuations
    if (!this.flags.includes(LFL.UNKNOWN)) {
      this._error(`unknown punctuation ${c}`);
      return 0;
    }
  } else if (this.flags.includes(LFL.UNKNOWN) && !this.ReadUnknown(token)) {
    return 0;
  }
  return 1; // succesfully read a token
}

nuLexer.prototype.Parse = function() {
  const out = [];
  if (this.source === undefined) return out;
  while (1) {
    const token = new nuToken(!this.flags.includes(LFL.NOPOSITIONS));
    const rtret = this.ReadToken(token);
    if (rtret > 0) out.push(token);
    if (rtret != 1) break;
  }
  return out;
}

function _sortPuncTable(puncTable) {
  const copy = puncTable.slice();
  copy.sort((a, b) => ( // sorty by length and ASCII
    a[0].length != b[0].length ?
    b[0].length - a[0].length :
      (a[0] > b[0] ? 1 : (a[0] < b[0] ? -1 : 0))
  ));
  Object.freeze(copy);
  return copy;
}

Object.freeze(LFL);
Object.freeze(TT);
Object.freeze(TNT);
Object.freeze(PT);
Object.freeze(PTB);

module.exports = { LFL, TT, TNT, PT, PTB, nuLexer, nuToken };

// const lex = new nuLexer(["// comment", "  // comment with space", " /*", " multiline ", " comments */", '"string\\ttab\\nliteral"', "void", "42.35", " ++"]);const token = {};
// const parsed = lex.Parse();

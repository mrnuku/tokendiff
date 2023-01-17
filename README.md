# tokendiff
git compatible external diff utility based on token level comparison for (much) shorter patch files

## about

`tokendiff` expects valid c-like language files as input, all other file types are ** most-likely unsupported ** and will not work

*WARNING: `tokendiff` treats all comments as whitespaces, but only changes them if the preceding token are changed!*

## usage

First you need to install as a global node package, then you can set it as the external diff tool for git:
```Shell
npm install -g tokendiff
git config --global diff.external tokendiffgit
```

To produce a patch file, go to your source directory and run:
```Shell
cd /my/source/directory
git diff > changes.patch
```
*NOTE: This requires your working tree to have modified files*

If you finished, disable it by executing:
```Shell
git config --global --unset diff.external
```

## customization

To further tweak optimization of the output, you can provide a customization file named `.tokendiff`, placed in the directory where the `git` operation will be comitted. The file is a standard JSON file.

.tokendiff
```json
{
  "map": [
    {
      "type": "NUMBER",
      "condition": "e.subtype.includes(TNT.FLOAT)",
      "side": "all",
      "apply": "e.type = 'NUMBER_VALUE_COMP'",
      "include": "^src\\/($|.*)",
      "exclude": "^src\\/forbid\\/($|.*)"
    }
  ],
  "equal": [
    {
      "type": "NUMBER_VALUE_COMP",
      "comparator": "a.value == b.value",
      "include": "^src\\/($|.*)",
      "exclude": "^src\\/forbid\\/($|.*)"
    }
  ]
}
```

*This example will tell `tokendiff` to compare any floating number tokens by value, instead of the default string comparsion.*

### `map` array of records

You can run one of these mapping records on any token(s) with the `type`, `condition`, `side`, `include` and `exclude` given, which will run the `apply` snipet given on them, after tokendiff parsed the file. Only the first record will be applied if the condition is true, but it will continue to fall-over on records with a false result.

- `type` is a builtin token type, where the main ones are: `STRING` "" or `LITERAL` '', `NUMBER`, `NAME` or `PUNCTUATION` [extensive list in Lexer.js](lib/Lexer.js#25)
- `condition` is a snipet of code what will be evaluated, with available objects are: `e` is the token itself, `TT` token types, `TNT` number types
- `side` can be `all` for both input files (same if omitted), `left` for the original only or `right` for the modified file only in the working tree
- `apply` the snipet what will be run if the condition is true, same inputs as `condition`
- `include` regex pattern for allowed file paths, all files allowed if its omitted
- `exclude` regex pattern to filter out file paths, no files filtered out if omitted

### `equal` array of records

This will control what will be a difference in data, only same typed tokens will be compared for performance considerations. (This is why you hence 'remap' the token types).

- `type` is a builtin or mapped token type
- `comparator` is a snipet of code will determine equality, with same inputs as `map.condition`
- `include` regex pattern for allowed file paths, all files allowed if its omitted
- `exclude` regex pattern to filter out file paths, no files filtered out if omitted

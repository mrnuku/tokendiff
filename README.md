# tokendiff
git compatible external diff utility based on token level comparison for (much) shorter patch files

## usage

First you need to install as a global node package, then you can set it as the external diff tool for git:
```
npm install -g tokendiff
git config --global diff.external tokendiff
```

To produce a patch file, go to your source directory and run:
```
cd /my/source/directory
git diff > changes.patch
```
*NOTE: This requires your working tree to have modified files*

If you finished, disable it by executing:
```
git config --global --unset diff.external
```
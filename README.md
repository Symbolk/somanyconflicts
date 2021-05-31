# So Many Conflicts

**A VSCode extension to resolve many conflicts interactively and systematically, to boost developer’s efficiency and conflicts resolution quality**.

> Under tense development, to be published in marketplace when ready.

## Features

- Recommend the starting point to resolve multiple conflict blocks after merging.
- Interactively choose the next (*related*/*similar*) conflict to resolve more easily.
- Suggest resolution strategy given already resolved relevant conflicts (recently by the same developer and previously by all team members).

## Requirements

- Install latest VSCode of course.
- Search&Install SoManyConflict in VSCode extension marketplace.

## Quick Start

1. Open a Git repository with unresolved merge conflicts in VSCode.
2. Invoke command `somany`.
3. Start resolving from the recommended starting point conflict block.
4. Jump to the suggested subsequent conflict block to resolve.
5. After all conflicts resolved, go on committing the changed files.

## Develop

1. Clone repo and open in VSCode.
2. Run `yarn` to download dependencies.
3. Press `F5` to run and debug extension.
4. In the new window, press `F1` or `Cmd+Shift+P` and invoke command `somany`.

## Known Issues

- If you find that electron takes too much time to install when running `yarn`, stop it with `Command+C` and remove `"electron": "12.0.4"` from `package.json` first, then run the following command to install modules:
```sh
yarn
ELECTRON_MIRROR=http://npm.taobao.org/mirrors/electron/ yarn add -D electron@12.0.4
```

- Treesitter is a native module that must be rebuilt locally after installed to match the electron node version of VSCode (see [electron-rebuild]). However, directly running rebuild will result in an error about C++ version. There is an unmerged [PR] and a related [issue] for [node-tree-sitter], for now you need to follow these steps to successfully rebuild it:

[electron-rebuild]: https://www.electronjs.org/docs/tutorial/using-native-node-modules
[node-tree-sitter]: https://github.com/tree-sitter/node-tree-sitter/
[PR]: https://github.com/tree-sitter/node-tree-sitter/pull/83
[issue]: https://github.com/tree-sitter/node-tree-sitter/issues/82

1. Edit `node_modules/tree-sitter/binding.gyp`:

```
      'xcode_settings': {
-       'CLANG_CXX_LANGUAGE_STANDARD': 'c++11',
+       'CLANG_CXX_LANGUAGE_STANDARD': 'c++14',
      },
```

2. Rebuild it with:

```
./node_modules/.bin/electron-rebuild
```
   
<center> <strong>Enjoy!</strong> </center>


> Conflicts parsing part is borrowed from [Conflict Squeezer], thanks for the nice work!

[Conflict Squeezer]: https://github.com/angelo-mollame/conflict-squeezer

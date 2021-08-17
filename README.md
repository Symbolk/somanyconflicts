<div align="center">
  <a href="" target="_blank">
    <img width="160" src="/media/logo.png" alt="logo">
  </a>
  <h1 id="somanyconflicts"><a href="https://github.com/Symbolk/somanyconflicts/" target="repo">So Many Conflicts</a></h1>

</div>

**A VSCode extension to help developers resolve so many merge conflicts interactively and systematically, to lighten this tedious work and avoid making mistakes**.

![screen](/media/screenshot.png?raw=true "screen")


## Features

- Group *related* merge conflicts and order them topologically, *related* means: *depending/depended*, *similar*, or *close*.
- Interactively suggest the next related conflict to resolve by the way.
- Suggest resolution strategy based on already resolved relevant conflicts.

## Language Support

- Java
- TypeScript
- JavaScript (testing)
- Python (doing)

## Requirements

- OS: macOS/Linux/Windows
- VSCode: ^1.45.0
  
## Installation

- Install from marketplace: search&install `SoManyConflict` in the VSCode extension marketplace.
- Install from vsix: build&download the installation package `.vsix` (see following), and run `Extension: Install from VSIX...` in VSCode extension sidebar.
  
[release]: https://github.com/Symbolk/somanyconflicts/releases

## Quick Start

1. Open a Git repository with unresolved merge conflicts in VSCode.
2. Click the button in the side bar, or invoke by command starting with `somany`.
3. Start resolving by starting from the grouped and ordered related conflicts.
4. Navigate and jump to related conflict blocks to resolve by the way.
5. After all conflicts resolved, go on committing the changes.

## Develop
### Requirements

#### Under macOS/Linux (Recommended)
- VSCode ~1.56.0
- Node.JS ^14.16.0
- Python ^3.7.0
- xcode-select ~2373
- Yarn ^1.16.0
#### Under Windows
- VSCode ~1.56.0
- Node.JS ^14.16.0
- Python ^3.7.0
- Visual Studio Build Tools 2017
- Yarn ^1.16.0

### Instructions

#### Under macOS (Recommended)
0. Install XCode command line tools:
```sh
xcode-select --install
```
2. Clone repo and open in VSCode.
3. Open the terminal, install Emscripten (the compiler toolchain to WebAssembly): https://emscripten.org/docs/getting_started/downloads.html#sdk-download-and-install
4. In the same terminal and under the project root, run `yarn` or `npm i` to download dependencies.
5. Press `F5` to run and debug extension.
6. In the new window, press `F1` or `Cmd+Shift+P` and invoke command `somany`.

> Trick: When debugging, install the extension `Auto Run Command` and configure it in `Code-Preferences-Settings`, you can avoid manually invoke the command:

```json
  "auto-run-command.rules": [
    {
      "condition": "isRootFolder: XXX",
      "command": "somanyconflicts.start",
      "message": "Running So Many Conflicts"
    }
  ],
```

#### Under Windows
1. Install [windows-build-tools]:
```
npm install --global windows-build-tools
```
[windows-build-tools]: https://www.npmjs.com/package/windows-build-tools

1. Clone repo and open in VSCode.
2. Open the terminal, install Emscripten (the compiler toolchain to WebAssembly): https://emscripten.org/docs/getting_started/downloads.html#sdk-download-and-install
3. In the same terminal and under the project root, run `yarn` or `npm i` to download dependencies.
4. Press `F5` to run and debug extension.
5. In the new window, press `F1` or `Ctrl+Shift+P` and invoke command `somany`.


## Known Issues

1. If you find that electron takes too much time to install when running `yarn`, stop it with `Command+C` and remove `"electron": "13.1.7"` from `package.json` first, then run the following command to install modules:

```sh
yarn
ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/ yarn add -D electron@13.1.7
```

2. [Deprecated] Treesitter is a native module that must be rebuilt locally after installed to match the electron node version of VSCode (see [electron-rebuild]). However, directly running rebuild will result in an error about C++ version. There is an unmerged [PR] and a related [issue] for [node-tree-sitter], for now you need to follow these steps to successfully rebuild it:

[electron-rebuild]: https://www.electronjs.org/docs/tutorial/using-native-node-modules
[node-tree-sitter]: https://github.com/tree-sitter/node-tree-sitter/
[PR]: https://github.com/tree-sitter/node-tree-sitter/pull/83
[issue]: https://github.com/tree-sitter/node-tree-sitter/issues/82

- Edit `node_modules/tree-sitter/binding.gyp`:

```diff
     'xcode_settings': {
-       'CLANG_CXX_LANGUAGE_STANDARD': 'c++11',
+       'CLANG_CXX_LANGUAGE_STANDARD': 'c++14',
     },
```

- Rebuild it with:

```sh
./node_modules/.bin/electron-rebuild
```

> Note that, unfortunately, each time you run yarn, you need to rebuild treesitter as above :-(

> Conflicts parsing part is borrowed from [Conflict Squeezer], thanks for the nice work!

[Conflict Squeezer]: https://github.com/angelo-mollame/conflict-squeezer

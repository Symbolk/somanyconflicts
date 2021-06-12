<div align="center">
  <a href="" target="_blank">
    <img width="160" src="https://github.com/Symbolk/somanyconflicts/blob/main/media/logo.png" alt="logo">
  </a>
  <h1 id="somanyconflicts"><a href="https://github.com/Symbolk/somanyconflicts/" target="repo">So Many Conflicts</a></h1>

</div>

**A VSCode extension to help developers resolve so many merge conflicts interactively and systematically, to lighten this tedious work and avoid making mistakes**.

![screen](/media/screenshot.png?raw=true "screen")


## Features

- Recommend the starting point to resolve multiple conflict blocks after merging.
- Interactively choose the next (*related*/*similar*) conflict to resolve more easily.
- Suggest resolution strategy given already resolved relevant conflicts (recently by the same developer and previously by all team members).

## Language Support

- Java
- JavaScript
- TypeScript
- Python (doing)

## Requirements

- Install latest VSCode of course.
- Search&Install `SoManyConflict` in the extension marketplace.

## Quick Start

1. Open a Git repository with unresolved merge conflicts in VSCode.
2. Invoke command `somany` or click the button in the side bar.
3. Start resolving from the recommended starting point conflict block.
4. Navigate and jump to the suggested subsequent conflict block to resolve by hand.
5. After all conflicts resolved, go on committing the resolved files.

## Develop

1. Clone repo and open in VSCode.
2. Run `yarn` to download dependencies.
3. Press `F5` to run and debug extension.
4. In the new window, press `F1` or `Cmd+Shift+P` and invoke command `somany`.
5. Trick: When debugging, install the extension `Auto Run Command` and configure it in `Code-Preferences-Settings`, you can avoid manually invoke the command:

```json
  "auto-run-command.rules": [
    {
      "condition": "isRootFolder: XXX",
      "command": "somanyconflicts.start",
      "message": "Running So Many Conflicts"
    }
  ],
```

## Known Issues

- If you find that electron takes too much time to install when running `yarn`, stop it with `Command+C` and remove `"electron": "12.0.4"` from `package.json` first, then run the following command to install modules:
```sh
yarn
ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/ yarn add -D electron@12.0.4
```

- Treesitter is a native module that must be rebuilt locally after installed to match the electron node version of VSCode (see [electron-rebuild]). However, directly running rebuild will result in an error about C++ version. There is an unmerged [PR] and a related [issue] for [node-tree-sitter], for now you need to follow these steps to successfully rebuild it:

[electron-rebuild]: https://www.electronjs.org/docs/tutorial/using-native-node-modules
[node-tree-sitter]: https://github.com/tree-sitter/node-tree-sitter/
[PR]: https://github.com/tree-sitter/node-tree-sitter/pull/83
[issue]: https://github.com/tree-sitter/node-tree-sitter/issues/82

1. Edit `node_modules/tree-sitter/binding.gyp`:

```json
      'xcode_settings': {
-       'CLANG_CXX_LANGUAGE_STANDARD': 'c++11',
+       'CLANG_CXX_LANGUAGE_STANDARD': 'c++14',
      },
```

2. Rebuild it with:

```sh
./node_modules/.bin/electron-rebuild
```

> Note that, unfortunately, each time you run yarn, you need to rebuild treesitter as above :-(
> 
<center> <strong>Enjoy!</strong> </center>

> Conflicts parsing part is borrowed from [Conflict Squeezer], thanks for the nice work!

[Conflict Squeezer]: https://github.com/angelo-mollame/conflict-squeezer

## Development

> Recommend to develop under macOS/Linux, since SoManyConflicts relies on node-tree-sitter (node binding of a C++ native module tree-sitter), and the node-gyp&windows-build-tools is a even more terrible nightmare under Windows!

### Requirements
- Node.JS ^14.16.0
- (optional) Yarn ^1.16.0
- VSCode ^1.56.0

### Instructions
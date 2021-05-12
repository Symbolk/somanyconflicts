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

<center> <strong>Enjoy!</strong> </center>


> Conflicts parsing part is borrowed from [Conflict Squeezer], thanks for the nice work!

[Conflict Squeezer]: https://github.com/angelo-mollame/conflict-squeezer

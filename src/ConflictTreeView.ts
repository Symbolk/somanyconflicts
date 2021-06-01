import { ConflictSection } from './ConflictSection';
import { ISection } from './ISection';
import * as vscode from 'vscode'

export class ConflictTreeViewProvider implements vscode.TreeDataProvider<ConflictTreeItem>{
    constructor(private conflict: ConflictTreeItem[]) {
        // console.log("conflict", conflict)
    }
    getTreeItem(item: ConflictTreeItem): vscode.TreeItem {
        if (item.uri && item.range && item.label) {
            return {
                // resourceUri: item.uri,
                label: item.label,
                command: {
                    command: "somanyconflicts.openFileAt",
                    title: 'Open',
                    arguments: [item.uri, item.range]
                },
                collapsibleState: vscode.TreeItemCollapsibleState.None
            }
        } else if (item.uri) {
            return {
                resourceUri: item.uri,
                collapsibleState: vscode.TreeItemCollapsibleState.Expanded
            }
        } else if (item.label) {
            return new vscode.TreeItem(item.label, vscode.TreeItemCollapsibleState.Expanded)
        } else {
            throw ("data error")
        }
    }
    getChildren(element?: ConflictTreeItem): Thenable<ConflictTreeItem[]> {
        if (element) {
            return Promise.resolve(element.children)
        } else {
            return Promise.resolve(this.conflict)
        }
    }

    private _onDidChangeTreeData: vscode.EventEmitter<ConflictTreeItem | undefined | null | void> = new vscode.EventEmitter<ConflictTreeItem | undefined | null | void>();

    readonly onDidChangeTreeData: vscode.Event<ConflictTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(data: ConflictTreeItem | undefined | null | void): void {
        this._onDidChangeTreeData.fire()
    }
}

export class ConflictTreeItem {
    constructor(
        public label: string | undefined,
        public uri: vscode.Uri | undefined,
        public range: vscode.Range | undefined,
        public children: Array<ConflictTreeItem>,
        public collapsibleState: vscode.TreeItemCollapsibleState,
    ) { }
}

export async function conflictSectionsToTreeItem(allConflictSections: ISection[], parents: ConflictTreeItem[]) {
    for (let section of allConflictSections) {
        if (section instanceof ConflictSection) {
            let doc = await vscode.workspace.openTextDocument(section.conflict.uri!)
            let conflict = (<ConflictSection>section).conflict
            let start = new vscode.Position(conflict.range.start.line + 1, conflict.range.start.character)
            let range = new vscode.Range(start, conflict.range.end)
            let label = doc.getText(range).trimLeft()
            let newConflict = new ConflictTreeItem(label, conflict.uri, conflict.range, [],
                vscode.TreeItemCollapsibleState.None)
            let flag = false
            for (let parent of parents) {
                if (newConflict.uri == parent.uri) {
                    parent.children.push(newConflict)
                    flag = true
                    break
                }
            }
            if (!flag) {
                let newParent = new ConflictTreeItem(undefined, conflict.uri, undefined, [newConflict],
                    vscode.TreeItemCollapsibleState.Expanded)
                parents.push(newParent)
            }
        }
    }
    return parents
}


export async function suggestionsToTreeItem(suggestions: ISection[][], parents: ConflictTreeItem[]) {
    let idx = 0
    for (let group of suggestions) {
        idx++
        let groupRoot = new ConflictTreeItem("Group" + idx, undefined, undefined, [], vscode.TreeItemCollapsibleState.Expanded)
        for (let section of group) {
            if (section instanceof ConflictSection) {
                let doc = await vscode.workspace.openTextDocument(section.conflict.uri!)
                let conflict = (<ConflictSection>section).conflict
                let start = new vscode.Position(conflict.range.start.line + 1, conflict.range.start.character)
                let range = new vscode.Range(start, conflict.range.end)
                let label = doc.getText(range).trimLeft()
                let newConflict = new ConflictTreeItem(label, conflict.uri, conflict.range, [],
                    vscode.TreeItemCollapsibleState.None)
                groupRoot.children.push(newConflict)
            }
        }
        parents.push(groupRoot)
    }
    return parents
}
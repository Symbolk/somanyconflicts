import { DocumentSymbol, Location } from 'vscode'

export class Identifier {
  public constructor(public symbol: DocumentSymbol, public refs: Location[]) {}
}

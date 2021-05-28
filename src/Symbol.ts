import { DocumentSymbol, Location } from 'vscode'

export class Symbol {
  public constructor(public symbol: DocumentSymbol, public refs: Location[]) {}
}

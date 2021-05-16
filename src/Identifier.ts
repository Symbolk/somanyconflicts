import { DocumentSymbol, Location } from 'vscode'

export class Identifier {
  public symbol: DocumentSymbol | undefined = undefined
  public refs: Location[] = []

  public constructor(symbol: DocumentSymbol, refs: Location[]) {
    this.symbol = symbol
    this.refs = refs
  }
}

export class Identifier {
  private _identifier: string
  private _isDef: boolean

  public constructor() {
    this._identifier = ''
    this._isDef = false
  }

  public get identifier(): string {
    return this._identifier
  }
  public set identifier(value: string) {
    this._identifier = value
  }
  public get isDef(): boolean {
    return this._isDef
  }
  public set isDef(value: boolean) {
    this._isDef = value
  }
}

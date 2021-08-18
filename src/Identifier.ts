export class Identifier {
  private _isDef: boolean = false

  public constructor(private _type: string, private _identifier: string) {}

  public get type(): string {
    return this._type
  }

  public set type(value: string) {
    this._type = value
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

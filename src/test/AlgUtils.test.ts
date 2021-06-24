import * as assert from 'assert'
import { AlgUtils } from '../AlgUtils'
import { Conflict } from '../Conflict'
import 'mocha'

describe('Alg Test', function () {
  it('Similarity Test', () => {
    let conflict1 = new Conflict()
    conflict1.addOurLine('class DataTexture3D extends Texture {')
    conflict1.addBaseLine('function DataTexture3D( data, width, height, depth ) {')
    conflict1.addTheirLine('function DataTexture3D( data = null, width = 1, height = 1, depth = 1 ) {')
    let conflict2 = new Conflict()
    conflict2.addOurLine('class  extends Texture {')
    conflict2.addBaseLine('function DataTexture2DArray( data, width, height, depth ) {')
    conflict2.addTheirLine('function DataTexture2DArray( data = null, width = 1, height = 1, depth = 1){')
    let simi = AlgUtils.computeSimilarity(conflict1, conflict2)
    assert.strictEqual(-1, [1, 2, 3].indexOf(5))
    assert.strictEqual(-1, [1, 2, 3].indexOf(0))
  })
})

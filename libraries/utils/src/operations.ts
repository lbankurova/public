import {Matrix, Vector, Coordinates, Vectors, DistanceMetric} from './type-declarations';

/**
 * Asserts a condition by throwing an Error.
 *
 * @export
 * @param {boolean} [condition=false] Condition to assert.
 * @param {string} [message='Assertion error.'] Message to output.
 * @throws {Error}
 */
export function assert(condition: boolean = false, message: string = 'Assertion error.') {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Generates single random integer from 0 to range.
 *
 * @export
 * @param {number} range Max generating value.
 * @return {number} A random integer generated.
 */
export function randomInt(range: number): number {
  return Math.floor(Math.random() * range);
}

/**
 * Creates new two-dimensional array and fills it with the value given.
 *
 * @param {number} dimension1 The first dimension of the coordinates (number of rows).
 * @param {number} dimension2 The second dimension of the coordinates (number of columns).
 * @param {number} [fill=0] A value to fill the coordinates with.
 * @return {Coordinates} A two-dimensional filled with the value given.
 * @todo Might be slow since used Array.map. Probably needs performance revision.
 */
function initCoordinates(dimension1: number, dimension2: number, fill: number = 0): Coordinates {
  return new Array(dimension1).fill(fill).map(() => (new Vector(dimension2).fill(fill)));
}

/**
 * Transpose matrix.
 *
 * @export
 * @param {Matrix} matrix The matrix to be transposed.
 * @return {Matrix} Transposed matrix.
 * @todo Might be slow since used Array.map. Probably needs performance revision.
 */
export function transposeMatrix(matrix: Matrix): Matrix {
  return new Array(matrix[0].length).fill(0).map((_, i) => (new Vector(matrix.length).fill(0).map((_, j) => (matrix[j][i]))));
}

/**
 * Adds two vectors with the second one to be multiplied by the given ratio.
 *
 * @export
 * @param {Vector} p The first vector to add.
 * @param {Vector} q The second vector to add.
 * @param {number} [multiplier=1] A multiplier to be used before the second vector is added.
 * @return {Vector} New vector contained the result of operation p+multiplier*q.
 */
export function vectorAdd(p: Vector, q: Vector, multiplier: number = 1): Vector {
  const nItems = p.length;

  assert(nItems == q.length, 'Vector lengths do not match.')

  let total = new Vector(nItems);

  for (let i = 0; i < p.length; ++i) {
    total[i] = p[i]+multiplier*q[i];
  }
  return total;
}

/**
 * Sums the vector's items.
 *
 * @param {Vector} v The vector to be summed.
 * @return {number} The vector's items sum.
 */
function itemsSum(v: Vector): number {
  let total = 0;

  for (let i = 0; i < v.length; ++i) {
    total += v[i];
  }
  return total;
}

/**
 * Suqares the vector's items.
 *
 * @param {Vector} v The vector to square.
 * @return {Vector} A new vector containing the original's items squared.
 */
function vectorSquare(v: Vector): Vector {
  const nItems = v.length;
  let total = new Vector(nItems);

  for (let i = 0; i < v.length; ++i) {
    total[i] = v[i]*v[i];
  }
  return total;
}

/**
 * Creates a matrix filled with random floating point values.
 *
 * @export
 * @param {number} dimension1 The first dimension of the matrix.
 * @param {number} dimension2 The second dimension of the matrix.
 * @param {number} [scale=1.] Max value given by random generator.
 * @return {Matrix} A new matrix filled with random floating point  values.
 */
export function fillRandomMatrix(dimension1: number, dimension2: number, scale: number = 1.): Matrix {
  let matrix = initCoordinates(dimension1, dimension2);

  for (let i = 0; i < dimension1; ++i) {
    for (let j = 0; j < dimension2; ++j) {
      matrix[i][j] = Math.random() * scale;
    }
  }
  return matrix;
}

/**
 * Calculates Euclidean distance between two vectors.
 *
 * @export
 * @param {Vector} p The first vector.
 * @param {Vector} q The second vector.
 * @return {number} Euclidean distance between the given vectors.
 */
 export function calculateEuclideanDistance(p: Vector, q: Vector): number {
  const diff = vectorAdd(p, q, -1);
  const sqdiff = vectorSquare(diff);
  const sqdiffSumm = itemsSum(sqdiff);
  return Math.sqrt(sqdiffSumm);
}

/**
 * Calculates Root-mean-square deviation of two vectors.
 *
 * @export
 * @param {Vector} p The first vector.
 * @param {Vector} q The second vector.
 * @return {number} RMSD of the given vectors.
 */
 export function calculateRMSD(p: Vector, q: Vector): number {
  return calculateEuclideanDistance(p, q)/Math.sqrt(p.length);
}

/**
 * Creates a distance matrix using a custom distance function.
 *
 * @export
 * @param {Vectors} data Input vectors to calculate distances.
 * @param {DistanceMetric} distance Custom distance function.
 * @return {Matrix} Calculated custom distance matrix.
 */
export function calcDistanceMatrix(data: Vectors, distance: DistanceMetric): Matrix {
  const nItems = data.length;
  let matrix = initCoordinates(nItems, nItems, 0);

  for (let i = 0; i < nItems; ++i) {
    for (let j = i+1; j < nItems; ++j) {
      const d: number = (data[i] == null) || (data[j] == null) ? 0 : distance(data[i], data[j]);
      matrix[i][j] = matrix[j][i] = d;
    }
  }
  return matrix;
}

/**
 * Generates array from a range.
 *
 * @param {number} begin First position to include.
 * @param {number} end Last position to include.
 * @return {Int32Array} Array corresponding the range given.
 */
export function genRange(begin: number, end: number): Int32Array {
  const nItems = end - begin;
  const series = new Int32Array(nItems);

  for (let i = 0; i < nItems; ++i) {
    series[i] = i;
  }
  return series;
}

/**  
 * Returns order of values as if they are sorted.
 *
 * @export
 * @param {any[]} values Input array.
 * @param {boolean} [reverse=false] Whether to return reversed order.
 * @return {number[]} The order computed.
 */
export function argSort(values: any[], reverse = false): number[] {
  const sortfn = reverse ? (a: any[], b: any[]) => (b[0] - a[0]) : (a: any[], b: any[]) => (a[0] - b[0]);
  const decor = (v: any, i: number) => [v, i]; // set index to value
  const undecor = (a: any[]) => a[1]; // leave only index
  const _argsort = (arr: any[]) => arr.map(decor).sort(sortfn).map(undecor);
  return _argsort(values);
}

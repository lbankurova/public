//name: Pmax
//description: pMax Filtration Model
//language: javascript
//tags: model, filtration
//input: dataframe inputTable {caption: Input table; viewer: Grid(block: 50)} [Should contain columns Time (min), Vol (mL), P1 (psi), P2 (psi)]
//input: dataframe reportingParameters {caption: Reporting parameters; viewer: Grid(block: 50)}
//input: double batchVolume = 100 {caption: Batch volume; units: L} [Batch volume]
//input: double batchTime = 2 {caption: Batch time; units: hours} [Batch time]
//input: double targetPressure = 20 {caption: Target pressure; units: psi} [Target pressure]
//input: double aMinFilter1Guessed = 0.153 {units: m²; caption:A_guessed filter 1} [A_guessed filter 1]
//input: double aMinFilter2Guessed = 0.153 {units: m²; caption:A_guessed filter 2} [A_guessed filter 2]
//input: double filterArea1 = 23 {units: m²; caption: A_trial filter 1} [A_trial filter 1]
//input: double filterArea2 = 23 {units: m²; caption: A_trial filter 2} [A_trial filter 2]
//input: double sf = 1.5 {caption: Safety factor}
//output: dataframe Filter1 {caption: Primary filter; viewer: Scatter Plot(block: 50, showDataframeFormulaLines: "true"); category: OUTPUT}
//output: dataframe t1 {caption: Primary filter results; viewer: Grid(block: 25, showColumnLabels: false, showRowHeader: false); category: OUTPUT}
//output: dataframe Guessed1 {caption: Guessed primary filter; viewer: Grid(block: 25, showColumnLabels: false, showRowHeader: false); category: OUTPUT}
//output: dataframe Filter2 {caption: Secondary filter; viewer: Scatter Plot(block: 50, showDataframeFormulaLines: "true"); category: OUTPUT}
//output: dataframe t2 {caption: Secondary filter results; viewer: Grid(block: 25, showColumnLabels: false, showRowHeader: false); category: OUTPUT}
//output: dataframe Guessed2 {caption: Guessed secondary filter; viewer: Grid(block: 25, showColumnLabels: false, showRowHeader: false); category: OUTPUT}

function gaussianElimination(input, orderOfPolynomialRegression) {
  const n = input.length - 1, coefficients = [orderOfPolynomialRegression];
  for (let i = 0; i < n; i++) {
    let maxrow = i;
    for (let j = i + 1; j < n; j++)
      if (Math.abs(input[i][j]) > Math.abs(input[i][maxrow]))
        maxrow = j;
    for (let k = i; k < n + 1; k++) {
      const tmp = input[k][i];
      input[k][i] = input[k][maxrow];
      input[k][maxrow] = tmp;
    }
    for (let j = i + 1; j < n; j++)
      for (let k = n; k >= i; k--)
        input[k][j] -= (input[k][i] * input[i][j]) / input[i][i];
  }
  for (let j = n - 1; j >= 0; j--) {
    let total = 0;
    for (let k = j + 1; k < n; k++)
      total += input[k][j] * coefficients[k];
    coefficients[j] = (input[n][j] - total) / input[j][j];
  }
  return coefficients;
}

function polynomialRegressionCoefficients(xCol, yCol, orderOfPolynomialRegression) {
  const lhs = [], rhs = [], len = xCol.length, k = orderOfPolynomialRegression + 1;
  let a = 0, b = 0;
  for (let i = 0; i < k; i++) {
    for (let l = 0; l < len; l++)
      a += (xCol.get(l) ** i) * yCol.get(l);
    lhs.push(a);
    a = 0;
    const c = [];
    for (let j = 0; j < k; j++) {
      for (let l = 0; l < len; l++) 
        b += xCol.get(l) ** (i + j);
      c.push(b);
      b = 0;
    }
    rhs.push(c);
  }
  rhs.push(lhs);
  return gaussianElimination(rhs, k);
}

function predictPolynomialRegression(coefficients, x) {
  let y = coefficients[0];
  for (let i = coefficients.length - 1; i > 0; i--)
    y += coefficients[i] * Math.pow(x, i);
  return y;
}

function equationString(xColName, yColName, coefficients) {
  let s = '';
  for (let [index, coefficient] of coefficients.slice(1).reverse().entries()) {
    s += String(coefficient);
    for (let i = 0; i < coefficients.length - index - 1; i++)
      s += " * ${" + String(xColName) + "}";
    s += " + ";
  } 
  return "${" + yColName + "} = " + s + String(coefficients[0]);
}

const orderOfPolynomialRegression = 3;
const lengthOfSecondTable = 2985;
const colNames1 = {
  'time': 'Time (min)', 
  'volume': 'Vol (mL)',
  'pressure1': 'P1 (psi)',
  'pressure2': 'P2 (psi)',
  'tp1': 'TP 1 (L/m2)', 'flux1': 'Flux 1 (LMH)', 'res1': 'Res. 1 (psi/LMH)', 
  'tp2': 'TP 2 (L/m2)', 'flux2': 'Flux 2 (LMH)', 'res2': 'Res. 2 (psi/LMH)',	
  'deltaP': 'Delta P (psi)'
};
const colNames2 = {
  'area': 'Guess Area (m2)', 
  'javg': 'Javg (LMH)', 
  'R': 'R calc (psi/LMH)',
  'Y1': 'Y1', 'd1': 'Delta1',
  'Y2': 'Y2', 'd2': 'Delta2'
};

const t = inputTable.col(colNames1['time']);
const v = inputTable.col(colNames1['volume']);
const p1 = inputTable.col(colNames1['pressure1']);
const p2 = inputTable.col(colNames1['pressure2']);
const df1 = DG.DataFrame.fromColumns([t, v, p1, p2]);
df1.columns.addNewFloat(colNames1['tp1']).init((i) => (i > 0) ? 10 * v.get(i) / filterArea1 : 0);
df1.columns.addNewFloat(colNames1['tp2']).init((i) => (i > 0) ? 10 * v.get(i) / filterArea2 : 0);
df1.columns.addNewFloat(colNames1['flux1']).init((i) => (i > 0) ? 600 * (v.get(i) - v.get(i-1)) / (t.get(i) - t.get(i-1)) / filterArea1 : 0);
df1.columns.addNewFloat(colNames1['flux2']).init((i) => (i > 0) ? 600 * (v.get(i) - v.get(i-1)) / (t.get(i) - t.get(i-1)) / filterArea2 : 0);
df1.columns.addNewFloat(colNames1['deltaP']).init((i) => p1.get(i) - p2.get(i));
const deltaP = df1.col(colNames1['deltaP']), flux1 = df1.col(colNames1['flux1']), flux2 = df1.col(colNames1['flux2']);
df1.columns.addNewFloat(colNames1['res1']).init((i) => (i > 0) ? deltaP.get(i) / flux1.get(i) : 0);
df1.columns.addNewFloat(colNames1['res2']).init((i) => (i > 0) ? p2.get(i) / flux2.get(i) : 0);
Filter1 = DG.DataFrame.fromColumns([df1.col(colNames1['tp1']), df1.col(colNames1['res1'])]);
Filter2 = DG.DataFrame.fromColumns([df1.col(colNames1['tp2']), df1.col(colNames1['res2'])]);
const coefficients1 = polynomialRegressionCoefficients(df1.col(colNames1['tp1']), df1.col(colNames1['res1']), orderOfPolynomialRegression);    
const coefficients2 = polynomialRegressionCoefficients(df1.col(colNames1['tp2']), df1.col(colNames1['res2']), orderOfPolynomialRegression);

Filter1.meta.addFormulaLine({
  title: 'Third-order polynomial regression',
  equation: equationString(colNames1['tp1'], colNames1['res1'], coefficients1),
  zindex: -30,
  color: '#ff0000',
  width: 3
});

Filter2.meta.addFormulaLine({
  title: 'Third-order polynomial regression',
  equation: equationString(colNames1['tp2'], colNames1['res2'], coefficients2),
  zindex: -30,
  color: '#ff0000',
  width: 3
});

const df2 = DG.DataFrame.create(lengthOfSecondTable);
df2.columns.addNewFloat(colNames2['area']).init((i) => (i > 0) ? batchVolume / i : 0);
const area = df2.col(colNames2['area']);
df2.columns.addNewFloat(colNames2['javg']).init((i) => (i > 0) ? batchVolume / area.get(i) / batchTime : 0);
const javg = df2.col(colNames2['javg']);
df2.columns.addNewFloat(colNames2['R']).init((i) => (i > 0) ? targetPressure / javg.get(i) : 0);
df2.columns.addNewFloat(colNames2['Y1']).init((i) => predictPolynomialRegression(coefficients1, i));
df2.columns.addNewFloat(colNames2['Y2']).init((i) => predictPolynomialRegression(coefficients2, i));
const rCalc = df2.col(colNames2['R']), y1 = df2.col(colNames2['Y1']), y2 = df2.col(colNames2['Y2']);
df2.columns.addNewFloat(colNames2['d1']).init((i) => Math.abs(rCalc.get(i) - y1.get(i)));
df2.columns.addNewFloat(colNames2['d2']).init((i) => Math.abs(rCalc.get(i) - y2.get(i)));


amin1 = df2.col(colNames2['area']).get(df2.col(colNames2['d1']).toList().indexOf(df2.col(colNames2['d1']).min));
amin2 = df2.col(colNames2['area']).get(df2.col(colNames2['d2']).toList().indexOf(df2.col(colNames2['d2']).min));
processFlow1 = batchVolume / batchTime, processFlow2 = batchVolume / batchTime;
processFlux1 = processFlow1 / amin1, processFlux2 = processFlow2 / amin2;
trialFlux1 = 600 * v.max / t.max / filterArea1, trialFlux2 = 600 * v.max / t.max / filterArea2;
aminSF1 = sf * amin1, aminSF2 = sf * amin2;
trialLoading1 = df1.col(colNames1['tp1']).max, trialLoading2 = df1.col(colNames1['tp2']).max;
processLoading1 = batchVolume / amin1, processLoading2 = batchVolume / amin2;
maxP1 = predictPolynomialRegression(coefficients1, processLoading1) * processFlux1;
maxP2 = predictPolynomialRegression(coefficients2, processLoading2) * processFlux2;


guessedAmin1 = aMinFilter1Guessed, guessedAmin2 = aMinFilter2Guessed;
guessedProcessLoading1 = batchVolume / aMinFilter1Guessed, guessedProcessLoading2 = batchVolume / aMinFilter2Guessed;
guessedMaxP1 = predictPolynomialRegression(coefficients1, processLoading1) * processFlux1;
guessedMaxP2 = predictPolynomialRegression(coefficients2, processLoading2) * processFlux2; 
guessedProcessFlux1 = processFlow1 / aMinFilter1Guessed, guessedProcessFlux2 = processFlow2 / aMinFilter2Guessed;

const names = ['Amin (m²)', 'Amin w SF (m²)', 'Trial Loading (L/m²)', 'Process Loading (L/m²)', 'Max P (psi)', 'Trial Flux (LMH)', 'Process Flux (LMH)', 'Process Flow (L/hr)'];
const guessedNames = ['Amin (m²)', 'Process Loading (L/m²)', 'Max P (psi)', 'Process Flux (LMH)'];

t1 = DG.DataFrame.fromColumns([
  DG.Column.fromStrings('Name', names),
  DG.Column.fromFloat32Array('Value', [amin1, aminSF1, trialLoading1, processLoading1, maxP1, trialFlux1, processFlux1, processFlow1])
]);

t2 = DG.DataFrame.fromColumns([
  DG.Column.fromStrings('Name', names),
  DG.Column.fromFloat32Array('Value', [amin2, aminSF2, trialLoading2, processLoading2, maxP2, trialFlux2, processFlux2, processFlow2])
]);

Guessed1 = DG.DataFrame.fromColumns([
  DG.Column.fromStrings('Name', guessedNames),
  DG.Column.fromFloat32Array('Value', [guessedAmin1, guessedProcessLoading1, guessedMaxP1, guessedProcessFlux1])
]);

Guessed2 = DG.DataFrame.fromColumns([
  DG.Column.fromStrings('Name', guessedNames),
  DG.Column.fromFloat32Array('Value', [guessedAmin2, guessedProcessLoading2, guessedMaxP2, guessedProcessFlux2])
]);
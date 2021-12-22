import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

import $ from 'cash-dom';

import { aarGroups } from '../describe';
import { setAARRenderer } from '../utils/cell-renderer';

export class SubstViewer extends DG.JsViewer {
  viewerGrid: DG.Grid | null;
  maxSubstitutions: number;
  activityLimit: number;
  activityColumnName: string;
  casesGrid: DG.Grid | null;

  constructor() {
    super();

    this.activityColumnName = this.string('activityColumnName');

    this.maxSubstitutions = this.int('maxSubstitutions', 1);
    this.activityLimit = this.float('activityLimit', 2);

    this.viewerGrid = null;
    this.casesGrid = null;
  }

  onPropertyChanged(property: DG.Property): void {
    this.calcSubstitutions();
  }

  calcSubstitutions() {
    const aarColName = 'AAR';
    let splitedMatrix: string[][];
    let df: DG.DataFrame = this.dataFrame!;
    const col: DG.Column = df.columns.bySemType('alignedSequence');
    // let values: number[] = df.columns.byName('IC50').toList();
    const values = df.getCol(this.activityColumnName).toList().map(x => -Math.log10(x));
    // values = values;
    splitedMatrix = this.split(col);

    let tableValues: { [aar: string]: number[] } = {};
    let tableTooltips: { [aar: string]: string[] } = {};
    let tableCases: { [aar: string]: number[][][] } = {};

    let nRows = splitedMatrix.length;
    let nCols = splitedMatrix[0].length;
    const nColsArray = Array(nCols);

    for (let i = 0; i < nRows - 1; i++) {
      for (let j = i + 1; j < nRows; j++) {
        let substCounter = 0;
        let subst1: { [pos: number]: [string, string] } = {};
        let subst2: { [pos: number]: [string, string] } = {};
        let delta = values[i] - values[j];

        for (let k = 0; k < nCols; k++) {
          const smik = splitedMatrix[i][k];
          const smjk = splitedMatrix[j][k];
          if (smik != smjk && Math.abs(delta) >= this.activityLimit) {
            const vi = values[i].toFixed(2);
            const vj = values[j].toFixed(2);
            substCounter++;
            subst1[k] = [smik, `${smik} -> ${smjk}\t\t${vi} -> ${vj}`];
            subst2[k] = [smjk, `${smjk} -> ${smik}\t\t${vj} -> ${vi}`];
          }
        }

        if (substCounter <= this.maxSubstitutions && substCounter > 0) {

          Object.keys(subst1).forEach((pos) => {
            const posInt = parseInt(pos);
            let aar = subst1[posInt][0];
            if (!Object.keys(tableValues).includes(aar)) {
              tableValues[aar] = Array.apply(null, nColsArray).map(function () { return DG.INT_NULL; });
              tableTooltips[aar] = Array.apply(null, nColsArray).map(function () { return ""; });
              tableCases[aar] = Array.apply(null, nColsArray).map(function () { return []; });
            }

            tableValues[aar][posInt] = tableValues[aar][posInt] === DG.INT_NULL ? 1 : tableValues[aar][posInt] + 1;
            tableTooltips[aar][posInt] = tableTooltips[aar][posInt] == "" ? "Substitution\tvalues\n" : tableTooltips[aar][posInt];
            tableTooltips[aar][posInt] += subst1[posInt][1] + "\n";
            tableCases[aar][posInt].push([i, j, delta]);
          });
          Object.keys(subst2).forEach((pos) => {
            const posInt = parseInt(pos);
            let aar = subst2[posInt][0];
            if (!Object.keys(tableValues).includes(aar)) {
              tableValues[aar] = Array.apply(null, nColsArray).map(function () { return DG.INT_NULL; });
              tableTooltips[aar] = Array.apply(null, nColsArray).map(function () { return ""; });
              tableCases[aar] = Array.apply(null, nColsArray).map(function () { return []; });
            }

            tableValues[aar][posInt] = tableValues[aar][posInt] === DG.INT_NULL ? 1 : tableValues[aar][posInt] + 1;
            // tableValues[aar][posInt]++;
            tableTooltips[aar][posInt] = tableTooltips[aar][posInt] == "" ? "Substitution\tValues\n" : tableTooltips[aar][posInt];
            tableTooltips[aar][posInt] += subst2[posInt][1] + "\n";
            tableCases[aar][posInt].push([j, i, -delta]);
          });
        }
      }
    }

    const cols = [...Array(nCols).keys()].map((v) => DG.Column.int(v.toString()));
    const aarCol = DG.Column.string(aarColName);
    cols.splice(0, 1, aarCol);
    let table = DG.DataFrame.fromColumns(cols);
    for (const aar of Object.keys(tableValues)) {
      tableValues[aar].splice(0, 1);
      table.rows.addNew([aar, ...tableValues[aar]]);
    }

    // let groupMapping: { [key: string]: string } = {};

    //TODO: enable grouping
    // Object.keys(aarGroups).forEach((value) => groupMapping[value] = value);

    this.viewerGrid = table.plot.grid();

    setAARRenderer(aarCol, this.viewerGrid);

    this.viewerGrid.onCellTooltip(
      (gCell, x, y) => {
        if (gCell.cell.value !== DG.INT_NULL && gCell.tableColumn !== null && gCell.tableRowIndex !== null) {
          const colName = gCell.tableColumn.name;
          if (colName !== aarColName) {
            const aar = this.viewerGrid!.table.get(aarColName, gCell.tableRowIndex);
            const pos = parseInt(colName);
            const tooltipText = tableTooltips[aar][pos];
            ui.tooltip.show(ui.divText(tooltipText ? tooltipText : 'No substitutions'), x, y);
          }
        }
        return true;
      }
    );

    for (const col of table.columns.names()) {
      this.viewerGrid.col(col)!.width = this.viewerGrid.props.rowHeight;
    }

    this.viewerGrid.onCellRender.subscribe((args) => {
      if (args.cell.isRowHeader && args.cell.gridColumn.visible) {
        args.cell.gridColumn.visible = false;
        args.preventDefault();
      }
    });

    this.viewerGrid.props.allowEdit = false;

    table.onCurrentCellChanged.subscribe((_) => {
      if (table.currentCol !== null && table.currentCol.name !== aarColName && table.currentCell.value !== null) {
        const aar = table.get(aarColName, table.currentRowIdx);
        const pos = parseInt(table.currentCol.name);
        const currentCase = tableCases[aar][pos];
        const initCol = DG.Column.string('Initial');
        const subsCol = DG.Column.string('Substituted');

        const tempDf = DG.DataFrame.fromColumns([
          initCol,
          subsCol,
          DG.Column.float('Difference'),
        ]);

        for (const row of currentCase) {
          tempDf.rows.addNew([col.get(row[0]), col.get(row[1]), row[2]]);
        }

        initCol.semType = 'alignedSequence';
        subsCol.semType = 'alignedSequence';

        this.casesGrid = tempDf.plot.grid();
        this.casesGrid.props.allowEdit = false;
      } else {
        this.casesGrid = null;
      }
      this.render();
    });

    this.render();
  }

  render() {
    $(this.root).empty();
    this.root.appendChild(this.casesGrid === null ?
      this.viewerGrid!.root : ui.splitH([this.viewerGrid!.root, this.casesGrid.root])
    );
  }

  split(peptideColumn: DG.Column, filter: boolean = true): string[][] {
    const splitPeptidesArray: string[][] = [];
    let currentSplitPeptide: string[];
    let modeMonomerCount = 0;
    let currentLength;
    const colLength = peptideColumn.length;

    // splitting data
    const monomerLengths: { [index: string]: number } = {};
    for (let i = 0; i < colLength; i++) {
      currentSplitPeptide = peptideColumn.get(i).split('-').map((value: string) => value ? value : '-');
      splitPeptidesArray.push(currentSplitPeptide);
      currentLength = currentSplitPeptide.length;
      monomerLengths[currentLength + ''] =
        monomerLengths[currentLength + ''] ? monomerLengths[currentLength + ''] + 1 : 1;
    }
    //@ts-ignore: what I do here is converting string to number the most effective way I could find. parseInt is slow
    modeMonomerCount = 1 * Object.keys(monomerLengths).reduce((a, b) => monomerLengths[a] > monomerLengths[b] ? a : b);

    // making sure all of the sequences are of the same size
    // and marking invalid sequences
    let nTerminal: string;
    const invalidIndexes: number[] = [];
    let splitColumns: string[][] = Array.from({ length: modeMonomerCount }, (_) => []);
    modeMonomerCount--; // minus N-terminal
    for (let i = 0; i < colLength; i++) {
      currentSplitPeptide = splitPeptidesArray[i];
      nTerminal = currentSplitPeptide.pop()!; // it is guaranteed that there will be at least one element
      currentLength = currentSplitPeptide.length;
      if (currentLength !== modeMonomerCount) {
        invalidIndexes.push(i);
      }
      for (let j = 0; j < modeMonomerCount; j++) {
        splitColumns[j].push(j < currentLength ? currentSplitPeptide[j] : '-');
      }
      splitColumns[modeMonomerCount].push(nTerminal);
    }
    modeMonomerCount--; // minus C-terminal

    //create column names list
    const columnNames = Array.from({ length: modeMonomerCount }, (_, index) => `${index + 1 < 10 ? 0 : ''}${index + 1}`);
    columnNames.splice(0, 0, 'N-terminal');
    columnNames.push('C-terminal');

    // filter out the columns with the same values
    if (filter) {
      splitColumns = splitColumns.filter((positionArray, index) => {
        const isRetained = new Set(positionArray).size > 1;
        if (!isRetained) {
          columnNames.splice(index, 1);
        }
        return isRetained;
      });
    }

    return splitPeptidesArray;
  }
}
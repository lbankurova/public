import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

import $ from 'cash-dom';
import {StringDictionary} from '@datagrok-libraries/utils/src/type-declarations';
import {PeptidesController} from '../peptides';
import {MultipleSelection, addGridMouseHandler, MouseEventType, CellType} from '../utils/SAR-multiple-selection';
// import {PeptidesModel} from '../model';

/**
 * Structure-activity relationship viewer.
 *
 * @export
 * @class SARViewer
 * @extends {DG.JsViewer}
 */
export class SARViewer extends DG.JsViewer {
  protected viewerGrid: DG.Grid | null;
  protected sourceGrid: DG.Grid | null;
  protected activityColumnName: string;
  protected scaling: string;
  protected bidirectionalAnalysis: boolean;
  protected filterMode: boolean;
  protected statsDf: DG.DataFrame | null;
  protected initialized: boolean;
  protected viewGridInitialized: boolean;
  protected aminoAcidResidue;
  protected _initialBitset: DG.BitSet | null;
  protected viewerVGrid: DG.Grid | null;
  protected currentBitset: DG.BitSet | null;
  protected grouping: boolean;
  protected groupMapping: StringDictionary | null;
  // model: PeptidesModel | null;
  protected _name: string = 'Monomer-Positions';
  protected controller: PeptidesController | null;
  protected multipleFilter: MultipleSelection;
  // protected pValueThreshold: number;
  // protected amountOfBestAARs: number;
  // duplicatesHandingMethod: string;

  /**
   * Creates an instance of SARViewer.
   *
   * @memberof SARViewer
   */
  constructor() {
    super();

    this.viewerGrid = null;
    this.viewerVGrid = null;
    this.statsDf = null;
    this.groupMapping = null;
    this.initialized = false;
    this.aminoAcidResidue = 'AAR';
    this._initialBitset = null;
    this.viewGridInitialized = false;
    this.currentBitset = null;
    // this.model = null;
    this.controller = null;

    //TODO: find a way to restrict activityColumnName to accept only numerical columns (double even better)
    this.activityColumnName = this.string('activityColumnName');
    this.scaling = this.string('scaling', 'none', {choices: ['none', 'lg', '-lg']});
    this.filterMode = this.bool('filterMode', false);
    this.bidirectionalAnalysis = this.bool('bidirectionalAnalysis', false);
    this.grouping = this.bool('grouping', false);

    this.sourceGrid = null;
    this.multipleFilter = new MultipleSelection();
  }

  get name() {
    return this._name;
  }

  init() {
    this._initialBitset = this.dataFrame!.filter.clone();
    this.currentBitset = this._initialBitset.clone();
    this.initialized = true;
  }

  onSARGridMouseEvent(
    eventType: MouseEventType,
    cellType: CellType,
    colName: string | null,
    rowIdx: number | null,
    ctrlPressed: boolean,
  ) {
    switch (eventType) {
    case 'mouseout':
      this.onSARCellMouseOut();
      break;
    case 'click':
      if (colName)
        this.onSARCellClicked(colName, rowIdx, ctrlPressed);
      break;
    case 'mousemove':
      this.onSARCellHover(colName, rowIdx);
      break;
    }
  }

  onSARCellClicked(colName: string, rowIdx: number | null, ctrlPressed: boolean) {
    const isMultiposSel = colName == this.aminoAcidResidue;
    const isMultiresSel = rowIdx === null;

    if (isMultiposSel && isMultiresSel)
      return;

    const changeFilter = ctrlPressed ? this.multipleFilter.input : this.multipleFilter.set;
    const df = this.viewerGrid?.dataFrame!;
    const columns = df.columns as DG.ColumnList;
    let pos: string | undefined;
    let res: string | undefined;

    if (!isMultiposSel)
      pos = colName;
    if (!isMultiresSel)
      res = df.get(this.aminoAcidResidue, rowIdx);

    if (isMultiposSel)
      this.multipleFilter.setRes(res!, columns.names().slice(1)); // All except the first column
    else if (isMultiresSel)
      this.multipleFilter.setPos(pos!, df.col(this.aminoAcidResidue)!.toList());
    else
      changeFilter.bind(this.multipleFilter)(pos!, res!);

    console.warn([ctrlPressed ? 'ctrl+click' : 'click', this.multipleFilter.filter]);

    this.dataFrame?.rows.requestFilter();
  }

  onSARCellHover(colName: string | null, rowIdx: number | null) {
    if (!colName || !rowIdx)
      return;

    const df = this.viewerGrid?.dataFrame!;

    if (!(df.columns as DG.ColumnList).names().includes(colName))
      return;

    const res = df.get(this.aminoAcidResidue, rowIdx);

    this.dataFrame!.rows.match({[colName]: res}).highlight();
  }

  onSARCellMouseOut() {
    this.dataFrame!.rows.match({}).highlight();
  }

  onSourceDataFrameRowsFiltering(args: any) {
    const df = this.dataFrame!;
    const filtered = this.multipleFilter.eval(df, this.groupMapping!);
    const auxFilter = DG.BitSet.create(filtered.length, (i) => filtered[i]);
    const currentBitset = df.filter.and(auxFilter);
    console.warn([
      'onRowsFiltering',
      this.multipleFilter.filter,
      filtered.filter((v) => v).length,
      currentBitset.getSelectedIndexes().length,
    ]);
    this.currentBitset = applyBitset(
      this.dataFrame!, this.viewerGrid!, this.aminoAcidResidue,
      this.groupMapping!, currentBitset, this._initialBitset!, this.filterMode,
    ) ?? currentBitset;
  }

  setupGridVizualization() {
    this.viewerGrid?.setOptions({
      'showCurrentRowIndicator': false,
      'allowBlockSelection': false,
      'allowColSelection': false,
      'allowRowSelection': false,
      'showMouseOverRowIndicator': false,
    });
  }

  selectionCellRenderrer(args: DG.GridCellRenderArgs) {
    if (args.cell.isTableCell) {
      const cell = args.cell;
      const pos = cell.gridColumn.name;

      if (pos !== this.aminoAcidResidue) {
        const rowIdx = cell.tableRowIndex!;
        const res = cell.cell.dataFrame.get(this.aminoAcidResidue, rowIdx);

        if (this.multipleFilter.test(pos, res, this.groupMapping!)) {
          const ctx = args.g;
          ctx.rect(args.bounds.x, args.bounds.y, args.bounds.width, args.bounds.height);
          ctx.lineWidth = 10;
          // ctx.fillStyle = (args.cell.isColHeader ? 'red' : 'blue');
          args.preventDefault();
        }
      }
    }
  }

  async onTableAttached() {
    this.sourceGrid = this.view?.grid ?? (grok.shell.v as DG.TableView).grid;
    this.dataFrame?.setTag('dataType', 'peptides');
    this.controller = await PeptidesController.getInstance(this.dataFrame!);
    // this.model = PeptidesModel.getOrInit(this.dataFrame!);
    // this.model = this.controller.getOrInitModel();

    this.multipleFilter = new MultipleSelection();

    this.subs.push(this.controller.onStatsDataFrameChanged.subscribe((data) => this.statsDf = data));
    this.subs.push(this.controller.onSARGridChanged.subscribe((data) => {
      this.viewerGrid = data;
      addGridMouseHandler(this.viewerGrid, this.onSARGridMouseEvent.bind(this));
      this.setupGridVizualization();
      // this.viewerGrid.onCellRender.subscribe(this.selectionCellRenderrer.bind(this));
      this.render(false);
    }));
    this.subs.push(this.controller.onSARVGridChanged.subscribe((data) => this.viewerVGrid = data));
    this.subs.push(this.controller.onGroupMappingChanged.subscribe((data) => this.groupMapping = data));
    this.subs.push(this.dataFrame?.onRowsFiltering.subscribe((_) => {
      this.onSourceDataFrameRowsFiltering(_);
    })!);

    await this.render();
  }

  detach() {
    this.subs.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Function that is executed when the property is changed.
   *
   * @param {DG.Property} property New property.
   * @memberof SARViewer
   */
  async onPropertyChanged(property: DG.Property) {
    super.onPropertyChanged(property);

    if (!this.initialized) {
      this.init();
      return;
    }

    if (property.name === 'grouping')
      this.multipleFilter = new MultipleSelection();

    if (property.name === 'scaling' && typeof this.dataFrame !== 'undefined') {
      const minActivity = DG.Stats.fromColumn(
        this.dataFrame!.col(this.activityColumnName)!,
        this._initialBitset,
      ).min;
      if (minActivity && minActivity <= 0 && this.scaling !== 'none') {
        grok.shell.warning(`Could not apply ${this.scaling}: ` +
          `activity column ${this.activityColumnName} contains zero or negative values, falling back to 'none'.`);
        property.set(this, 'none');
        return;
      }
    }

    await this.render();
  }

  /**
   * Viewer render function.
   *
   * @param {boolean} [computeData=true] Recalculate data.
   * @memberof SARViewer
   */
  async render(computeData = true) {
    if (!this.initialized)
      return;

    //TODO: optimize. Don't calculate everything again if only view changes
    if (typeof this.dataFrame !== 'undefined' && this.activityColumnName && this.sourceGrid) {
      if (computeData) {
        await this.controller!.updateData(this.activityColumnName, this.scaling, this.sourceGrid,
          this.bidirectionalAnalysis, this._initialBitset, this.grouping);
      }

      if (this.viewerGrid !== null && this.viewerVGrid !== null) {
        $(this.root).empty();
        const title = ui.h1(this._name, {style: {'align-self': 'center'}});
        const gridRoot = this.viewerGrid.root;
        gridRoot.style.width = 'auto';
        this.root.appendChild(ui.divV([title, gridRoot]));
        this.viewerGrid.dataFrame!.onCurrentCellChanged.subscribe((_) => {
          // this.currentBitset = applyBitset(
          //   this.dataFrame!, this.viewerGrid!, this.aminoAcidResidue,
          //   this.groupMapping!, this._initialBitset!, this.filterMode,
          // ) ?? this.currentBitset;
          syncGridsFunc(false, this.viewerGrid!, this.viewerVGrid!, this.aminoAcidResidue);
        });
        this.viewerVGrid.dataFrame!.onCurrentCellChanged.subscribe((_) => {
          syncGridsFunc(true, this.viewerGrid!, this.viewerVGrid!, this.aminoAcidResidue);
        });
        // this.dataFrame.onRowsFiltering.subscribe((_) => {
        //   sourceFilteringFunc(
        //     this.filterMode,
        //     this.dataFrame!,
        //     this.currentBitset!,
        //     this._initialBitset!,
        //   );
        // });
        grok.events.onAccordionConstructed.subscribe((accordion: DG.Accordion) => {
          accordionFunc(
            accordion, this.viewerGrid!, this.aminoAcidResidue,
            this._initialBitset!, this.activityColumnName, this.statsDf!,
          );
        });
      }
    }
    //fixes viewers not rendering immediately after analyze.
    this.viewerGrid?.invalidate();
  }
}

/**
 * Vertical structure activity relationship viewer.
 *
 * @export
 * @class SARViewerVertical
 * @extends {DG.JsViewer}
 */
export class SARViewerVertical extends DG.JsViewer {
  viewerVGrid: DG.Grid | null;
  // model: PeptidesModel | null;
  protected _name = 'Sequence-Activity relationship';
  controller: PeptidesController | null;

  constructor() {
    super();

    this.viewerVGrid = null;
    this.controller = null;
  }

  get name() {
    return this._name;
  }

  async onTableAttached() {
    // this.model = PeptidesModel.getOrInit(this.dataFrame!);
    this.controller = await PeptidesController.getInstance(this.dataFrame!);

    this.subs.push(this.controller.onSARVGridChanged.subscribe((data) => {
      this.viewerVGrid = data;
      this.render();
    }));
  }

  render() {
    if (this.viewerVGrid) {
      $(this.root).empty();
      this.root.appendChild(this.viewerVGrid.root);
    }
    this.viewerVGrid?.invalidate();
  }
}

//TODO: refactor, move
function syncGridsFunc(sourceVertical: boolean, viewerGrid: DG.Grid, viewerVGrid: DG.Grid, aminoAcidResidue: string) {
  if (viewerGrid && viewerGrid.dataFrame && viewerVGrid && viewerVGrid.dataFrame) {
    if (sourceVertical) {
      const dfCell = viewerVGrid.dataFrame.currentCell;
      if (dfCell.column === null || dfCell.column.name !== 'Diff')
        return;

      const otherColName: string = viewerVGrid.dataFrame.get('Pos', dfCell.rowIndex);
      const otherRowName: string = viewerVGrid.dataFrame.get(aminoAcidResidue, dfCell.rowIndex);
      let otherRowIndex = -1;
      for (let i = 0; i < viewerGrid.dataFrame.rowCount; i++) {
        if (viewerGrid.dataFrame.get(aminoAcidResidue, i) === otherRowName) {
          otherRowIndex = i;
          break;
        }
      }
      if (otherRowIndex !== -1)
        viewerGrid.dataFrame.currentCell = viewerGrid.dataFrame.cell(otherRowIndex, otherColName);
    } else {
      const otherPos: string = viewerGrid.dataFrame.currentCol?.name;
      if (typeof otherPos === 'undefined' && otherPos !== aminoAcidResidue)
        return;

      const otherAAR: string =
        viewerGrid.dataFrame.get(aminoAcidResidue, viewerGrid.dataFrame.currentRowIdx);
      let otherRowIndex = -1;
      for (let i = 0; i < viewerVGrid.dataFrame.rowCount; i++) {
        if (
          viewerVGrid.dataFrame.get(aminoAcidResidue, i) === otherAAR &&
          viewerVGrid.dataFrame.get('Pos', i) === otherPos
        ) {
          otherRowIndex = i;
          break;
        }
      }
      if (otherRowIndex !== -1)
        viewerVGrid.dataFrame.currentCell = viewerVGrid.dataFrame.cell(otherRowIndex, 'Diff');
    }
  }
}

function sourceFilteringFunc(
  filterMode: boolean,
  dataFrame: DG.DataFrame,
  currentBitset: DG.BitSet,
  initialBitset: DG.BitSet,
) {
  if (filterMode) {
    dataFrame.selection.setAll(false, false);
    dataFrame.filter.copyFrom(currentBitset);
  } else {
    dataFrame.filter.copyFrom(initialBitset);
    dataFrame.selection.copyFrom(currentBitset);
  }
}

function applyBitset(
  dataFrame: DG.DataFrame,
  viewerGrid: DG.Grid,
  aminoAcidResidue: string,
  groupMapping: StringDictionary,
  currentBitset: DG.BitSet,
  initialBitset: DG.BitSet,
  filterMode: boolean,
) {
  //let currentBitset = null;
  if (
    viewerGrid.dataFrame &&
    viewerGrid.dataFrame.currentCell.value &&
    viewerGrid.dataFrame.currentCol.name !== aminoAcidResidue
  ) {
    const currentAAR: string =
      viewerGrid.dataFrame.get(aminoAcidResidue, viewerGrid.dataFrame.currentRowIdx);
    const currentPosition = viewerGrid.dataFrame.currentCol.name;

    const splitColName = '~splitCol';
    const otherLabel = 'Other';
    const aarLabel = `${currentAAR === '-' ? 'Empty' : currentAAR} - ${currentPosition}`;

    let splitCol = dataFrame.col(splitColName);
    if (!splitCol)
      splitCol = dataFrame.columns.addNew(splitColName, 'string');

    // Is true for all items that match position & residue selected in SAR viewer.
    const isChosen = (i: number) => groupMapping[dataFrame!.get(currentPosition, i)] === currentAAR;
    splitCol!.init((i) => isChosen(i) ? aarLabel : otherLabel);

    //TODO: use column.compact
    //currentBitset = DG.BitSet.create(dataFrame.rowCount, isChosen).and(initialBitset);
    sourceFilteringFunc(filterMode, dataFrame, currentBitset, initialBitset);

    const colorMap: {[index: string]: string | number} = {};
    colorMap[otherLabel] = DG.Color.blue;
    colorMap[aarLabel] = DG.Color.orange;
    // colorMap[currentAAR] = cp.getColor(currentAAR);
    dataFrame.getCol(splitColName).colors.setCategorical(colorMap);
  }
  return currentBitset;
}

function accordionFunc(
  accordion: DG.Accordion, viewerGrid: DG.Grid, aminoAcidResidue: string, initialBitset: DG.BitSet,
  activityColumnName: string, statsDf: DG.DataFrame) {
  if (accordion.context instanceof DG.RowGroup) {
    const originalDf: DG.DataFrame = DG.toJs(accordion.context.dataFrame);
    const viewerDf = viewerGrid.dataFrame;

    if (
      originalDf.getTag('dataType') === 'peptides' &&
      originalDf.col('~splitCol') &&
      viewerDf &&
      viewerDf.currentCol !== null
    ) {
      const currentAAR: string = viewerDf.get(
        aminoAcidResidue,
        viewerDf.currentRowIdx,
      );
      const currentPosition = viewerDf.currentCol.name;

      const labelStr = `${currentAAR === '-' ? 'Empty' : currentAAR} - ${currentPosition}`;
      const currentColor = DG.Color.toHtml(DG.Color.orange);
      const otherColor = DG.Color.toHtml(DG.Color.blue);
      const currentLabel = ui.label(labelStr, {style: {color: currentColor}});
      const otherLabel = ui.label('Other', {style: {color: otherColor}});

      const elements: (HTMLLabelElement | HTMLElement)[] = [currentLabel, otherLabel];

      const distPane = accordion.getPane('Distribution');
      if (distPane)
        accordion.removePane(distPane);

      accordion.addPane('Distribution', () => {
        const hist = originalDf.clone(initialBitset).plot.histogram({
        // const hist = originalDf.plot.histogram({
          filteringEnabled: false,
          valueColumnName: `${activityColumnName}Scaled`,
          splitColumnName: '~splitCol',
          legendVisibility: 'Never',
          showXAxis: true,
          showColumnSelector: false,
          showRangeSlider: false,
        }).root;
        hist.style.width = 'auto';
        elements.push(hist);

        const tableMap: StringDictionary = {'Statistics:': ''};
        for (const colName of new Set(['Count', 'pValue', 'Mean difference'])) {
          const query = `${aminoAcidResidue} = ${currentAAR} and Pos = ${currentPosition}`;
          const textNum = statsDf.groupBy([colName]).where(query).aggregate().get(colName, 0);
          // const text = textNum === 0 ? '<0.01' : `${colName === 'Count' ? textNum : textNum.toFixed(2)}`;
          const text = colName === 'Count' ? `${textNum}` : textNum < 0.01 ? '<0.01' : textNum.toFixed(2);
          tableMap[colName === 'pValue' ? 'p-value' : colName] = text;
        }
        elements.push(ui.tableFromMap(tableMap));

        return ui.divV(elements);
      }, true);
    }
  }
}

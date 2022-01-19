import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import { Observable } from 'rxjs';

// Formula Line types:
const enum ITEM_TYPE {
  PARALLEL_LINE = 'Parallel line',
  UNIVERSAL_LINE = 'Universal line',
  BAND = 'Band'
}

const FOR_TABLE = 'For table';

// Options for Formula Line types:
const ITEM_OPTIONS = {

  // Editor options for Parallel Line:
  [ITEM_TYPE.PARALLEL_LINE]: [
    { name: 'title', type: 'string', caption: 'Title' },
    { name: 'description', type: 'string', caption: 'Description' },
    { name: 'column', type: 'column', caption: 'Column' },
    { name: 'value', type: 'double', caption: 'Value' },
    { name: 'width', type: 'int', caption: 'Width' },
    { name: 'visible', type: 'bool', caption: 'Show' },
    { name: 'opacity', type: 'int', caption: 'Opacity', editor: 'slider', min: 0, max: 100 },
    { name: 'zIndex', type: 'int', caption: 'zIndex' },
    { name: 'color', type: 'string', caption: 'Color' },
    { name: 'style', type: 'string', caption: 'Style', choices: ['solid', 'dotted', 'dashed', 'longdash', 'dotdash'] },
    { name: 'min', type: 'int', caption: 'Min' },
    { name: 'max', type: 'int', caption: 'Max' }
  ],

  // Editor options for Universal Line:
  [ITEM_TYPE.UNIVERSAL_LINE]: [
    { name: 'title', type: 'string', caption: 'Title' },
    { name: 'description', type: 'string', caption: 'Description' },
    { name: 'formula', type: 'string', editor: 'textarea', caption: 'Formula' },
    { name: 'width', type: 'int', caption: 'Width' },
    { name: 'visible', type: 'bool', caption: 'Show' },
    { name: 'opacity', type: 'int', caption: 'Opacity', editor: 'slider', min: 0, max: 100 },
    { name: 'zIndex', type: 'int', caption: 'zIndex' },
    { name: 'color', type: 'string', caption: 'Color' },
    { name: 'style', type: 'string', caption: 'Style', choices: ['solid', 'dotted', 'dashed', 'longdash', 'dotdash'] },
    { name: 'min', type: 'int', caption: 'Min' },
    { name: 'max', type: 'int', caption: 'Max' }
  ],

  // Editor options for Band:
  [ITEM_TYPE.BAND]: [
    { name: 'title', type: 'string', caption: 'Title' },
    { name: 'description', type: 'string', caption: 'Description' },
    { name: 'column', type: 'string', caption: 'Column 1' },
    { name: 'formula', type: 'string', editor: 'textarea', caption: 'Formula' },
    { name: 'column2', type: 'string', caption: 'Column 2' },
    { name: 'visible', type: 'bool', caption: 'Show' },
    { name: 'opacity', type: 'int', caption: 'Opacity', editor: 'slider', min: 0, max: 100 },
    { name: 'zIndex', type: 'int', caption: 'zIndex' },
    { name: 'color', type: 'string', caption: 'Color' },
    { name: 'min', type: 'int', caption: 'Min' },
    { name: 'max', type: 'int', caption: 'Max' }
  ],

  // Options for displaying Formula Lines in the Table:
  [FOR_TABLE]: [
    { name: 'title', type: 'string', caption: 'Title' },
    { name: 'formula', type: 'string', editor: 'textarea', caption: 'Formula' },
    { name: 'visible', type: 'bool', caption: 'Show' },
    { name: 'new', type: 'string', caption: 'new' }
  ]
};

// Creates properties from options:
function propsFromOptions(options: any[]): DG.Property[] {
  return options.map((p: any) => DG.Property.fromOptions(p));
}

/**
 * Formula Lines Host Helper.
 * Reads, storages and saves Formula Lines to the host (DataFrame or Viewer).
 */
class Host {
  _src: DG.DataFrame | DG.Viewer;
  items: DG.FormulaLine[];

  constructor(src: DG.DataFrame | DG.Viewer) {
    if (!src)
      throw 'Host table/viewer not found.';

    this._src = src;
    this.items = src.meta.getFormulaLines();
  }

  save(): void {
    this._src.meta.removeFormulaLines();
    this._src.meta.addFormulaLines(this.items);
  }
}

/**
 * Table Helper for displaying and navigating Formula Lines list.
 */
class Table {
  _grid: DG.Grid;
  _props: DG.Property[] = propsFromOptions(ITEM_OPTIONS[FOR_TABLE]);

  get _onCurrentItemChanged(): Observable<any> { return this._grid.dataFrame!.onCurrentRowChanged; }

  get _currentItemIdx(): number { return this._grid.dataFrame!.currentRowIdx;}
  set _currentItemIdx(rowIdx: number) { this._grid.dataFrame!.currentRowIdx = rowIdx; }

  currentItem?: DG.FormulaLine;
  set height(h: number) { this._grid.root.style.height = `${h}px`; }
  get root(): HTMLElement { return this._grid.root; }

  constructor(items: DG.FormulaLine[], onCurrentItemChangedAction: Function) {
    this._grid = DG.Grid.fromProperties(items, this._props);

    this._grid.setOptions({
      showRowHeader: false,
      showCellTooltip: false,
      showColumnTooltip: false,
      showCurrentCellOutline: false,
      showContextMenu: false
    });

    this._grid.columns.byName('title')!.width = 100;
    this._grid.columns.byName('formula')!.width = 217;
    this._grid.columns.byName('visible')!.width = 50;

    let ctrlCol = this._grid.columns.byName('new')!;
    ctrlCol.width = 35;
    ctrlCol.cellType = 'html';

    // Shows "Delete" and "Add new" buttons:
    this._grid.onCellPrepare((cell) => {
      if (cell.gridColumn.name == 'new')
        cell.style.element = cell.isTableCell ? deleteBtn(cell.gridRow) : addBtn();
    });

    // Set current Formula Line and execute callback "onCurrentItemChangedAction":
    this._onCurrentItemChanged.subscribe((_) => {
      if (this._currentItemIdx < 0)
        return;
      let item = items[this._currentItemIdx];
      this.currentItem = item;
      onCurrentItemChangedAction(item);
    });

    // Set first Formula Line as current:
    if (items.length > 0)
      this._currentItemIdx = 0;

    // Creates "Add new" button:
    function addBtn(): HTMLElement {
      let btn = ui.button(ui.iconFA('plus'), () => {

      });
      return btn;
    }

    // Creates "Delete" button:
    function deleteBtn(itemIdx: number): HTMLElement {
      let btn = ui.button(ui.iconFA('trash-alt'), () => {
        items.splice(itemIdx, 1);
      });
      btn.style.textAlign = 'center';
      btn.style.height = '20px';
      return btn;
    }
  }

  refresh(): void {
    this._grid.invalidate();
  }
}

/**
 * Preview Helper for Formula Lines.
 * Scatter Plot viewer by default.
 */
class Preview {
  _scatterPlot: DG.ScatterPlotViewer;
  _src: DG.DataFrame | DG.Viewer;
  dataFrame?: DG.DataFrame;

  set height(h: number) { this._scatterPlot.root.style.height = `${h}px`; }
  get root(): HTMLElement { return this._scatterPlot.root; }

  // Sets the corresponding axes:
  _setAxes(item: DG.FormulaLine): void {
    let [itemY, itemX] = this._scatterPlot.meta.getFormulaLineAxes(item);
    let [previewY, previewX] = [itemY, itemX];

    // If the source is a Scatter Plot, then we try to set similar axes:
    if (this._src instanceof DG.ScatterPlotViewer) {
      let [srcY, srcX] = [this._src.props.yColumnName, this._src.props.xColumnName];
      [previewY, previewX] = [previewY ?? srcY, previewX ?? srcX];

      if (previewX == srcY || previewY == srcX)
        [previewY, previewX] = [previewX, previewY];

      if (previewX == previewY)
        previewY = srcY;
    }

    if (previewY)
      this._scatterPlot.setOptions({y: previewY});
    if (previewX)
      this._scatterPlot.setOptions({x: previewX});
  }

  constructor(src: DG.DataFrame | DG.Viewer) {
    // Extract data for Formula Lines:
    this.dataFrame =
          src instanceof DG.DataFrame ? src
        : src instanceof DG.Viewer ? src.dataFrame
        : undefined;

    if (!this.dataFrame)
      throw 'Host is not DataFrame or Viewer.';

    this._src = src;

    this._scatterPlot = DG.Viewer.scatterPlot(this.dataFrame, {
      showDataframeFormulaLines: false,
      showViewerFormulaLines: true,
      showSizeSelector: false,
      showColorSelector: false,
      showContextMenu: false,
      axesFollowFilter: false,
      showMinMaxTickmarks: false,
      showMouseOverPoint: false,
      showCurrentPoint: false,
      zoomAndFilter: 'no action',
      axisFont: '11px Arial',
      legendVisibility: 'Never',
      xAxisHeight: 25
    });
  }

  show(item: DG.FormulaLine): void {
    if (this._scatterPlot == undefined)
      return;

    // Duplicate the original item to display it even if it's hidden:
    let previewItem = Object.assign({}, item);
    previewItem.visible = true;

    // Show the item:
    this._scatterPlot.meta.removeFormulaLines();
    this._scatterPlot.meta.addFormulaItem(previewItem);
    this._setAxes(previewItem);
  }
}

/**
 * Editor Helper for Formula Lines (form with corresponding inputs).
 */
class Editor {
  _form: HTMLElement;

  // Set of properties for different Formula Line types:
  _props = {
    [ITEM_TYPE.PARALLEL_LINE]: propsFromOptions(ITEM_OPTIONS[ITEM_TYPE.PARALLEL_LINE]),
    [ITEM_TYPE.UNIVERSAL_LINE]: propsFromOptions(ITEM_OPTIONS[ITEM_TYPE.UNIVERSAL_LINE]),
    [ITEM_TYPE.BAND]: propsFromOptions(ITEM_OPTIONS[ITEM_TYPE.BAND])
  }

  // Returns corresponding properties for given Formula Line:
  _getItemProps(item?: DG.FormulaLine): DG.Property[] {
    if (item?.type == 'band')
      return this._props[ITEM_TYPE.BAND];
    return this._props[ITEM_TYPE.UNIVERSAL_LINE];
  }

  get root(): HTMLElement { return this._form; }

  constructor() {
    this._form = ui.form();
  }

  // Creates and fills editor for given Formula Line:
  show(item?: DG.FormulaLine): void {
    if (this._form == undefined)
      return;

    let newForm = ui.input.form(item, this._getItemProps(item));

    this._form.replaceWith(newForm);
    this._form = newForm;
  }
}

/**
 * A Dialog window with Formula Lines list, preview and editor.
 */
export class FormulaLinesDialog {
  title: string = 'Formula Lines';
  helpUrl: string = '/help/develop/how-to/show-formula-lines.md';

  // Helpers:
  host: Host;
  preview: Preview;
  editor: Editor;
  table: Table;
  dialog: DG.Dialog;

  /**
   * Initializes all parameters and opens the Dialog window.
   * @param {DG.DataFrame | DG.Viewer} src - the source where the Formula Lines will be read from.
   */
  constructor(src: DG.DataFrame | DG.Viewer) {
    this.host = new Host(src);
    this.preview = new Preview(src);
    this.editor = new Editor();
    this.table = new Table(this.host.items, this.onCurrentItemChangedAction.bind(this));
    this.dialog = ui.dialog({ title: this.title, helpUrl: this.helpUrl });

    // Create Dialog window layout:
    let layout = ui.div([
      ui.block50([
        this.table.root,
        this.preview.root
      ]),
      ui.block50([
        this.editor.root
      ])
    ]);

    this.table.height = 230;
    this.preview.height = 300;

    // Setup and open the Dialog window:
    this.dialog
      .add(layout)
      .onOK(this.onOKAction.bind(this))
      .show({width: 850, height: 650});
  }

  // The action will be executed when the current Formula Line of the Table changes:
  onCurrentItemChangedAction(item: DG.FormulaLine) {
    this.preview.show(item);
    this.editor.show(item);
  }

  onOKAction() {
    this.host.save();
  }
}
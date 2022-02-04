/* Do not change these import lines. Datagrok will import API library in exactly the same manner */
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

import {getSequenceMolecularWeight} from './molecular-measure';
import {AlignedSequenceEncoder} from '@datagrok-libraries/bio/src/sequence-encoder';
import {DimensionalityReducer} from '@datagrok-libraries/ml/src/reduce-dimensionality';
import {
  createDimensinalityReducingWorker,
} from '@datagrok-libraries/ml/src/workers/dimensionality-reducing-worker-creator';
import {Measure, StringMetrics} from '@datagrok-libraries/ml/src/typed-metrics';
import {Coordinates} from '@datagrok-libraries/utils/src/type-declarations';

/**
 * Finds a column with an activity.
 *
 * @param {DG.DataFrame} table The data frame to search for.
 * @return {(string | null)} Column name or null if not found.
 */
function inferActivityColumnsName(table: DG.DataFrame): string | null {
  const re = /activity|ic50/i;
  for (const name of table.columns.names()) {
    if (name.match(re))
      return name;
  }
  return null;
}

/**
 * Cast an aligned sequences column to clean sequences.
 *
 * @export
 * @param {DG.Column} col Column to process.
 * @return {Array<string>} Clean sequences array.
 */
export function cleanAlignedSequencesColumn(col: DG.Column): Array<string> {
  return col.toList().map((v, _) => AlignedSequenceEncoder.clean(v));
}

/**
 * Creates scatter plot with sequences embeded.
 *
 * @export
 * @param {DG.DataFrame} table The table containing samples.
 * @param {DG.Column} alignedSequencesColumn Samples column.
 * @param {string} method Embedding method to apply.
 * @param {string} measure Distance metric.
 * @param {number} cyclesCount Number of cycles to repeat.
 * @param {(DG.TableView | null)} view View to add scatter plot to
 * @param {(string | null)} [activityColumnName] Activity containing column to assign it to points radius.
 * @param {boolean} [zoom=false] Whether to fit view.
 * @return {Promise<DG.ScatterPlotViewer>} A viewer.
 */
export async function createPeptideSimilaritySpaceViewer(
  table: DG.DataFrame,
  alignedSequencesColumn: DG.Column,
  method: string,
  measure: string,
  cyclesCount: number,
  view: DG.TableView | null,
  activityColumnName?: string | null,
): Promise<DG.ScatterPlotViewer> {
  const pi = DG.TaskBarProgressIndicator.create('Creating embedding.');

  activityColumnName = activityColumnName ?? inferActivityColumnsName(table);

  const axesNames = ['~X', '~Y', '~MW'];
  const columnData = alignedSequencesColumn.toList().map((v, _) => AlignedSequenceEncoder.clean(v));

  const embcols = await createDimensinalityReducingWorker({data: columnData, metric: measure as StringMetrics}, method, cyclesCount);

  const columns = Array.from(
    embcols as Coordinates,
    (v: Float32Array, k) => (DG.Column.fromFloat32Array(axesNames[k], v)),
  );

  function _getMW(sequences = columnData) {
    const mw: Float32Array = new Float32Array(sequences.length).fill(0);
    let currentSequence;

    for (let i = 0; i < sequences.length; ++i) {
      currentSequence = sequences[i];
      mw[i] = currentSequence == null ? 0 : getSequenceMolecularWeight(currentSequence);
    }
    return mw;
  }

  columns.push(DG.Column.fromFloat32Array('~MW', _getMW()));

  const edf = DG.DataFrame.fromColumns(columns);

  // Add new axes.
  for (const axis of axesNames) {
    const col = table.col(axis);
    const newCol = edf.getCol(axis);

    if (col != null) {
      for (let i = 0; i < newCol.length; ++i) {
        const v = newCol.get(i);
        table.set(axis, i, v);
      }
    } else
      table.columns.insert(newCol);
  }

  const viewerOptions = {x: '~X', y: '~Y', color: activityColumnName ?? '~MW', size: '~MW'};
  const viewer = DG.Viewer.scatterPlot(table, viewerOptions);

  if (view !== null)
    view.addViewer(viewer);

  pi.close();
  return viewer;
}

/**
 * Controls creation of the peptide similarity space viewer.
 *
 * @export
 * @class PeptideSimilaritySpaceWidget
 */
export class PeptideSimilaritySpaceWidget {
  protected method: string;
  protected metrics: string;
  protected cycles: number = 100;
  protected currentDf: DG.DataFrame;
  protected alignedSequencesColumn: DG.Column;
  protected availableMethods: string[];
  protected availableMetrics: string[];
  protected viewer: HTMLElement;
  view: DG.TableView;

  /**
   * Creates an instance of PeptideSimilaritySpaceWidget.
   * @param {DG.Column} alignedSequencesColumn The column to get amino acid sequences from.
   * @param {DG.TableView} view Current view
   * @memberof PeptideSimilaritySpaceWidget
   */
  constructor(alignedSequencesColumn: DG.Column, view: DG.TableView) {
    this.availableMethods = DimensionalityReducer.availableMethods;
    this.availableMetrics = Measure.getMetricByDataType('String');
    this.method = this.availableMethods[0];
    this.metrics = this.availableMetrics[0];
    this.currentDf = alignedSequencesColumn.dataFrame;
    this.alignedSequencesColumn = alignedSequencesColumn;
    this.viewer = ui.div([]);
    this.view = view;
  }

  /**
   * Creates viewer itself.
   *
   * @return {Promise<DG.Viewer>} the viewer.
   * @memberof PeptideSimilaritySpaceWidget
   */
  public async drawViewer(): Promise<DG.Viewer> {
    const viewer = await createPeptideSimilaritySpaceViewer(
      this.currentDf,
      this.alignedSequencesColumn,
      this.method,
      this.metrics,
      this.cycles,
      null,
      null,
    );
    viewer.root.style.width = 'auto';
    return viewer;
  }

  /**
   * Updates the viewer on options changes.
   *
   * @protected
   * @memberof PeptideSimilaritySpaceWidget
   */
  protected async updateViewer() {
    const viewer = await this.drawViewer();
    this.viewer.lastChild?.remove();
    this.viewer.appendChild(viewer.root);
    viewer.dataFrame?.fireValuesChanged();
  }

  /**
   * Adds input controls to manage the viewer's parameters.
   *
   * @protected
   * @return {Promise<HTMLElement>} Bunch of control elements.
   * @memberof PeptideSimilaritySpaceWidget
   */
  protected async drawInputs(): Promise<HTMLElement> {
    const methodsList = ui.choiceInput('Embedding method', this.method, this.availableMethods,
      async (currentMethod: string) => {
        this.method = currentMethod;
        await this.updateViewer();
      },
    );
    methodsList.setTooltip('Embedding method to apply to the dataset.');

    const metricsList = ui.choiceInput('Distance metric', this.metrics, this.availableMetrics,
      async (currentMetrics: string) => {
        this.metrics = currentMetrics;
        await this.updateViewer();
      },
    );
    metricsList.setTooltip('Custom distance metric to pass to the embedding procedure.');

    const cyclesSlider = ui.intInput('Cycles count', this.cycles,
      async (currentCycles: number) => {
        this.cycles = currentCycles;
        await this.updateViewer();
      },
    );
    cyclesSlider.setTooltip('Number of cycles affects the embedding quality.');

    return ui.inputs([methodsList, metricsList, cyclesSlider]);
  }

  /**
   * Draws a viewer on property panel.
   *
   * @return {Promise<DG.Widget>} The corresponding widget.
   * @memberof PeptideSimilaritySpaceWidget
   */
  public async draw(): Promise<DG.Widget> {
    const plot = await this.drawViewer();
    const inputs = await this.drawInputs();
    const elements = ui.divV([plot.root, inputs]);

    // Move detaching scatterplot to the grid.
    plot.onEvent('d4-viewer-detached').subscribe((args) => {
      let found = false;

      for (const v of this.view.viewers) {
        const opts = v.getOptions() as {[name: string]: any};

        if (opts.type == 'Scatter plot' && opts.look.xColumnName == '~X' && opts.look.yColumnName == '~Y')
          found = true;
      }

      if (!found)
        this.view.addViewer(plot);
    });

    return new DG.Widget(elements);
  }
}

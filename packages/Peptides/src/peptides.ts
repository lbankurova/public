import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import {PeptideSimilaritySpaceViewer} from './utils/peptide-similarity-space';
import {addViewerToHeader} from './viewers/stacked-barchart-viewer';
import {model} from './model';
import {StringDictionary} from '@datagrok-libraries/utils/src/type-declarations';
// import $ from 'cash-dom';

/**
 * Peptides controller class.
 *
 * @export
 * @class Peptides
 */
export class Peptides {
  private static _model = model;

  static async recalculate() {
    await Peptides._model.updateDefault();
  }

  /**
   * Class initializer
   *
   * @param {DG.Grid} tableGrid Working talbe grid.
   * @param {DG.TableView} view Working view.
   * @param {DG.DataFrame} currentDf Working table.
   * @param {StringDictionary} options SAR viewer options
   * @param {DG.Column} col Aligned sequences column.
   * @param {string} activityColumnChoice Activity column name.
   * @memberof Peptides
   */
  async init(
    tableGrid: DG.Grid,
    view: DG.TableView,
    currentDf: DG.DataFrame,
    options: StringDictionary,
    col: DG.Column,
  ) {
    for (let i = 0; i < tableGrid.columns.length; i++) {
      const aarCol = tableGrid.columns.byIndex(i);
      if (aarCol &&
          aarCol.name &&
          aarCol.column?.semType != 'aminoAcids'
      ) {
        //@ts-ignore
        tableGrid.columns.byIndex(i)?.visible = false;
      }
    }

    const initialFiter = currentDf.filter.clone();
    const originalDfColumns = (currentDf.columns as DG.ColumnList).names();
    const originalDfName = currentDf.name;

    // const substViewer = view.addViewer(
    //   'substitution-analysis-viewer', {'activityColumnName': options['activityColumnName']},
    // );
    // const substNode = view.dockManager.dock(substViewer, DG.DOCK_TYPE.RIGHT, null, 'Substitution Analysis');

    // const layout1 = view.saveLayout();
    // view.dockManager.close(substNode);

    const helpUrl = '/help/domains/bio/peptides.md';

    const sarViewer = view.addViewer('peptide-sar-viewer', options);
    sarViewer.helpUrl = helpUrl;
    const sarNode = view.dockManager.dock(sarViewer, DG.DOCK_TYPE.DOWN, null, 'SAR Viewer');

    const sarViewerVertical = view.addViewer('peptide-sar-viewer-vertical');
    sarViewerVertical.helpUrl = helpUrl;
    const sarVNode = view.dockManager.dock(sarViewerVertical, DG.DOCK_TYPE.RIGHT, sarNode, 'SAR Vertical Viewer');
    const pspaceOptions = {
      alignedSequencesColumn: col,
      activityColumnName: `${options['activityColumnName']}Scaled`,
    };
    const peptideSpaceViewer = view.addViewer('peptide-space-viewer'/*, pspaceOptions*/);
    //await ((peptideSpaceViewer as PeptideSimilaritySpaceViewer).init(pspaceOptions));
    //const peptideSpaceViewer = await (new PeptideSimilaritySpaceViewer()).init(pspaceOptions);
    const psNode = view.dockManager.dock(peptideSpaceViewer, DG.DOCK_TYPE.LEFT, sarNode, 'Peptide Space Viewer', 0.3);
    //const layout2 = view.saveLayout();
    const nodeList = [sarNode, sarVNode, psNode];

    const StackedBarchartProm = currentDf.plot.fromType('StackedBarChartAA');
    addViewerToHeader(tableGrid, StackedBarchartProm);
    tableGrid.props.allowEdit = false;

    const hideIcon = ui.iconFA('window-close', () => { //undo?, times?
      const viewers = [];
      for (const viewer of view.viewers) {
        if (viewer.type !== DG.VIEWER.GRID)
          viewers.push(viewer);
      }
      viewers.forEach((v) => v.close());

      const cols = (currentDf.columns as DG.ColumnList);
      for (const colName of cols.names()) {
        if (!originalDfColumns.includes(colName))
          cols.remove(colName);
      }

      currentDf.selection.setAll(false);
      currentDf.filter.setAll(true);

      tableGrid.setOptions({'colHeaderHeight': 20});
      tableGrid.columns.setVisible(originalDfColumns);
      tableGrid.props.allowEdit = true;
      currentDf.name = originalDfName;

      view.setRibbonPanels(ribbonPanels);
    }, 'Close viewers and restore dataframe');

    let isSA = false;
    //TODO: fix layouts
    // const switchViewers = ui.iconFA('toggle-on', () => {
    //   if (isSA) {
    //     view.loadLayout(layout1);
    //     $(switchViewers).removeClass('fa-toggle-off');
    //     $(switchViewers).addClass('fa-toggle-on');
    //   } else {
    //     view.loadLayout(layout2);
    //     $(switchViewers).removeClass('fa-toggle-on');
    //     $(switchViewers).addClass('fa-toggle-off');
    //   }
    //   isSA = !isSA;
    // });
    const switchViewers = ui.iconFA('toggle-on', async () => {
      currentDf.filter.copyFrom(initialFiter);
      currentDf.selection.setAll(false);
      nodeList.forEach((node) => view.dockManager.close(node));
      nodeList.length = 0;
      if (isSA) {
        const sarViewer = view.addViewer('peptide-sar-viewer', options);
        sarViewer.helpUrl = helpUrl;
        const sarNode = view.dockManager.dock(sarViewer, DG.DOCK_TYPE.DOWN, null, 'SAR Viewer');

        const sarViewerVertical = view.addViewer('peptide-sar-viewer-vertical');
        sarViewerVertical.helpUrl = helpUrl;
        const sarVNode = view.dockManager.dock(sarViewerVertical, DG.DOCK_TYPE.RIGHT, sarNode, 'SAR Vertical Viewer');
        //const peptideSpaceViewer = DG.Viewer.fromType('peptide-space-viewer', currentDf);
        const peptideSpaceViewer = view.addViewer('peptide-space-viewer');
        await (peptideSpaceViewer as PeptideSimilaritySpaceViewer).init(pspaceOptions);
        //const peptideSpaceViewer = await (new PeptideSimilaritySpaceViewer()).init(pspaceOptions);
        //peptideSpaceViewer.helpUrl = helpUrl;

        const psNode = view.dockManager.dock(
          peptideSpaceViewer,
          DG.DOCK_TYPE.LEFT,
          sarNode,
          'Peptide Space Viewer',
          0.3,
        );

        nodeList.push(sarNode);
        nodeList.push(sarVNode);
        nodeList.push(psNode);

        $(switchViewers).removeClass('fa-toggle-off');
        $(switchViewers).addClass('fa-toggle-on');
      } else {
        const substViewer = view.addViewer(
          'substitution-analysis-viewer', {'activityColumnName': options['activityColumnName']},
        );
        substViewer.helpUrl = helpUrl;
        nodeList.push(view.dockManager.dock(substViewer, DG.DOCK_TYPE.DOWN, null, 'Substitution Analysis'));
        $(switchViewers).removeClass('fa-toggle-on');
        $(switchViewers).addClass('fa-toggle-off');
      }
      isSA = !isSA;
    });

    const ribbonPanels = view.getRibbonPanels();
    view.setRibbonPanels([[hideIcon, switchViewers]]);
    // view.setRibbonPanels([[hideIcon]]);
  }
}

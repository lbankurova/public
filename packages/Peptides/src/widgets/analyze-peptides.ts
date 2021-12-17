import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import {Peptides} from '../peptides';
import {correlationAnalysis} from '../viewers/correlation-analysis';

export async function analyzePeptidesWidget(
  col: DG.Column, view: DG.TableView, tableGrid: DG.Grid, currentDf: DG.DataFrame,
): Promise<DG.Widget> {
  let tempCol = null;
  for (const column of currentDf.columns.numerical) {
    tempCol = column.type === DG.TYPE.FLOAT ? column : null;
  }
  const defaultColumn: DG.Column = currentDf.col('activity') || currentDf.col('IC50') || tempCol;
  const histogramHost = ui.div([]);

  let hist: DG.Viewer;

  const activityScalingMethod = ui.choiceInput(
    'Activity scaling',
    'none',
    ['none', 'lg', '-lg'],
    async (currentMethod: string) => {
      const currentActivityCol = activityColumnChoice.value.name;
      const tempDf = currentDf.clone(currentDf.filter, [currentActivityCol]);
      //TODO: merge with scaling in describe
      switch (currentMethod) {
      case 'lg':
        await tempDf.columns.addNewCalculated('scaledActivity', 'Log10(${' + currentActivityCol + '})');
        break;
      case '-lg':
        await tempDf.columns.addNewCalculated('scaledActivity', '-1*Log10(${' + currentActivityCol + '})');
        break;
      default:
        await tempDf.columns.addNewCalculated('scaledActivity', '${' + currentActivityCol + '}');
        break;
      }
      hist = tempDf.plot.histogram({
        filteringEnabled: false,
        valueColumnName: 'scaledActivity',
        legendVisibility: 'Never',
        showXAxis: true,
        showColumnSelector: false,
        showRangeSlider: false,
      // bins: b,
      });
      histogramHost.lastChild?.remove();
      histogramHost.appendChild(hist.root);
    });
  activityScalingMethod.setTooltip('Function to apply for each value in activity column');

  const activityScalingMethodState = function(_: any) {
    activityScalingMethod.enabled =
      activityColumnChoice.value && DG.Stats.fromColumn(activityColumnChoice.value, currentDf.filter).min > 0;
    activityScalingMethod.fireChanged();
  };
  const activityColumnChoice = ui.columnInput(
    'Activity column',
    currentDf,
    defaultColumn,
    activityScalingMethodState,
  );
  activityColumnChoice.fireChanged();
  activityScalingMethod.fireChanged();

  grok.shell.info(activityScalingMethod.value);

  const startBtn = ui.button('Launch SAR', async () => {
    if (activityColumnChoice.value.type === DG.TYPE.FLOAT) {
      const progress = DG.TaskBarProgressIndicator.create('Loading SAR...');
      const options: {[key: string]: string} = {
        'activityColumnColumnName': activityColumnChoice.value.name,
        'activityScalingMethod': activityScalingMethod.value,
      };

      const peptides = new Peptides();
      await peptides.init(tableGrid, view, currentDf, options, col, activityColumnChoice.value.name);

      progress.close();
    } else {
      grok.shell.error('The activity column must be of floating point number type!');
    }
  });

  const startCABtn = ui.button('Launch CA', async () => {
    if (activityColumnChoice.value.type === DG.TYPE.FLOAT) {
      const progress = DG.TaskBarProgressIndicator.create('Loading correlation analysis...');

      await correlationAnalysis(
        tableGrid,
        view,
        currentDf,
        col,
        activityColumnChoice.value.name,
        activityScalingMethod.value,
      );

      progress.close();
    } else {
      grok.shell.error('The activity column must be of floating point number type!');
    }
  });
  /*correlationAnalysis(
    tableGrid,
    view,
    currentDf,
    col,
    activityColumnChoice.value.name,
    activityScalingMethod.value,
  ));*/

  const viewer = await currentDf.plot.fromType('peptide-logo-viewer');

  return new DG.Widget(
    ui.divV([
      viewer.root,
      ui.inputs([activityColumnChoice, activityScalingMethod]),
      startBtn,
      startCABtn,
      histogramHost,
    ]),
  );
}

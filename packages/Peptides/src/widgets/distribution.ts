import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

import * as C from '../utils/constants';
import {StringDictionary} from '@datagrok-libraries/utils/src/type-declarations';
import {FilteringStatistics} from '../utils/filtering-statistics';

export function getDistributionPlot(df: DG.DataFrame, valueCol: string, splitCol: string) {
  return df.plot.histogram({
    filteringEnabled: false,
    valueColumnName: valueCol,
    splitColumnName: splitCol,
    legendVisibility: 'Never',
    showXAxis: true,
    showColumnSelector: false,
    showRangeSlider: false,
  });
}

export function getDistributionWidget(table: DG.DataFrame): DG.Widget {
  const splitCol = table.col(C.COLUMNS_NAMES.SPLIT_COL);
  if (!splitCol)
    return new DG.Widget(ui.divText('No distribution'));
  let [aarStr, otherStr] = splitCol.categories;
  if (typeof otherStr === 'undefined')
    [aarStr, otherStr] = [otherStr, aarStr];
  const currentColor = DG.Color.toHtml(DG.Color.getCategoryColor(splitCol, aarStr));
  const otherColor = DG.Color.toHtml(DG.Color.getCategoryColor(splitCol, otherStr));

  const currentLabel = ui.label(aarStr, {style: {color: currentColor}});
  const otherLabel = ui.label(otherStr, {style: {color: otherColor}});
  const elements: (HTMLLabelElement | HTMLElement)[] = [currentLabel, otherLabel];

  const getContent = () => {
    const hist = getDistributionPlot(table, C.COLUMNS_NAMES.ACTIVITY_SCALED, C.COLUMNS_NAMES.SPLIT_COL).root;

    hist.style.width = 'auto';
    elements.push(hist);

    const stats = (table.temp[C.STATS] as FilteringStatistics).result;
    if (stats) {
      const tableMap: StringDictionary = {
        'Statistics:': '',
        'Count': stats.count.toString(),
        'p-value': stats.pValue < 0.01 ? '<0.01' : stats.pValue.toFixed(2),
        'Mean difference': stats.meanDifference.toFixed(2),
      };

      elements.push(ui.tableFromMap(tableMap));
    }
    return ui.divV(elements);
  };

  return new DG.Widget(getContent());
}

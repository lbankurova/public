import * as grok from 'datagrok-api/grok';
import * as DG from 'datagrok-api/dg';
import {after, before, category, expect, test} from '@datagrok-libraries/utils/src/test';
import wu from 'wu';


category('Docking', () => {
  let df: DG.DataFrame;
  let tv: DG.TableView;

  before(async () => {
    df = grok.data.demo.demog();
    tv = grok.shell.addTableView(df);
  });

  test('TableView.dockManager.dock', async () => {
    const viewer = df.plot.scatter();
    viewer.temp['test'] = true;
    expect(wu(tv.viewers).find((v) => v.temp['test']), undefined);
    tv.dockManager.dock(viewer, DG.DOCK_TYPE.DOWN);
    expect(wu(tv.viewers).find((v) => v.temp['test'])?.temp['test'], true);
  });

  after(async () => {
    tv.close();
    grok.shell.closeTable(df);
  });
});

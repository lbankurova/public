// This file may not be used in
import * as ui from 'datagrok-api/ui';
import * as grok from 'datagrok-api/grok';
import * as DG from 'datagrok-api/dg';
// The file is imported from a WebWorker. Don't use Datagrok imports
import {getRdKitModule, drawMoleculeToCanvas, getRdKitWebRoot} from '../utils/chem-common-rdkit';

let _alertsSmarts: string[] = [];
let _alertsDescriptions: string[] = [];
const _smartsMap: Map<string, any> = new Map();
let _data: string[] | null = null;


function loadAlertsCollection(smarts: string[]): void {
  _data = smarts;
  for (const currentSmarts of smarts)
    _smartsMap.set(currentSmarts, getRdKitModule().get_qmol(currentSmarts));
}

export async function getStructuralAlerts(smiles: string): Promise<number[]> {
  if (_data === null)
    await loadSADataset();
  const alerts: number[] = [];
  const mol = getRdKitModule().get_mol(smiles);
  //TODO: use SustructLibrary and count_matches instead. Currently throws an error on rule id 221
  // const lib = new _structuralAlertsRdKitModule.SubstructLibrary();
  // lib.add_smiles(smiles);
  for (let i = 0; i < _data!.length; i++) {
    const subMol = _smartsMap.get(_data![i]);
    // lib.count_matches(subMol);
    const matches = mol.get_substruct_matches(subMol);
    if (matches !== '{}')
      alerts.push(i);
  }
  mol.delete();
  return alerts;
}

export function initStructuralAlertsContext(
  alertsSmarts: string[], alertsDescriptions: string[]): void {
  _alertsSmarts = alertsSmarts;
  _alertsDescriptions = alertsDescriptions;
  loadAlertsCollection(_alertsSmarts);
  // await (await getRdKitService()).initStructuralAlerts(_alertsSmarts);
}

async function loadSADataset(): Promise<void> {
  const path = getRdKitWebRoot() + 'files/alert-collection.csv';
  const table = await grok.data.loadTable(path);
  const alertsSmartsList = table.columns.byName('smarts').toList();
  const alertsDescriptionsList = table.columns.byName('description').toList();
  initStructuralAlertsContext(alertsSmartsList, alertsDescriptionsList);
}

export async function structuralAlertsWidget(smiles: string): Promise<DG.Widget> {
  const alerts = await getStructuralAlerts(smiles);
  if (alerts.length === 0)
    return new DG.Widget(ui.divText('No alerts'));
  // await (await getRdKitService()).getStructuralAlerts(smiles); // getStructuralAlerts(smiles);
  const width = 200;
  const height = 100;
  const list = ui.div(alerts.map((i) => {
    const description = ui.divText(_alertsDescriptions[i]);
    const imageHost = ui.canvas(width, height);
    const r = window.devicePixelRatio;
    imageHost.width = width * r;
    imageHost.height = height * r;
    imageHost.style.width = width.toString() + 'px';
    imageHost.style.height = height.toString() + 'px';
    drawMoleculeToCanvas(0, 0, width * r, height * r, imageHost, smiles, _alertsSmarts[i]);
    const host = ui.div([description, imageHost], 'd4-flex-col');
    host.style.margin = '5px';
    return host;
  }), 'd4-flex-wrap');

  return new DG.Widget(list);
}

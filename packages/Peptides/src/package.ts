/* Do not change these import lines. Datagrok will import API library in exactly the same manner */
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';

import {
  AlignedSequenceCellRenderer,
  AminoAcidsCellRenderer,
} from './utils/cell-renderer';
import {Logo} from './viewers/logo-viewer';
import {StackedBarChart} from './viewers/stacked-barchart-viewer';
//import {MonomerLibrary} from './monomer-library';
import {analyzePeptidesWidget} from './widgets/analyze-peptides';
import {PeptideSimilaritySpaceWidget} from './utils/peptide-similarity-space';
import {manualAlignmentWidget} from './widgets/manual-alignment';
import {SARViewer, SARViewerVertical} from './viewers/sar-viewer';
import {peptideMoleculeWidget} from './widgets/peptide-molecule';
import {SubstViewer} from './viewers/subst-viewer';
import {runKalign} from './utils/multiple-sequence-alignment';
import {calcDescriptors} from './utils/rdkit-descriptors';

export const _package = new DG.Package();
let tableGrid: DG.Grid;
let currentDf: DG.DataFrame;
let alignedSequenceCol: DG.Column;
let view: DG.TableView;

async function main(chosenFile: string) {
  const pi = DG.TaskBarProgressIndicator.create('Loading Peptides');
  const path = _package.webRoot + 'files/' + chosenFile;
  const peptides = (await grok.data.loadTable(path));
  peptides.name = 'Peptides';
  peptides.setTag('dataType', 'peptides');
  const view = grok.shell.addTableView(peptides);
  tableGrid = view.grid;
  view.name = 'PeptidesView';
  grok.shell.windows.showProperties = true;

  pi.close();
}

//name: Peptides App
//tags: app
export async function Peptides() {
  const wikiLink = ui.link('wiki', 'https://github.com/datagrok-ai/public/blob/master/help/domains/bio/peptides.md');
  const textLink = ui.inlineText(['For more details, see our ', wikiLink, '.']);

  //const sdf = await _package.files.readAsText(`HELMMonomers_June10.sdf`);
  //const lib = new MonomerLibrary(sdf);

  const appDescription = ui.info(
    [
      ui.list([
        '- automatic recognition of peptide sequences',
        '- native integration with tons of Datagrok out-of-the box features (visualization, filtering, clustering, ' +
        'multivariate analysis, etc)',
        '- custom rendering in the spreadsheet',
        '- interactive logo plots',
        '- rendering residues',
        '- structure-activity relationship:',
        ' ',
        'a) highlighting statistically significant changes in activity in the [position, monomer] spreadsheet',
        'b) for the specific [position, monomer], visualizing changes of activity distribution (specific monomer in ' +
        'this position vs rest of the monomers in this position)',
        'c) interactivity',
      ]),
    ],
    'Use and analyse peptide sequence data to support your research:',
  );

  const windows = grok.shell.windows;
  windows.showToolbox = false;
  windows.showHelp = false;
  windows.showProperties = false;

  grok.shell.newView('Peptides', [
    appDescription,
    ui.info([textLink]),
    ui.divH([
      ui.button('Simple demo', () => main('aligned.csv'), ''),
      ui.button('Complex demo', () => main('aligned_2.csv'), ''),
    ]),
  ]);
}

//name: Peptides
//tags: panel, widgets
//input: column col {semType: alignedSequence}
//output: widget result
export async function peptidesPanel(col: DG.Column): Promise<DG.Widget> {
  if (col.getTag('isAnalysisApplicable') === 'false') {
    return new DG.Widget(ui.divText('Analysis is not applicable'));
  }
  view = (grok.shell.v as DG.TableView);
  tableGrid = view.grid;
  currentDf = col.dataFrame;
  alignedSequenceCol = col;
  return await analyzePeptidesWidget(col, view, tableGrid, currentDf);
}

//name: peptide-sar-viewer
//description: Peptides SAR Viewer
//tags: viewer
//output: viewer result
export function sar(): SARViewer {
  return new SARViewer();
}

//name: peptide-sar-viewer-vertical
//description: Peptides Vertical SAR Viewer
//tags: viewer
//output: viewer result
export function sarVertical(): SARViewerVertical {
  return new SARViewerVertical();
}

//name: substitution-analysis-viewer
//description: Substitution Analysis Viewer
//tags: viewer
//output: viewer result
export function subst(): SubstViewer {
  return new SubstViewer();
}

//name: StackedBarchart Widget
//tags: panel, widgets
//input: column col {semType: aminoAcids}
//output: widget result
export async function stackedBarchartWidget(col: DG.Column): Promise<DG.Widget> {
  const viewer = await col.dataFrame.plot.fromType('StackedBarChartAA');
  const panel = ui.divH([viewer.root]);
  return new DG.Widget(panel);
}

//name: Peptide Molecule
//tags: panel, widgets
//input: string peptide {semType: alignedSequence}
//output: widget result
export async function peptideMolecule(peptide: string): Promise<DG.Widget> {
  return await peptideMoleculeWidget(peptide);
}

//name: StackedBarChartAA
//tags: viewer
//output: viewer result
export function stackedBarChart(): DG.JsViewer {
  return new StackedBarChart();
}

//name: alignedSequenceCellRenderer
//tags: cellRenderer, cellRenderer-alignedSequence
//meta-cell-renderer-sem-type: alignedSequence
//output: grid_cell_renderer result
export function alignedSequenceCellRenderer() {
  return new AlignedSequenceCellRenderer();
}

//name: aminoAcidsCellRenderer
//tags: cellRenderer, cellRenderer-aminoAcids
//meta-cell-renderer-sem-type: aminoAcids
//output: grid_cell_renderer result
export function aminoAcidsCellRenderer() {
  return new AminoAcidsCellRenderer();
}

//name: peptide-logo-viewer
//tags: viewer, panel
//output: viewer result
export function logov() {
  return new Logo();
}

//name: Manual Alignment
//tags: panel, widgets
//input: string monomer {semType: aminoAcids}
//output: widget result
export function manualAlignment(monomer: string) {
  return manualAlignmentWidget(alignedSequenceCol, currentDf);
}

//name: Peptide Space
//tags: panel, widgets
//input: column col {semType: alignedSequence}
//output: widget result
export async function peptideSpacePanel(col: DG.Column): Promise<DG.Widget> {
  const widget = new PeptideSimilaritySpaceWidget(col, view ?? grok.shell.v);
  return await widget.draw();
}

//name: Molfile
//tags: panel, widgets
//input: string peptide { semType: alignedSequence }
//output: widget result
/*export async function peptideMolfile(peptide: string): Promise<DG.Widget> {
  const smiles = getMolecule(peptide);
  return await grok.functions.call('Chem:molfile', {'smiles': smiles});
}*/

//name: Multiple sequence alignment
//tags: panel
//input: column col {semType: alignedSequence}
//output: dataframe result
export async function multipleSequenceAlignment(col: DG.Column): Promise<DG.DataFrame> {
  const msaCol = await runKalign(col, true);
  const table = col.dataFrame;
  table.columns.add(msaCol);
  return table;
}

//name: Calculate RDKit descriptors
//tags: viewer
//input: dataframe table
//input: column col
//output: dataframe result
export async function calcRDKitDescriptors(table: DG.DataFrame, col: DG.Column): Promise<DG.DataFrame> {
  const newCol = await calcDescriptors(col);
  table.columns.add(newCol);
  const fps = await grok.functions.call('chem:getMorganFingerprints', {molColumn: newCol});
  /*const fps = await grok.functions.call('ChemFingerprints', {
    table: table.name,
    smiles: col.name,
    fingerprinter: 'Morgan/Circular',
    parameters: {'nBits': 2048, 'useChirality': false, 'useBondTypes': true, 'useFeatures': false, 'radius': 1},
  });*/
  console.log(fps);
  return table;
}

//name: Calculate RDKit descriptors
//tags: viewer
//output: dataframe result
export async function testCalcRDKitDescriptors(): Promise<DG.DataFrame> {
  const table = await grok.data.files.openTable('Demo:TestJobs:Files:DemoFiles/bio/peptides.csv');
  //grok.shell.addTableView(table);
  //table.rows.removeAt(0, 600);
  return calcRDKitDescriptors(table, table.getCol('AlignedSequence'));
}

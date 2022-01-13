// This file will be used from Web Workers, so there
// should be no imports from Datagrok or OCL
//@ts-ignore
import rdkitLibVersion from './rdkit_lib_version';
import {RdKitService} from './rdkit-service';
import {convertToRDKit} from './analysis/r-group-analysis';
//@ts-ignore
import initRDKitModule from './RDKit_minimal.js';

export let _rdKitModule: any = null;
export let _rdKitService: RdKitService | null = null;
export let _webRoot: string | null;
let serviceInitialized = false;
let serviceBeingInitialized = false;
let moduleInitialized = false;

export function setRdKitWebRoot(webRootValue: string) {
  _webRoot = webRootValue;
}

export async function initRdKitModuleLocal() {
  _rdKitModule = await initRDKitModule(
    {locateFile: () => `${_webRoot}/dist/${rdkitLibVersion}.wasm`});
  _rdKitModule.prefer_coordgen(false);
  console.log('RDKit module package instance was initialized');
  moduleInitialized = true;
}

export async function initRdKitService() {
  if (!serviceBeingInitialized && !serviceInitialized) {
    serviceBeingInitialized = true;
    _rdKitService = new RdKitService();
    await _rdKitService.init(_webRoot!);
    console.log('RDKit Service was initialized');
    serviceInitialized = true;
    serviceBeingInitialized = false;
  }
}

export async function waitInitRdKitService(timeout = 1) {
  while (!serviceInitialized) {
    await new Promise(resolve => setTimeout(resolve, timeout));
  }
}

export function getRdKitModule() {
  if (!moduleInitialized)
    throw ('RdKit Module is not initialized');
  return _rdKitModule!;
}

export async function getRdKitService() {
  initRdKitService();
  await waitInitRdKitService();
  if (!serviceInitialized)
    throw ('RdKit Service is not initialized');
  return _rdKitService!;
}

export function getRdKitWebRoot() {
  return _webRoot;
}

export function drawRdKitMoleculeToOffscreenCanvas(
  rdkitMol: any, w: number, h: number, offscreenCanvas: OffscreenCanvas, substruct: Object | null) {
  const opts = {
    'clearBackground': false,
    'offsetx': 0, 'offsety': 0,
    'width': Math.floor(w), 'height': Math.floor(h),
    'bondLineWidth': 1,
    'fixedScale': 0.07,
    'minFontSize': 9,
    'highlightBondWidthMultiplier': 12,
    'dummyIsotopeLabels': false,
    'atomColourPalette': {
      16: [0.498, 0.247, 0.0],
      9: [0.0, 0.498, 0.0],
      17: [0.0, 0.498, 0.0],
    },
  };
  if (substruct)
    Object.assign(opts, substruct);
  rdkitMol.draw_to_canvas_with_highlights(offscreenCanvas, JSON.stringify(opts));
  // we need the offscreen canvas first to not let the molecule scaffold skew on a real canvas
}


export function drawMoleculeToCanvas(
  x: number, y: number, w: number, h: number,
  onscreenCanvas: HTMLCanvasElement, molString: string, scaffoldMolString: string | null = null) {
  let mol = null;
  try {
    mol = getRdKitModule().get_mol(convertToRDKit(molString));
    const molBlock = mol.get_new_coords(true);
    mol.delete();
    mol = getRdKitModule().get_mol(molBlock);
    mol.normalize_2d_molblock();
    mol.straighten_2d_layout();
    const scaffoldMol = scaffoldMolString == null ? null :
      getRdKitModule().get_qmol(convertToRDKit(scaffoldMolString));
    let substructJson = '{}';
    if (scaffoldMol) {
      substructJson = mol.get_substruct_match(scaffoldMol);
      if (substructJson === '')
        substructJson = '{}';
    }
    const substruct = JSON.parse(substructJson);
    let offscreenCanvas = new OffscreenCanvas(w, h);
    drawRdKitMoleculeToOffscreenCanvas(mol, w, h, offscreenCanvas, substruct);
    const image = offscreenCanvas!.getContext('2d')!.getImageData(0, 0, w, h);
    const context = onscreenCanvas.getContext('2d')!;
    context.putImageData(image, x, y);
  } finally {
    mol?.delete();
  }
}
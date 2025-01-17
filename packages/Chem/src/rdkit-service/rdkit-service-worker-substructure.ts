import {RdKitServiceWorkerSimilarity} from './rdkit-service-worker-similarity';
import {rdKitFingerprintToBitArray} from '../utils/chem-common';
import BitArray from '@datagrok-libraries/utils/src/bit-array';
import {isMolBlock} from '../utils/chem-utils';
import {RDModule} from "../rdkit-api";

export class RdKitServiceWorkerSubstructure extends RdKitServiceWorkerSimilarity {
  _patternFps: BitArray[] | null = null;
   readonly _patternFpLength = 2048;

   constructor(module: RDModule, webRoot: string) {
    super(module, webRoot);
  }

  initMoleculesStructures(dict: string[], normalizeCoordinates: boolean, usePatternFingerprints: boolean) {
    this.freeMoleculesStructures();
    this.freeMorganFingerprints();
    if (dict.length === 0)
      return;
    this._rdKitMols = [];
    if (usePatternFingerprints)
      this._patternFps = [];
    const hashToMolblock: {[_:string] : any} = {};
    const molIdxToHash = [];
    for (let i = 0; i < dict.length; ++i) {
      let item = dict[i];
      let mol = null;
      let fp: BitArray | null = null;
      if (usePatternFingerprints)
        fp = new BitArray(this._patternFpLength);
      try {
        mol = this._rdKitModule.get_mol(item);
        if (usePatternFingerprints) {
          const fpRdKit = mol.get_pattern_fp_as_uint8array(this._patternFpLength);
          fp = rdKitFingerprintToBitArray(fpRdKit);
        }
        if (normalizeCoordinates) {
          if (isMolBlock(item)) {
            mol.normalize_depiction();
            item = mol.compute_hash();
            mol.straighten_depiction();
            if (!hashToMolblock[item])
              hashToMolblock[item] = mol.get_molblock();
          }
        }
      } catch (e) {
        console.error('Chem | Possibly a malformed molString: `' + item + '`');
        // preserving indices with a placeholder
        mol?.delete();
        mol = this._rdKitModule.get_mol('');
        // Won't rethrow
      }
      this._rdKitMols.push(mol);
      if (this._patternFps)
        this._patternFps.push(fp!);
      if (normalizeCoordinates)
        molIdxToHash.push(item);
    }
    return {molIdxToHash, hashToMolblock};
  }

  searchSubstructure(queryMolString: string, querySmarts: string): string {
    const matches: number[] = [];
    if (this._rdKitMols) {
      try {
        let queryMol = null;
        try {
          try {
            queryMol = this._rdKitModule.get_mol(queryMolString, '{"mergeQueryHs":true}');
          } catch (e2) {
            queryMol?.delete();
            queryMol = null;
            if (querySmarts !== null && querySmarts !== '') {
              console.log('Chem | Cannot parse a MolBlock. Switching to SMARTS');
              queryMol = this._rdKitModule.get_qmol(querySmarts);
            } else
              throw new Error('Chem | SMARTS not set');
          }
          if (queryMol && queryMol.is_valid()) {
            if (this._patternFps) {
              const fpRdKit = queryMol.get_pattern_fp_as_uint8array(this._patternFpLength);
              const queryMolFp = rdKitFingerprintToBitArray(fpRdKit);
              for (let i = 0; i < this._patternFps.length; ++i) {
                const crossedFp = BitArray.fromAnd(this._patternFps[i], queryMolFp);
                if (crossedFp.equals(queryMolFp))
                  if (this._rdKitMols[i]!.get_substruct_match(queryMol) !== '{}') // Is patternFP iff?
                    matches.push(i);
              }
            } else {
              for (let i = 0; i < this._rdKitMols!.length; ++i)
                if (this._rdKitMols[i]!.get_substruct_match(queryMol) !== '{}')
                  matches.push(i);
            }
          }
        } finally {
          queryMol?.delete();
        }
      } catch (e) {
        console.error(
          'Possibly a malformed query: `' + queryMolString + '`');
        // Won't rethrow
      }
    }
    return '[' + matches.join(', ') + ']';
  }

  freeMoleculesStructures(): void {
    if (this._rdKitMols !== null) {
      for (let mol of this._rdKitMols!)
        mol.delete();
      this._rdKitMols = null;
    }
    this._patternFps = null;
  }
}

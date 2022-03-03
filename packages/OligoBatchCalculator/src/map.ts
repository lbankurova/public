export const SYNTHESIZERS = {
  RAW_NUCLEOTIDES: 'Raw Nucleotides',
  BIOSPRING: 'BioSpring Codes',
  GCRS: 'Janssen GCRS Codes',
  AXOLABS: 'Axolabs Codes',
  MERMADE_12: 'Mermade 12',
};
export const TECHNOLOGIES = {
  DNA: 'DNA',
  RNA: 'RNA',
  ASO_GAPMERS: 'For ASO Gapmers',
  SI_RNA: 'For 2\'-OMe and 2\'-F modified siRNA',
};
export const individualBases: {[index: string]: number} = {
  'dA': 15400, 'dC': 7400, 'dG': 11500, 'dT': 8700, 'rA': 15400, 'rC': 7200, 'rG': 11500, 'rU': 9900,
};
export const nearestNeighbour: {[firstBase: string]: {[secondBase: string]: number}} = {
  'dA': {'dA': 27400, 'dC': 21200, 'dG': 25000, 'dT': 22800, 'rA': 27400, 'rC': 21000, 'rG': 25000, 'rU': 24000},
  'dC': {'dA': 21200, 'dC': 14600, 'dG': 18000, 'dT': 15200, 'rA': 21000, 'rC': 14200, 'rG': 17800, 'rU': 16200},
  'dG': {'dA': 25200, 'dC': 17600, 'dG': 21600, 'dT': 20000, 'rA': 25200, 'rC': 17400, 'rG': 21600, 'rU': 21200},
  'dT': {'dA': 23400, 'dC': 16200, 'dG': 19000, 'dT': 16800, 'rA': 24600, 'rC': 17200, 'rG': 20000, 'rU': 19600},
  'rA': {'rA': 27400, 'rC': 21000, 'rG': 25000, 'rU': 24000, 'dA': 27400, 'dC': 21200, 'dG': 25000, 'dT': 22800},
  'rC': {'rA': 21000, 'rC': 14200, 'rG': 17800, 'rU': 16200, 'dA': 21200, 'dC': 14600, 'dG': 18000, 'dT': 15200},
  'rG': {'rA': 25200, 'rC': 17400, 'rG': 21600, 'rU': 21200, 'dA': 25200, 'dC': 17600, 'dG': 21600, 'dT': 20000},
  'rU': {'rA': 24600, 'rC': 17200, 'rG': 20000, 'rU': 19600, 'dA': 23400, 'dC': 16200, 'dG': 19000, 'dT': 16800},
};
export const map: {
  [synthesizer: string]: {
    [technology: string]: {
      [code: string]: {
        name: string,
        weight: number,
        normalized: string
      }
    }
  }
} = {
  'BioSpring Codes': {
    'For ASO Gapmers': {
      '5': {
        name: '2\'MOE-5Me-rU',
        weight: 378.27,
        normalized: 'rU',
      },
      '6': {
        'name': '2\'MOE-rA',
        'weight': 387.29,
        'normalized': 'rA',
      },
      '7': {
        'name': '2\'MOE-5Me-rC',
        'weight': 377.29,
        'normalized': 'rC',
      },
      '8': {
        'name': '2\'MOE-rG',
        'weight': 403.28,
        'normalized': 'rG',
      },
      '9': {
        'name': '5-Methyl-dC',
        'weight': 303.21,
        'normalized': 'dC',
      },
      '*': {
        'name': 'ps linkage',
        'weight': 16.07,
        'normalized': '',
      },
      'A': {
        'name': 'Adenine',
        'weight': 313.21,
        'normalized': 'dA',
      },
      'C': {
        'name': 'Cytosine',
        'weight': 289.18,
        'normalized': 'dC',
      },
      'G': {
        'name': 'Guanine',
        'weight': 329.21,
        'normalized': 'dG',
      },
      'T': {
        'name': 'Tyrosine',
        'weight': 304.2,
        'normalized': 'dT',
      },
    },
    'For 2\'-OMe and 2\'-F modified siRNA': {
      '1': {
        'name': '2\'-fluoro-U',
        'weight': 308.16,
        'normalized': 'rU',
      },
      '2': {
        'name': '2\'-fluoro-A',
        'weight': 331.2,
        'normalized': 'rA',
      },
      '3': {
        'name': '2\'-fluoro-C',
        'weight': 307.18,
        'normalized': 'rC',
      },
      '4': {
        'name': '2\'-fluoro-G',
        'weight': 347.19,
        'normalized': 'rG',
      },
      '5': {
        'name': '2\'OMe-rU',
        'weight': 320.2,
        'normalized': 'rU',
      },
      '6': {
        'name': '2\'OMe-rA',
        'weight': 343.24,
        'normalized': 'rA',
      },
      '7': {
        'name': '2\'OMe-rC',
        'weight': 319.21,
        'normalized': 'rC',
      },
      '8': {
        'name': '2\'OMe-rG',
        'weight': 359.24,
        'normalized': 'rG',
      },
      '*': {
        'name': 'ps linkage',
        'weight': 16.07,
        'normalized': '',
      },
    },
  },
  'Axolabs Codes': {
    'For 2\'-OMe and 2\'-F modified siRNA': {
      'Uf': {
        'name': '2\'-fluoro-U',
        'weight': 308.16,
        'normalized': 'rU',
      },
      'Af': {
        'name': '2\'-fluoro-A',
        'weight': 331.2,
        'normalized': 'rA',
      },
      'Cf': {
        'name': '2\'-fluoro-C',
        'weight': 307.18,
        'normalized': 'rC',
      },
      'Gf': {
        'name': '2\'-fluoro-G',
        'weight': 347.19,
        'normalized': 'rG',
      },
      'u': {
        'name': '2\'OMe-rU',
        'weight': 320.2,
        'normalized': 'rU',
      },
      'a': {
        'name': '2\'OMe-rA',
        'weight': 343.24,
        'normalized': 'rA',
      },
      'c': {
        'name': '2\'OMe-rC',
        'weight': 319.21,
        'normalized': 'rC',
      },
      'g': {
        'name': '2\'OMe-rG',
        'weight': 359.,
        'normalized': 'rG',
      },
      's': {
        'name': 'ps linkage',
        'weight': 16.07,
        'normalized': '',
      },
    },
  },
  'Janssen GCRS Codes': {
    'For ASO Gapmers': {
      'moeT': {
        'name': '2\'MOE-5Me-rU',
        'weight': 378.27,
        'normalized': 'rU',
      },
      'moeA': {
        'name': '2\'MOE-rA',
        'weight': 387.29,
        'normalized': 'rA',
      },
      'moe5mC': {
        'name': '2\'MOE-5Me-rC',
        'weight': 377.29,
        'normalized': 'rC',
      },
      '(5m)moeC': {
        'name': '2\'MOE-5Me-rC',
        'weight': 377.29,
        'normalized': 'rC',
      },
      'moeG': {
        'name': '2\'MOE-rG',
        'weight': 403.28,
        'normalized': 'rG',
      },
      '5mC': {
        'name': '5-Methyl-dC',
        'weight': 303.28,
        'normalized': 'dC',
      },
      '(5m)C': {
        'name': '5-Methyl-dC',
        'weight': 303.28,
        'normalized': 'dC',
      },
      'ps': {
        'name': 'ps linkage',
        'weight': 16.07,
        'normalized': '',
      },
      'A': {
        'name': 'Adenine',
        'weight': 313.21,
        'normalized': 'dA',
      },
      'dA': {
        'name': 'Adenine',
        'weight': 313.21,
        'normalized': 'dA',
      },
      'C': {
        'name': 'Cytosine',
        'weight': 289.18,
        'normalized': 'dC',
      },
      'dC': {
        'name': 'Cytosine',
        'weight': 289.18,
        'normalized': 'dC',
      },
      'G': {
        'name': 'Guanine',
        'weight': 329.21,
        'normalized': 'dG',
      },
      'dG': {
        'name': 'Guanine',
        'weight': 329.21,
        'normalized': 'dG',
      },
      'T': {
        'name': 'Tyrosine',
        'weight': 304.2,
        'normalized': 'dT',
      },
      'dT': {
        'name': 'Tyrosine',
        'weight': 304.2,
        'normalized': 'dT',
      },
      'rA': {
        'name': 'Adenine',
        'weight': 329.21,
        'normalized': 'rA',
      },
      'rC': {
        'name': 'Cytosine',
        'weight': 305.18,
        'normalized': 'rC',
      },
      'rG': {
        'name': 'Guanine',
        'weight': 345.21,
        'normalized': 'rG',
      },
      'rU': {
        'name': 'Uracil',
        'weight': 306.17,
        'normalized': 'rU',
      },
    },
    'For 2\'-OMe and 2\'-F modified siRNA': {
      'fU': {
        'name': '2\'-fluoro-U',
        'weight': 308.16,
        'normalized': 'rU',
      },
      'fA': {
        'name': '2\'-fluoro-A',
        'weight': 331.2,
        'normalized': 'rA',
      },
      'fC': {
        'name': '2\'-fluoro-C',
        'weight': 307.18,
        'normalized': 'rC',
      },
      'fG': {
        'name': '2\'-fluoro-G',
        'weight': 347.19,
        'normalized': 'rG',
      },
      'mU': {
        'name': '2\'OMe-rU',
        'weight': 320.2,
        'normalized': 'rU',
      },
      'mA': {
        'name': '2\'OMe-rA',
        'weight': 343.24,
        'normalized': 'rA',
      },
      'mC': {
        'name': '2\'OMe-rC',
        'weight': 319.21,
        'normalized': 'rC',
      },
      'mG': {
        'name': '2\'OMe-rG',
        'weight': 359.24,
        'normalized': 'rG',
      },
      'ps': {
        'name': 'ps linkage',
        'weight': 16.07,
        'normalized': '',
      },
    },
  },
};

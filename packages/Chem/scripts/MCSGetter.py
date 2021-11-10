#name: MCSGetter
#language: python
#input: string smiles
#input: dataframe df1
#output: string result

from rdkit import Chem
from rdkit.Chem import rdFMCS
import numpy as np

def np_none(shape):
  return np.full(shape, None, dtype=object)

smiles = df1[smiles].tolist()
length = len(smiles)
mols = np_none(length)
idx_err = []
for n in range(0, length):
  mol = Chem.MolFromSmiles(smiles[n])
  if mol is None:
    idx_err.append(n)
    continue
  mols[n] = mol
mols = mols[mols != np.array(None)]
result = Chem.MolToSmiles(Chem.MolFromSmarts(rdFMCS.FindMCS(mols).smartsString))
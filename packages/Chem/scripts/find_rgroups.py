#name: FindRGroups
#language: python
#input: string smiles
#input: dataframe df
#input: string core
#input: string prefix
#output: dataframe result

from rdkit import Chem
import numpy as np
import re

result = {}
smiles = df[smiles].tolist()
length = len(smiles)
core = Chem.MolFromSmiles(core)
if core is not None:
  fragments = dict()
  r_group = 1
  r_group_map = dict()
  for n in range(0, length):
    mol = Chem.MolFromSmiles(smiles[n])
    if mol is None:
      continue
    mol_no_core = Chem.ReplaceCore(mol, core, labelByIndex=True)
    if mol_no_core is not None:
      try:
        fragments_ = list(Chem.GetMolFrags(mol_no_core, asMols=True))
      except:
        fragments_ = []
    else:
      fragments_ = []
    fragments_len = len(fragments_)
    # for fragment in fragments_:
    for m in range(len(fragments_)):
      fragment = fragments_[m]
      fragment_smiles = Chem.MolToSmiles(fragment)
      # id = fragment_smiles[:fragment_smiles.find(']')+1]

      id = ''
      match = re.search(r"\[\d+\*\]", fragment_smiles)
      if match is None:
        match = re.search(r"\*", fragment_smiles)
      if match is not None:
        id = match.group(0)
        
      group = f'{prefix}{r_group}'
      if id not in r_group_map:
        r_group_map[id] = [group]
        fragments[r_group_map[id][-1]] = np.full(length, None, dtype=object)
        r_group += 1

      none_group = None
      for g in r_group_map[id]:
        if fragments[g][n] is not None:
          continue
        none_group = g
        break

      if none_group is None:
        r_group_map[id].append(group)
        fragments[r_group_map[id][-1]] = np.full(length, None, dtype=object)
        none_group = group
        r_group += 1

      fragment_smiles = re.sub(r"\[\d+\*\]", f'[{r_group_map[id][0]}]', fragment_smiles)
      fragment_smiles = re.sub(r"\*", f'[{r_group_map[id][0]}]', fragment_smiles)

      fragments[none_group][n] = fragment_smiles
else:
  raise Exception('Core is empty')
result = pd.DataFrame.from_dict(fragments)

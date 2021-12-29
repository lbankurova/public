#name: Butina Molecules Clustering
#description: Implementation of the clustering algorithm published in: Butina JCICS 39 747-750 (1999)
#help-url: https://datagrok.ai/help/domains/chem/functions/butina-cluster
#language: python
#sample: chem/smiles_coordinates.csv
#tags: demo, chem, rdkit
#input: dataframe data [Input data table]
#input: column smiles {type:categorical, semType: Molecule} [Molecules, in SMILES format]
#output: dataframe clusters {action:join(data)} [Clusters]

import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem


def cluster_fingerprints(fingerprints, cutoff=0.2):
    from rdkit import DataStructs
    from rdkit.ML.Cluster import Butina

    dists = []
    length = len(fingerprints)
    for i in range(1, length):
        sims = DataStructs.BulkTanimotoSimilarity(fingerprints[i], fingerprints[:i])
        dists.extend([1 - x for x in sims])

    return Butina.ClusterData(dists, length, cutoff, isDistData=True)

smiles = data[smiles]
mols = [Chem.MolFromSmiles(smile) for smile in smiles if smile is not None]
fingerprints = [AllChem.GetMorganFingerprintAsBitVect(mol, 2, 1024) for mol in mols]
groups = cluster_fingerprints(fingerprints, cutoff=0.4)

clusters = np.zeros(len(mols), dtype=np.int32)
for n in range(0, len(groups)):
    idxs = list(groups[n])
    clusters[idxs] = np.ones(len(idxs)) * n

# Convert to Pandas DataFrame
clusters = pd.DataFrame(clusters, columns=['clusters'])

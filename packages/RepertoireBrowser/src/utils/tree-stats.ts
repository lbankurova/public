//@ts-ignore
import {Utils, Newick} from '@phylocanvas/phylocanvas.gl';

/**
 * Analyses Newick-formatted strings containing phylogenetic trees.
 */
export class TreeAnalyzer {
  static newickRegEx = new RegExp(/^(\(*[^:]+:[^,]+\)*)+$/);

  protected _items: Set<string>;
  protected _inspectors: TreeNodeInspector[];
  protected _isect: NodeIdsIntersection;
  protected _currentTreeIndex: number;

  /**
   * Creates an instance of TreeAnalyzer.
   * @param {string[]} [items=[]] Items to intersect tree leaves with.
   */
  constructor(items: string[] = []) {
    this._items = new Set(items);
    this._inspectors = [];
    this._isect = new NodeIdsIntersection(items);
    this._currentTreeIndex = 0;
    this.addNodeInspector(this._isect.apply.bind(this._isect));
  }

  /**
   * Adds tree node inspector.
   * @param {TreeNodeInspector} inspector Callback to inspect/modify a tree node.
   */
  addNodeInspector(inspector: TreeNodeInspector) {
    this._inspectors.push(inspector);
  }

  /**
   * Sets items which find against of.
   * @param {string[]} items Items to intersect with.
   */
  set items(items: string[]) {
    this._items = new Set(items);
  }

  /**
   * Gets items which find against of.
   * @return {Set<string>} Items.
   */
  getItemsAsSet(): Set<string> {
    return this._items;
  }

  /**
   * Traverses the tree and optionally calls node observing callbacks.
   * @param {PhylocanvasTreeNode} root Root of the tree.
   */
  protected _traverseTree(root: PhylocanvasTreeNode) {
    const traversal: PhylocanvasTreeTraversal = Utils.treeTraversal(root);
    const nodes = traversal.postorderTraversal;

    for (const node of nodes) {
      let modifiedNode = node;

      for (const obs of this._inspectors)
        modifiedNode = obs(modifiedNode, this._currentTreeIndex);
    }
  }

  /**
   * Calculates selected nodes statistics.
   * @param {PhylocanvasTreeNode} root Root node to get total stats.
   * @param {string[]} selectedIds List of nodes id to count.
   * @return {TreeStats} Statistics.
   */
  private _calcStats(root: PhylocanvasTreeNode, selectedIds: string[]): TreeStats {
    return {
      totalLeaves: root.totalLeaves,
      leavesIntersected: selectedIds.length,
      totalSubtreeLength: root.totalSubtreeLength,
    };
  }

  /**
   * Analyses a single tree read from Newick-formatted string.
   * @param {string} nwk Newick string encoding phylogenetic tree.
   * @return {TreeStats} Simple statistics on nodes of the parsed tree.
   */
  private _analyseTree(nwk: string): TreeStats {
    let stats = _nullStats;

    if (TreeAnalyzer.newickRegEx.test(nwk.trim())) {
      const tree = Newick.parse_newick(nwk);

      this._isect.reset();
      this._traverseTree(tree);
      stats = this._calcStats(tree, this._isect.result);
    }
    return stats;
  }

  /**
   * Collects statistics on trees.
   * @param {string[]} trees Trees in Newick format to anslyse.
   * @return {TreeStatColumns} Tree statistics.
   */
  analyze(trees: string[]): TreeStatColumns {
    const stats: TreeStatColumns = {
      totalLeaves: [],
      leavesIntersected: [],
      totalSubtreeLength: [],
    };
    const statsKeys = Object.keys(stats);

    for (let i = 0; i < trees.length; ++i) {
      this._currentTreeIndex = i;

      const nwk = trees[i];
      const s = this._analyseTree(nwk);

      for (const k of statsKeys)
        stats[k].push(s[k]);
    }
    return stats;
  }
}

/**
 * Calculates if a node id is found inside the given subset in lazy way.
 * Collects each id found in the subset into a list.
 */
class NodeIdsIntersection {
  private _isect: string[];
  private _items: Set<string>;

  /**
   * Creates an instance of NodeIdsIntersection.
   * @param {string[]} items Items to consider as the source set.
   */
  constructor(items: string[]) {
    this._isect = [];
    this._items = new Set<string>(items);
  }

  /**
   * Resets intersection list.
   */
  reset() {
    this._isect = [];
  }

  /**
   * Performs test if the node is found in the source subset.
   * @param {PhylocanvasTreeNode} node Node to test.
   * @param {number} treeIndex Index of this node's tree.
   * @return {PhylocanvasTreeNode} Modified node.
   */
  apply(node: PhylocanvasTreeNode, treeIndex: number) {
    if (node.isLeaf && this._items.has(node.id))
      this._isect.push(node.id);
    return node;
  }

  /**
   * Returns the resulting intersection.
   */
  get result(): string[] {
    return this._isect;
  }
}

// TODO: add test for these properties existing.
/**
 * Represents a single tree node.
 */
export interface PhylocanvasTreeNode {
  branchLength: 0;
  children: PhylocanvasTreeNode[];
  id: string;
  isCollapsed: boolean;
  isHidden: boolean;
  isLeaf: boolean
  name: string;
  postIndex: number;
  preIndex: number;
  totalLeaves: number;
  totalNodes: number;
  totalSubtreeLength: number;
  visibleLeaves: number;
}

/**
 * Represents simple tree statistics.
 */
interface TreeStats {
  totalLeaves: number;
  leavesIntersected: number;
  totalSubtreeLength: number;
}

const _nullStats: TreeStats = {
  totalLeaves: 0,
  leavesIntersected: 0,
  totalSubtreeLength: 0,
};

// TODO: add test for these properties existing.
/**
 * Represents tree traversal object.
 * @interface PhylocanvasTreeTraversal
 */
interface PhylocanvasTreeTraversal{
    nodeById: TreeNodeTraverseInfo;
    rootNode: PhylocanvasTreeNode;
    postorderTraversal: PhylocanvasTreeNode[];
    preorderTraversal: PhylocanvasTreeNode[];
}

type TreeStatsKeys = keyof TreeStats;
// eslint-disable-next-line no-unused-vars
type TreeStatColumns = {[key in TreeStatsKeys]: number[]};
type TreeNodeTraverseInfo = {[id: string]: PhylocanvasTreeNode};
type TreeNodeInspector = (node: PhylocanvasTreeNode, treeIndex: number) => PhylocanvasTreeNode;

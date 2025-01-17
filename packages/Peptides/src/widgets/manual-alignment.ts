import * as ui from 'datagrok-api/ui';
import * as grok from 'datagrok-api/grok';
import * as DG from 'datagrok-api/dg';

import $ from 'cash-dom';
import '../styles.css';
import {PeptidesController} from '../peptides';

/**
 * Manual sequence alignment widget.
 *
 * @param {DG.Column} alignedSequenceCol Aligned sequence column.
 * @param {DG.DataFrame} currentDf Working table.
 * @return {DG.Widget} Widget for manual sequence alignment.
 */
export function manualAlignmentWidget(alignedSequenceCol: DG.Column, currentDf: DG.DataFrame) {
  const sequenceInput = ui.textInput('', alignedSequenceCol.get(currentDf.currentRowIdx));
  $(sequenceInput.root).addClass('pep-textinput');

  const applyChangesBtn = ui.button('Apply', async () => {
    const newSequence = sequenceInput.value;
    const affectedRowIndex = currentDf.currentRowIdx;
    const [splitSequence] = PeptidesController.splitAlignedPeptides(
      DG.Column.fromStrings('splitSequence', [newSequence]), false);

    alignedSequenceCol.set(affectedRowIndex, newSequence);
    for (const part of splitSequence.columns) {
      if (currentDf.col(part.name) !== null)
        currentDf.set(part.name, affectedRowIndex, part.get(0));
    }
    const temp = grok.shell.o;
    grok.shell.o = null;
    grok.shell.o = temp;

    const peptidesController = await PeptidesController.getInstance(currentDf);
    peptidesController.init(currentDf);
    peptidesController.updateDefault();
  });

  const resetBtn = ui.button(
    ui.iconFA('redo'),
    () => sequenceInput.value = alignedSequenceCol.get(currentDf.currentRowIdx),
    'Reset',
  );
  $(resetBtn).addClass('pep-snippet-editor-icon pep-reset-icon');

  return new DG.Widget(ui.divV([resetBtn, sequenceInput.root, applyChangesBtn], 'pep-textarea-box'));
}

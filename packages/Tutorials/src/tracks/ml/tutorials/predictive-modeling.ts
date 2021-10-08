import * as grok from 'datagrok-api/grok';
import * as DG from 'datagrok-api/dg';
import * as ui from 'datagrok-api/ui';
import $ from 'cash-dom';
import { fromEvent, interval } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Tutorial } from '../../../tutorial';


export class PredictiveModelingTutorial extends Tutorial {
  get name() {
    return 'Predictive Modeling';
  }
  get description() {
    return 'Predictive modeling is a statistical technique used to predict outcomes based on historical data.';
  }
  get steps() { return 23; }

  helpUrl: string = 'https://datagrok.ai/help/learn/predictive-modeling';

  private async buttonClickAction(root: HTMLElement, instructions: string, caption: string, description: string = '') {
    const btn = $(root).find('button.ui-btn').filter((idx, btn) => btn.textContent === caption)[0];
    if (btn == null) return;
    const source = fromEvent(btn, 'click');
    await this.action(instructions, source, btn, description);
  };

  private async columnInpAction(root: HTMLElement, instructions: string, caption: string, value: string, description: string = '') {
    const columnInput = $(root)
      .find('div.ui-input-root.ui-input-column')
      .filter((idx, inp) => $(inp).find('label.ui-label.ui-input-label')[0]?.textContent === caption)[0];
    if (columnInput == null) return;
    const source = interval(1000).pipe(
      map((_) => $(columnInput).find('div.d4-column-selector-column')[0]?.textContent),
      filter((val) => val === value));
    await this.action(instructions, source, columnInput, description);
  };

  private async columnsInpAction(root: HTMLElement, instructions: string, caption: string, value: string, description: string = '') {
    const columnsInput = $(root)
      .find('div.ui-input-root.ui-input-columns')
      .filter((idx, inp) => $(inp).find('label.ui-label.ui-input-label')[0]?.textContent === caption)[0];
    if (columnsInput == null) return;
    const source = interval(1000).pipe(
      map((_) => $(columnsInput).find('div.ui-input-editor > div.ui-input-column-names')[0]?.textContent),
      filter((val) => val === value));
    await this.action(instructions, source, columnsInput, description);
  };

  protected async _run() {
    this.describe('Predictive modeling is a statistical technique used to predict outcomes ' +
      'based on historical data. In the next steps, we will train a few models, look at their ' +
      'performance, learn how to apply a model to a dataset and share it with others, and ' +
      'lastly, compare the models we have trained.');

    this.describe(ui.link('More about ' + this.name, this.helpUrl).outerHTML); 

    /** Train model actions */
    const trainModel = async (method: string, skipPMVOpening = false): Promise<void> => {
      const pmv = await this.openViewByType(
        skipPMVOpening ? 'Return to the model training view' :
        'Click on "ML | Train Model..." to open a dialog for training models',
        'PredictiveModel',
      );

      // UI generation delay
      if (!skipPMVOpening) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const viewInputAction = async (instructions: string, caption: string, value: string, description: string = '') => {
        let inputRoot: HTMLDivElement;
        let select: HTMLSelectElement;
        $(pmv.root).find('.ui-input-root .ui-input-label span').each((idx, el) => {
          if (el.innerText == caption) {
            inputRoot = el.parentElement?.parentElement as HTMLDivElement;
            select = $(inputRoot).find('select')[0] as HTMLSelectElement;
          }
        });
        const source = fromEvent(select!, 'change');
        await this.action(instructions,
          source.pipe(map((event: any) => select.value), filter((v: string) => v === value)),
          inputRoot!, description);
      };

      const hasNulls = this.t!.columns
        .byNames(['AGE', 'HEIGHT', 'WEIGHT'])
        .some((col: DG.Column) => col?.stats.missingValueCount > 0);

      //await viewInputAction('Set "Table" to "demog"', 'Table', 'demog');
      await this.columnInpAction(pmv.root, 'Set "Predict" to "SEX"', 'Predict', 'SEX');
      const missingValuesWarning = 'You will see that the column names are highlighted in red. ' +
        'Click on the question mark to the right of the input to see a warning message. It says ' +
        'that some of the columns contain missing values, and suggests two ways to address this. ' +
        'Let\'s use missing values imputation.';
      await this.columnsInpAction(pmv.root, 'Set "Features" to ["AGE", "HEIGHT", "WEIGHT"]',
        'Features', '(3) AGE, HEIGHT, WEIGHT', hasNulls ? missingValuesWarning : '');

      if (hasNulls) {
        const dlg = await this.openDialog('Click on "Missing values imputation"', 'Missing Values Imputation');

        await this.dlgInputAction(dlg, 'Set "Table" to "demog"', 'Table', 'demog');
        await this.dlgInputAction(dlg, 'Choose ["AGE", "HEIGHT", "WEIGHT"] for "Impute"', 'Impute', 'AGE,HEIGHT,WEIGHT');
        await this.dlgInputAction(dlg, 'Set "Data" to "DIS_POP"', 'Data', 'DIS_POP');
        await this.dlgInputAction(dlg, 'Set the number of nearest neighbors to "5"', 'Nearest Neighbours', '5');
  
        await this.action('Click "OK" and wait for the values to be calculated.',
          grok.functions.onAfterRunAction.pipe(
            filter((call: DG.FuncCall) => call.func.name === 'MissingValuesImputation'),
          ));
      }

      await viewInputAction(`Set "Method" to "${method}"`, 'Method', method);
      await this.buttonClickAction(pmv.root, 'Click the "Train" button', 'TRAIN');
    };

    this.title('Train a model');
    await trainModel('Distributed Random Forest');

    this.title('Model performance, application, and sharing');

    const funcPane = grok.shell.sidebar.getPane('Functions');
    const funcPaneHints = [funcPane.header, $(funcPane.content)
      .find(`div.d4-toggle-button[data-view=${DG.View.MODELS}]`)[0]!];

    const pmBrowserDescription = 'This is Predictive Models Browser. Here, you can browse ' +
      'models that you trained or that were shared with you. In the next steps, we will look ' +
      'at model performance, apply a model to a dataset, and share the model.';

    await this.openViewByType('Click on "Functions | Models" to open the Models Browser',
      DG.View.MODELS, funcPaneHints, pmBrowserDescription);

    const ppDescription = 'Search for the model you trained (applicable models are always at the ' +
      'top of the list, also, you can search for it by the previously defined name). Now, select ' +
      'the model by clicking on it and open "Performance" at the property panel on the right.';

    await this.action('Find model performance data',
      // TODO: check if acc.context instanceof DG.Model && acc.context?.name === modelName
      grok.events.onAccordionConstructed.pipe(
        map((acc) => acc.getPane('Performance')?.expanded),
        filter((v) => v === true)),
      null, ppDescription);

    await this.contextMenuAction('Right-click on the trained model and select "Apply to | ' +
      `${this.t!.toString()}"`, this.t!.toString(), null, 'The result will be available in ' +
      'the selected table as a column named "Outcome". Check it out in the opened table view.');

    await this.contextMenuAction('Right-click on the model and select "Share...".', 'Share...',
      null, 'The model you trained is only visible to you, but it is easy to share it with other ' +
      'users from this dialog: just add a few users (e.g., "All users") and click "OK".');

    this.title('Compare models');

    await trainModel('Gradient Boosting Machine', true);
    await this.openViewByType('Click on "Functions | Models" to open the Models Browser',
      DG.View.MODELS, funcPaneHints);

    await this.action('Find the trained models and compare them',
      grok.events.onViewAdded.pipe(filter((view) => view.name == 'Compare models')),
      $('div.d4-accordion-pane-header').filter((idx, el) => el.textContent == 'Commands')[0],
      'Search for the trained models and select them holding <b>Shift</b>. ' +
      'Then run the "Compare" command given at the property panel.');
  }
}

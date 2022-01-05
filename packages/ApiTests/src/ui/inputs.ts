import { after, before, category, delay, expect, test } from "../test";
import * as grok from 'datagrok-api/grok';
import * as ui from 'datagrok-api/ui';
import * as DG from 'datagrok-api/dg';
import { caption, enabled, checkHTMLElement } from './utils';


category('UI: Inputs', () => {
  let v: DG.View;
  let t = grok.data.testData('demog', 100);
  let tables = grok.shell.tables;
  const inputs = {
    'stringInput': ui.stringInput('', ''),
    'intInput': ui.intInput('', 0),
    'floatInput': ui.floatInput('', 0.00),
    'boolInput': ui.boolInput('', true),
    'switchInput': ui.switchInput('', true),
    'choiceInput': ui.choiceInput('', '1', ['1', '2', '3']),
    'multiChoiceInput': ui.multiChoiceInput('', [], []),
    'dateInput': ui.dateInput('', DG.DateTime.fromDate(new Date(2000, 1, 1))),
    'textInput': ui.textInput('', ''),
    'searchInput': ui.searchInput('', ''),
    'columnInput': ui.columnInput('', t, t.col('age')),
    'columnsInput': ui.columnsInput('', t),
    'tableInput': ui.tableInput('', tables[0], tables)
  };

  before(async () => {
    v = grok.shell.newView('');
  });

  test('input.root', async () => {
    for (const [key, value] of Object.entries(inputs)) {
      checkHTMLElement(key, value.root, v, '.ui-input-root');
    }
  })

  test('input.input', async () => {
    for (const [key, value] of Object.entries(inputs)) {
      checkHTMLElement(key, value.root, v, '.ui-input-editor');
    }
  })

  test('input.captionLabel', async () => {
    for (const [key, value] of Object.entries(inputs)) {
      checkHTMLElement(key, value.root, v, '.ui-input-label');
    }
  })

  test('input.caption', async () => {
    for (const [key, value] of Object.entries(inputs)) {
      caption(key, value, v, '.ui-input-label');
    }
  })

  test('input.stringValue', async () => {
    for (const [key, value] of Object.entries(inputs)) {
      stringValue(key, value, '.ui-input-editor');
    }
  })

  test('input.ebabled', async () => {
    for (const [key, value] of Object.entries(inputs)) {
      enabled(key, value, v, '.ui-input-root');
    }
  })

  test('input.readOnly', async () => {
    for (const [key, value] of Object.entries(inputs)) {
      readonly(key, value, 'input[readonly], input[disabled]');
    }
  })

  test('input.onChanged', async () => {
    for (const [key, value] of Object.entries(inputs)) {
      switch (key) {
        case 'stringInput': case 'textInput': case 'searchInput':
          onChanged(key, value, 'test')
          break;
        case 'intInput': case 'floatInput':
          onChanged(key, value, 100)
          break;
        case 'boolInput': case 'switchInput':
          onChanged(key, value, false)
          break;
        case 'dateInput': case 'switchInput':
          onChanged(key, value, DG.DateTime.fromDate(new Date()))
          break;
        case 'choiceInput': case 'switchInput':
          onChanged(key, value, '2')
          break;
        case 'columnInput': case 'switchInput':
          onChanged(key, value, t.col('height'))
          break;
        case 'columnsInput': case 'switchInput':
          onChanged(key, value, [t.col('height'), t.col('weight')])
          break;
        case 'tableInput': case 'switchInput':
          grok.shell.addTableView(grok.data.demo.demog());
          grok.shell.addTableView(grok.data.demo.randomWalk());
          onChanged(key, value, [t.col('height'), t.col('weight')])
          break;
      }
    }

  })

  after(async () => {
    v.close();
    grok.shell.closeAll();
  });

  function stringValue(name: string, input: DG.InputBase, selector: string): void {
    v.root.innerHTML = '';
    v.append(input.root);
    let value: string;
    try {
      switch (name) {
        case 'multiChoiceInput':
          let node = v.root.querySelectorAll('.ui-input-multi-choice-checks>div');
          value = (<HTMLInputElement>v.root.querySelector('.ui-input-label')).innerText;
          for (let i = 0; i < node.length; i++) {
            let input = (<HTMLInputElement>node[i].querySelector('input'));
            if (input.checked)
              value = value.concat((<HTMLInputElement>node[i].querySelector('.ui-label')).innerText)
          }
          expect(input.stringValue, value);
          break;
        case 'columnInput':
          value = (<HTMLInputElement>v.root.querySelector('.d4-column-selector-column')).innerText;
          expect(input.stringValue, value);
          break;
        case 'columnsInput':
          value = (<HTMLInputElement>v.root.querySelector('.ui-input-column-names')).innerText.substring(3);
          expect(input.stringValue, value);
          break;
        default:
          value = (<HTMLInputElement>v.root.querySelector(selector)).value;
          expect(input.stringValue, value);
          break;
      }
    }
    catch (x) {
      throw name + ': ' + x;
    }
    finally {
      input.root.remove();
    }
  }

  function readonly(name: string, input: DG.InputBase, selector: string): void {
    v.append(input.root);
    let value: boolean = false;
    input.readOnly = true;
    try {
      if (input.input.tagName == 'INPUT') {
        if (v.root.querySelector(selector))
          value = true;
        expect(input.readOnly, value);
      }
    }
    catch (x) {
      throw name + ': ' + x;
    }
    finally {
      input.readOnly = false;
      input.root.remove();
    }
  }

  function onChanged(name: string, input: DG.InputBase, newVal: any): void {
    v.append(input.root);
    let value = input.value;

    let changed = false;
    input.value = newVal;
    input.onChanged(function () {
      changed = true;
    })

    input.fireChanged();

    if (changed == false)
      throw `"${name}": OnChange value error`;

    input.value = value;
    input.fireChanged();
    input.root.remove();
  }

});
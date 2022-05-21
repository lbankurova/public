import * as DG from 'datagrok-api/dg';
import * as grok from 'datagrok-api/grok';
import {category, expect, test} from "@datagrok-libraries/utils/src/test";

category('DataFrame', () => {
  test('create from arrays', async () => {
    let t = DG.DataFrame.fromColumns([
      DG.Column.fromList('int', 'int', [1, 2, 3]),
      DG.Column.fromList('double', 'double', [1.1, 2.1, 3.1]),
      DG.Column.fromList('string', 'string', ["a", "b", "c"]),
      DG.Column.fromList('object', 'object', [{}, null, {a: 1, b: 2}])
    ]);
  });

  test('create from columns', async () => {
    let t = DG.DataFrame.create(3);
    t.columns.add(DG.Column.fromStrings('countries', ['USA', 'Canada', 'Mexico']));
    t.columns.add(DG.Column.fromStrings('population', ['321', '35', '121']));
  });

  test('create from csv', async () => {
    let table = DG.DataFrame.fromCsv(
      `make, model,    cylinders, volume, price
Honda, Civic,    4,         1.4,    15000
Honda, Accord,   6,         1.8,    20000
BMW,   328i,     4,         1.7,    60000
BMW,   535i,     6,         1.5,    35000
Tesla, Roadster, ,          1.6,    100000
Tesla, Model S,  ,          1.6,    120000`);
  });

  test('create from json', async () => {
    let table = DG.DataFrame.fromJson(`[
  {
    "name": "Roger Federer",
    "height": 185,
    "born": "August 8, 1981"
  },
  {
    "name": "Rafael Nadal",
    "height": 185,
    "born": "June 3, 1986"
  }
]`);
  });

  test('create from typed arrays', async () => {
    let table = DG.DataFrame.fromColumns([
      DG.Column.fromInt32Array('ints', new Int32Array(100)),
      DG.Column.fromFloat32Array('floats', new Float32Array(100))
    ]);
  });

  //creation of dataframes used in testing
  let df1 = DG.DataFrame.create(2);
  df1.columns.add(DG.Column.fromStrings('countries', ['USA', 'Canada']));
  df1.columns.add(DG.Column.fromInt32Array('population', Int32Array.from([1, 4])));
  let df2 = DG.DataFrame.create(2);
  df2.columns.add(DG.Column.fromStrings('countries', ['France', 'Mexico']));
  df2.columns.add(DG.Column.fromInt32Array('population', Int32Array.from([2, 3])));
  let df = DG.DataFrame.create(4);
  df.columns.add(DG.Column.fromStrings('countries', ['USA', 'Canada', 'France', 'Mexico']));
  df.columns.add(DG.Column.fromInt32Array('population', Int32Array.from([1, 4, 2, 3])));

  test('append method', async () => {
    df1.append(df2);
    //expect(df1.append(df2), df);
  });

  test('cell method', async () => {
    //df.cell(1, 'countries');
    expect(df1.cell(1, 'countries').toString(), 'countries : 1');
  });

  test('get method', async () => {
    expect(df.get('countries', 1), 'Canada');
  });

  test('change column type method', async () => {
    df1.changeColumnType('countries', 'int');
    expect(typeof(df1.get('countries', 1)), 'number');
  });

  test('col method', async () => {
    let res = df1.col('population')?.getRawData();
    expect(res?.toString(), "1,4");
  });

  test('getcol method', async () => {
    let res = df1.getCol('population').getRawData();
    expect(res.toString(), "1,4");
  });

  test('get sorted order method', async () => {
    const arr: object[] = [];
    arr.push(df.columns.names()[1]);
    let order = df.getSortedOrder(arr);
    expect(order.toString(), '0,2,3,1');
  });

  test('get table info', async () => {
    return df1.getTableInfo();
  });

  test('toString method', async () => {
    expect(typeof(df1.getCol('population').getRawData().toString()), 'string');
  });

  test('toCsv method', async () => {
    return df1.toCsv();
  });

  test('set method', async () => {
    df1.set("population", 1, 5);
    expect(5, df1.get("population", 1));
  });

  test('get density method', async () => {
    let t = DG.DataFrame.create(3);
    t.columns.add(DG.Column.fromInt32Array('numbers', Int32Array.from([1, 4, 2])));
    t.columns.add(DG.Column.fromInt32Array('digits', Int32Array.from([2, 1, 3])));
    let res = t.getDensity(4, 2, 'numbers', 'digits');
    return res;
  });

  test('set tag method and get tag method', async () => {
    df1.columns.byName('population').setTag('units', 'm');
    expect('m', df1.columns.byName('population').getTag('units'));
  });

  test('column list add', async () => {
    df1.columns.add(DG.Column.fromInt32Array('popularity', Int32Array.from([12, 10])));
    let res = df1.columns.byName('popularity').getRawData();
    expect(res.toString(), '12,10');
  });

  test('column list addNew', async () => {
    df.columns.addNew('newColumn', 'string');
    expect(typeof(df.get('newColumn', 1)), 'string');
  });

  test('column list addNewBool', async () => {
    df.columns.addNewBool('newColumn');
    expect(typeof(df.get('newColumn', 1)), 'boolean');
  });

  test('column list addNewDateTime', async () => {
    return df.columns.addNewDateTime('newColumn');
  });

  test('column list addNewFloat', async () => {
    df.columns.addNewFloat('newColumn');
    expect(typeof(df.get('newColumn', 1)), 'number');
  });

  test('column list addNewInt', async () => {
    df.columns.addNewInt('newColumn');
    expect(typeof(df.get('newColumn', 1)), 'number');
  });

  test('column list addNewQnum', async () => {
    df.columns.addNewQnum('newColumn');
    expect(typeof(df.get('newColumn', 1)), 'number');
  });

  test('column list addNewString', async () => {
    df.columns.addNewString('newColumn');
    expect(typeof(df.get('newColumn', 1)), 'string');
  });

  test('column list byIndex', async () => {
    expect(df.columns.byIndex(1).getRawData().toString(), '1,4,2,3');
  });

  test('column list byName', async () => {
    expect(df.columns.byName('population').getRawData().toString(), '1,4,2,3');
  });

  test('column list bySemType', async () => {
    df1.onSemanticTypeDetected.subscribe((_) => {
      let res = df1.columns.bySemType('country');
      expect(res.toString(), 'countries');
    });
  });

  test('column list bySemTypeAll', async () => {
    df1.onSemanticTypeDetected.subscribe((_) => {
      let res = df1.columns.bySemTypeAll('country');
      expect(res.toString(), 'countries');
    });
  });

  test('column list contains', async () => {
    expect(df.columns.contains('population'), true);
  });

  test('column list getUnusedName', async () => {
    expect(df.columns.getUnusedName('population').toString(), 'population (2)')
  });

  test('column list insert', async () => {
    let newColumn = DG.Column.fromStrings('data', ['12', '34']);
    df1.columns.insert(newColumn);
    expect(df1.get('data', 1).toString(), '34');
  });

  test('column list names', async () => {
    expect(df.columns.names().toString(), 'countries,population');
  });

  test('column list remove', async () => {
    df.columns.remove('population');
    expect(df.columns.names().toString(), 'countries');
  });

  test('column list replace', async () => {
    let newColumn = DG.Column.fromStrings('data', ['12', '34']);
    df1.columns.replace('countries', newColumn);
    expect(df1.columns.names().toString(), 'data,population');
  });

  test('column list toList', async () => {
    return df1.columns.toList();
  });

  test('column list toString', async () => {
    return df1.columns.toString();
  });

  test('row list addNew', async () => {
    df1.rows.addNew(['12', '23']);
    expect(df1.get('countries', 2).toString(), '12');
  });

  test('row list filter', async () => {
    return df1.rows.filter((row) => row.countries === 'USA');
  });

  test('row list insertAt', async () => {
    df1.rows.insertAt(2, 2);
    expect(df1.get('countries', 2), '');
  });

  test('row list match', async () => {
    return df1.rows.match('countries = USA').highlight();
  });

  test('row list removeAt', async () => {
    df.rows.removeAt(1, 1);
    expect(df.get('countries', 1).toString(), 'France');
  });

  test('row list select', async () => {
    return df1.rows.select((row) => row.countries === 'USA');
  });

  test('row list setValues', async () => {
    let t = DG.DataFrame.create(3);
    t.columns.add(DG.Column.fromStrings('countries', ['USA', 'Canada', 'Mexico']));
    t.columns.add(DG.Column.fromStrings('population', ['321', '35', '121']));
    t.rows.setValues(2, ['France', '435']);
    expect(t.get('countries', 2).toString(), 'France');
  });
});

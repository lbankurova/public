import * as grok from "datagrok-api/grok";

export let tests: {[key: string]: {tests?: Test[], before?: () => Promise<void>, after?: () => Promise<void>, beforeStatus?: string, afterStatus?: string}} = {};

export let currentCategory: string;

export namespace assure {

  export function notNull(value: any, name?: string) {
    if (value == null)
      throw `${name == null ? 'Value' : name} not defined`;
  }
}

export interface TestOptions {
  timeout? : number;
  unhandledExceptionTimeout? : number;
}

export class Test {
  test: () => Promise<any>;
  name: string;
  category: string;
  options?: TestOptions;

  constructor(category: string, name: string, test: () => Promise<any>, options?: TestOptions) {
    this.category = category;
    this.name = name;
    options ??= {};
    options.timeout ??= 30000;
    options.unhandledExceptionTimeout ??= 2000;
    this.options = options;
    this.test = async (): Promise<any> => {
      return new Promise(async (resolve, reject) => {
        let result = '';
        try {
          grok.shell.lastError = '';
          result = await test();
        } catch (e: any) {
          reject(e);
        }
        if (!(await assertNoError(options!.unhandledExceptionTimeout!)))
          reject(`Unhandled exception during test: ${grok.shell.lastError}`);
        resolve(result);
      });
    };
  }
}

export function test(name: string, test: () => Promise<any>, options?: TestOptions): void {
  if (tests[currentCategory] == undefined)
    tests[currentCategory] = {};
  if (tests[currentCategory].tests == undefined)
    tests[currentCategory].tests = [];
  tests[currentCategory].tests!.push(new Test(currentCategory, name, test, options));
}

/** Awaits for a while checking the error status of the platform */
export async function assertNoError(ms: number): Promise<boolean> {
  for (let i = 0; i < ms / 500; ++i) {
    await delay(500);
    if (grok.shell.lastError.length !== 0)
      return false;
  }
  return true;
}

/** Tests two objects for equality, throws an exception if they are not equal. */
export function expect(actual: any, expected: any): void {
  if (actual !== expected)
    throw new Error(`Expected "${expected}", got "${actual}"`);
}

export function expectFloat(actual: number, expected: number, tolerance = 0.001): void {
  const areEqual = Math.abs(actual - expected) < tolerance;
  if (!areEqual)
    throw new Error(`Expected ${expected}, got ${actual} (tolerance = ${tolerance})`);
}

export function expectObject(actual: {[key: string]: any}, expected: {[key: string]: any}) {
  for (const [expectedKey, expectedValue] of Object.entries(expected)) {
    if (!actual.hasOwnProperty(expectedKey))
      throw new Error(`Expected property "${expectedKey}" not found`);

    const actualValue = actual[expectedKey];
    if (actualValue instanceof Array && expectedValue instanceof Array)
      expectArray(actualValue, expectedValue);
    else if (actualValue instanceof Object && expectedValue instanceof Object)
      expectObject(actualValue, expectedValue);
    else if (actualValue != expectedValue)
      throw new Error(`Expected ${expectedValue} for key ${expectedKey}, got ${actualValue}`);
  }
}

export function expectArray(actual: any[], expected: any[]) {
  const actualLength = actual.length;
  const expectedLength = expected.length;

  if (actualLength != expectedLength) {
      throw new Error(`Arrays are of different length: actual array length is ${actualLength} ` +
        `and expected array length is ${expectedLength}`);
  }

  for (let i = 0; i < actualLength; i++) {
    if (actual[i] instanceof Array && expected[i] instanceof Array) {
      expectArray(actual[i], expected[i]);
    } else if (actual[i] instanceof Object && expected[i] instanceof Object) {
      expectObject(actual[i], expected[i]);
    } else if (actual[i] != expected[i]) { 
      throw new Error(`Expected ${expected[i]} at position ${i}, got ${actual[i]}`);   
    }
  }
}

/** Defines a test suite. */
export function category(category: string, tests: () => void): void {
  currentCategory = category;
  tests();
}

/** Defines a function to be executed before the tests in this category are executed. */
export function before(before: () => Promise<void>): void {
  if (tests[currentCategory] == undefined)
    tests[currentCategory] = {};
  tests[currentCategory].before = before;
}

/** Defines a function to be executed after the tests in this category are executed. */
export function after(after: () => Promise<void>): void {
  if (tests[currentCategory] == undefined)
    tests[currentCategory] = {};
  tests[currentCategory].after = after;
}


export async function runTests(options?: {category?: string, test?: string}) {
  let results: { category?: string, name?: string, success: boolean, result: string}[] = [];

  for (const [key, value] of Object.entries(tests)) {
    if (options?.category != undefined) {
      if (!key.toLowerCase().startsWith(options?.category.toLowerCase()))
        continue;
    }
    try {
      if (value.before)
        await value.before();
    } catch (x: any) {
      value.beforeStatus = x.toString();
    }
    let t = value.tests ?? [];
    let res = [];
    for(let i = 0; i < t.length; i++) {
      res.push(await execTest(t[i], options?.test));
    }

    let data = (await Promise.all(res)).filter((d) => d.result != 'skipped');
    try {
      if (value.after)
        await value.after();
    } catch (x: any) {
      value.afterStatus = x.toString();
    }
    if (value.afterStatus)
      data.push({category: key, name: 'init', result: value.afterStatus, success: false});
    if (value.beforeStatus)
      data.push({category: key, name: 'init', result: value.beforeStatus, success: false});
    results.push(...data);
  }

  return results;
}

async function execTest(t: Test, predicate: string | undefined) {
  let r: { category?: string, name?: string, success: boolean, result: string };
  try {
    if (predicate != undefined && (!t.name.toLowerCase().startsWith(predicate.toLowerCase())))
      r = {success: true, result: 'skipped'};
    else
      r = {success: true, result: await t.test() ?? 'OK'};
  } catch (x: any) {
    r = {success: false, result: x.toString()};
  }
  r.category = t.category;
  r.name = t.name;
  return r;
}

/** Waits [ms] milliseconds */
export async function delay(ms: number) {
  await new Promise(r => setTimeout(r, ms));
}

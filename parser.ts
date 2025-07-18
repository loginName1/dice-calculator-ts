import { Dice } from './dice'; // adjust path as needed

type DiceOperation = ((this: Dice, other: Dice | number) => Dice) & { unary?: boolean };


export function parse(expression: string, n: number = 0): Dice {
  const cleaned = expression.replace(/ /g, '').toLowerCase();
  const chars = [...cleaned]; // same as Array.from(cleaned)

  const result = parseExpression(chars, n);
  if (chars.length > 0) {
    throw new Error(`Unexpected token: '${chars[0]}'`);
  }
  return result;
}

function parseExpression(arr: string[], n: number): Dice {
  const result = (() => {
    const res = parseArgument(arr, n);
    return typeof res === 'number' ? Dice.scalar(res) : res;
  })();

  let op = parseOperation(arr);
  let finalResult = result;

  while (op != null) {
    const arg = !op.unary ? parseArgument(arr, n) : finalResult;

    // Handle crit (e.g. xcrit, crit)
    let crit: Dice | undefined;
    let critNorm = 1;
    if (arr[0] === 'x' || arr[0] === 'c') {
      const isXcrit = arr[0] === 'x';
      if (isXcrit) assertToken(arr, 'x');
      assertToken(arr, 'c');
      assertToken(arr, 'r');
      assertToken(arr, 'i');
      assertToken(arr, 't');

      const count = isXcrit ? parseNumber(arr, n) : 1;

      crit = new Dice();
      for (let i = 0; i < count; i++) {
        const max = finalResult.maxFace();
        crit.setFace(max, finalResult.get(max));
        finalResult = finalResult.deleteFace(max);
      }

      critNorm = crit.total();
      crit = op.call(crit, parseBinaryArgument(arg, arr, n));
      critNorm = critNorm ? crit.total() / critNorm : 1;
    }

    // Handle save
    let save: Dice | undefined;
    var saveNorm = 1;
    if (arr[0] === 's') {
      assertToken(arr, 's');
      assertToken(arr, 'a');
      assertToken(arr, 'v');
      assertToken(arr, 'e');

      save = new Dice();
      const min = finalResult.minFace();
      save.increment(min > 0 ? min : 1, finalResult.get(min));

      saveNorm = save.total();
      finalResult = finalResult.deleteFace(min);
      save = op.call(save, parseBinaryArgument(arg, arr, n));
      saveNorm = saveNorm ? save.total() / saveNorm : 1;
    }

    var norm = finalResult.total();
    // logging
    console.log(`OP: ${op.name || '[anonymous]'}`);
    
    finalResult = op.call(finalResult, arg);
    finalResult = finalResult.normalize(norm ? finalResult.total() / norm : 1);

    if (crit) {
      crit = crit.normalize(norm ? finalResult.total() / norm : 1);
      finalResult = finalResult.normalize(critNorm);
      finalResult = finalResult.combine(crit);
      norm *= critNorm
    }
    if (save) {
      save = save.normalize(norm ? finalResult.total() / norm : 1);
      finalResult = finalResult.normalize(saveNorm);
      finalResult = finalResult.combine(save);
      norm *= saveNorm;
    }

    op = parseOperation(arr);
  }

  return finalResult;
}

function parseArgument(s: string[], n: number): Dice | number {
  let result = parseArgumentInternal(s, n);

  while (true) {
    const next = parseArgumentInternal(s, n);
    if (next === undefined) break;

    result = multiplyDiceByDice(result as Dice | number, next);
  }

  return result as Dice | number;
}

function multiplyDiceByDice(d1: Dice | number, d2: Dice | number): Dice {
  if (typeof d1 === 'number') d1 = Dice.scalar(d1);
  if (typeof d2 === 'number') d2 = Dice.scalar(d2);

  const result = new Dice();
  const faces: Record<number, Dice> = {};
  let normalizationFactor = 1;

  for (const key of d1.keys()) {
    const count = d1.get(key);
    let face: Dice;

    if (typeof key !== 'number') {
      continue; // Skip invalid scalar
    }

    if (d2.privateData.keep) {
      // Repeat dice2 "key" times and apply keep
      const repeat: Dice[] = Array(key).fill(d2);
      face = opDice(repeat, d2.privateData.keep);
    } else {
      face = multiplyDice(key, d2);
    }

    normalizationFactor *= face.total();
    faces[key] = face;
  }

  for (const key of Object.keys(faces)) {
    const k = parseFloat(key); // keys from object are strings
    const face = faces[k];
    const count = d1.get(k);
    result.combineInPlace(face.normalize(count * normalizationFactor / face.total()));
  }

  result.privateData.except = {};
  return result;
}

function multiplyDice(n: number, d: Dice): Dice {
  if (n === 0) return new Dice(0);
  if (n === 1) return d;

  const half = Math.floor(n / 2);
  let result = multiplyDice(half, d);
  result = result.add(result);

  if (n % 2 === 1) {
    result = result.add(d);
  }

  return result;
}

function opDice(diceList: Dice[], keepFn: (values: number[]) => number): Dice {
  return opDiceInternal(diceList, new Dice(), 0, [], 1, keepFn);
}

function opDiceInternal(
  diceList: Dice[],
  result: Dice,
  index: number,
  values: number[],
  weight: number,
  combineFn: (values: number[]) => number
): Dice {
  if (index === diceList.length) {
    return result.combine(Dice.scalar(combineFn(values)).normalize(weight));
  }

  const currentDice = diceList[index];
  for (const face of currentDice.keys()) {
    values.push(face as number);
    result = opDiceInternal(
      diceList,
      result,
      index + 1,
      values,
      weight * currentDice.get(face),
      combineFn
    );
    values.pop();
  }

  return result;
}



function parseArgumentInternal(s: string[], n: number): Dice | number | undefined {
  if (s.length === 0) return;

  const c = s[0];

  switch (c) {
    case '(':
      s.shift();
      return assertToken(s, ')', parseExpression(s, n));

    case 'h':
    case 'd':
      return parseDice(s, n);

    case 'k':
      assertToken(s, 'k');
      return parseKeep(s, n);

    case '0': case '1': case '2': case '3': case '4':
    case '5': case '6': case '7': case '8': case '9':
    case 'n':
      return parseNumber(s, n);
  }

  return;
}

function parseBinaryArgument(arg: Dice | number, arr: string[], n: number): Dice {
  if (arr.length >= 4 && arr[0] === 'h' && peek(arr, 'half')) {
    assertToken(arr, 'half');

    const diceArg = typeof arg === 'number' ? Dice.scalar(arg) : arg;
    return diceArg.divideRoundDown(2);
  }

  const parsed = parseArgument(arr, n);
  return typeof parsed === 'number' ? Dice.scalar(parsed) : parsed;
}

function assertToken<T>(s: string[], expected: string, ret?: T): T | undefined {
  for (const ch of expected) {
    const found = s.shift();
    if (found !== ch) {
      throw new Error(`Expected character '${ch}', found '${found}'`);
    }
  }
  return ret;
}

function parseDice(s: string[], n: number): Dice | undefined {
  let rerollOne = false;

  if (peek(s, 'hd') && peekIsNumber(s, 2)) {
    assertToken(s, 'h');
    assertToken(s, 'd');
    rerollOne = true;
  } else if (peek(s, 'd') && peekIsNumber(s, 1)) {
    assertToken(s, 'd');
  } else {
    return;
  }

  const sides = parseNumber(s, n);
  let result = new Dice(sides);

  if (rerollOne) {
    result = result.deleteFace(1).combine(result);
  }

  return result;
}

function peek(arr: string[], expected: string): boolean {
  if (expected.length > arr.length) return false;

  for (let i = 0; i < expected.length; i++) {
    if (arr[i] !== expected.charAt(i)) return false;
  }

  return true;
}

function peekIsNumber(arr: string[], index: number): boolean {
  if (index >= arr.length) return false;
  return isDigit(arr[index]) || arr[index] === 'n';
}

function parseNumber(s: string[], n: number): number {
  let ret = '';

  while (s.length > 0 && (isDigit(s[0]) || s[0] === 'n')) {
    const ch = s.shift()!;
    ret += ch === 'n' ? n.toString() : ch;
  }

  if (ret.length === 0) {
    throw new Error(`Expected number, found: '${s[0]}'`);
  }

  return parseInt(ret, 10);
}

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}

function parseKeep(s: string[], n: number): Dice | undefined {
  let keepLowest = false;

  if (peek(s, 'l')) {
    assertToken(s, 'l');
    keepLowest = true;
  } else if (peek(s, 'h')) {
    assertToken(s, 'h');
    keepLowest = false;
  } else {
    return;
  }

  const keepCount = parseNumber(s, n);
  const result = parseArgumentInternal(s, n);

  if (result instanceof Dice) {
    result.privateData.keep = keepN(keepCount, keepLowest);
    return result;
  }

  throw new Error("Expected Dice after keep modifier");
}

function keepN(n: number, low: boolean): (values: number[]) => number {
  return (values: number[]): number => {
    const sorted = [...values].sort((a, b) => low ? a - b : b - a);
    return sorted.slice(0, n).reduce((sum, val) => sum + val, 0);
  };
}

function parseOperation(s: string[]): DiceOperation | undefined {
  switch (s[0]) {
    case ')':
      return;

    case 'a':
      assertToken(s, 'ac');
      return Dice.prototype.ac;

    case 'd':
      assertToken(s, 'dc');
      return Dice.prototype.dc;

    case '!':
      assertToken(s, '!');
      const adv = Dice.prototype.advantage as DiceOperation;
      adv.unary = true;
      return adv;

    case '>':
      assertToken(s, '>');
      return Dice.prototype.max;

    case '<':
      assertToken(s, '<');
      return Dice.prototype.min;

    case '+':
      assertToken(s, '+');
      return Dice.prototype.addNonZero;

    case '~':
      assertToken(s, '~');
      assertToken(s, '+');
      return Dice.prototype.add;

    case '-':
      assertToken(s, '-');
      return Dice.prototype.subtract;

    case '&':
      assertToken(s, '&');
      return Dice.prototype.combine;

    case 'r':
      assertToken(s, 'reroll');
      return Dice.prototype.reroll;

    case '*':
      assertToken(s, '*');
      return Dice.prototype.multiply;

    case '/':
      assertToken(s, '/');
      if (s[0] === '/') {
        assertToken(s, '/');
        return Dice.prototype.divideRoundDown;
      }
      return Dice.prototype.divideRoundUp;

    case '=':
      assertToken(s, '=');
      return Dice.prototype.eq;
  }

  return;
}

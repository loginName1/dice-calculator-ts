/**
 * New Calculator uses Typescripts typing and Class for the dice
 */

export class Dice {
  private faces: Map<number | string, number>;
  public privateData: Record<string, any>;
  public metadata: {
    crit?: Map<number | string, number>;
    miss?: Map<number | string, number>;
    save?: Map<number | string, number>;
    pc?: Map<number | string, number>;
  } = {};

  constructor(x: number = 0) {
    this.faces = new Map();
    this.privateData = {};

    if (x === 0) {
      return;
      //this.faces.set(0, 1);
    } else {
      for (let i = 1; i <= x; i++) {
        this.faces.set(i, 1);
      }
    }
  }

  // PRIVATE FUNCTIONS

  private binaryOp(
    other: Dice | number,
    op: (a: number, b: number) => number,
    diceConstructor?: () => Dice
  ): Dice {
    const result = diceConstructor ? diceConstructor() : new Dice();

    const isScalar = typeof other === 'number';
    const keys1 = this.keys();

    for (const key1 of keys1) {
      const value1 = this.faces.get(key1)!;

      if (isScalar) {
        const resultKey = op(key1 as number, other as number); // assert number
        result.increment(resultKey, value1);
      } else {
        const keys2 = other.keys();
        for (const key2 of keys2) {
          const value2 = other.faces.get(key2)!;
          const resultKey = op(key1 as number, key2 as number); // assert number
          result.increment(resultKey, value1 * value2);
        }
      }
    }

    return result;
  }

  private removeFaces(facesToRemove: (number | string)[]): Dice {
    const result = new Dice();

    for (const [key, value] of this.faces.entries()) {
      if (!facesToRemove.includes(key)) {
        result.faces.set(key, value);
      }
    }

    result.privateData = { ...this.privateData };
    result.metadata = { ...this.metadata };
    return result;
  }

  // PUBLIC FUNTIONS
  public getFaceEntries(): [number | string, number][] {
    return Array.from(this.faces.entries());
  }

  public getFaceMap(): Map<number | string, number> {
    return new Map(this.faces);
  }

  public get(face: number | string): number {
    return this.faces.get(face) ?? 0;
  }

  public setFace(key: number | string, value: number): void {
    this.faces.set(key, value);
  }

  public static scalar(value: number): Dice {
    const result = new Dice();
    result.increment(value, 1);
    return result;
  }

  /**
   * 
   * @returns array of faces (values of string values)
   */
  public keys(): (number | string)[] {
    return Array.from(this.faces.keys());
  }

  /**
   * 
   * @returns array of face values
   */
  public values(): number[] {
    return Array.from(this.faces.values());
  }

  public maxFace(): number {
    const numericKeys = this.keys().filter((k): k is number => typeof k === 'number');

    if (numericKeys.length === 0) {
      throw new Error("No numeric faces found");
    }

    return Math.max(...numericKeys);
  }

  public minFace(): number {
    const numericKeys = this.keys().filter((k): k is number => typeof k === 'number');

    if (numericKeys.length === 0) {
      throw new Error("No numeric faces found");
    }

    return Math.min(...numericKeys);
  }

  public total(): number {
    let sum = 0;
    for (const value of this.faces.values()) {
      sum += value;
    }
    return sum;
  }

  public increment(face: number | string, count: number): void {
    const current = this.faces.get(face) || 0;
    this.faces.set(face, current + count);
  }

  public normalize(scalar: number): Dice {
    const result = new Dice();

    for (const [face, count] of this.faces.entries()) {
      result.faces.set(face, count * scalar);
    }

    // Copy privateData if needed
    result.privateData = { ...this.privateData };
    result.metadata = { ...this.metadata };
    return result;
  }

  public add(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => a + b);
  }

  public subtract(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => a - b);
  }

  public multiply(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => (a === 0 ? 0 : 1) * b);
  }

  public addNonZero(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => (a !== 0 ? a + b : a));
  }

  public eq(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => a === b ? 1 : 0);
  }

  public max(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => Math.max(a, b));
  }

  public min(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => Math.min(a, b));
  }

  public advantage(): Dice {
    return this.max(this);
  }

  public ge(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => (a >= b ? 0 : 1));
  }

  public divide(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => a / b);
  }

  public divideRoundUp(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => Math.ceil(a / b));
  }

  public divideRoundDown(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => Math.floor(a / b));
  }

  public and(other: Dice | number): Dice {
    return this.binaryOp(other, (a, b) => (a && b ? 1 : 0));
  }

  public dc(other: Dice | number): Dice {
    return this.binaryOp(
      other,
      (a, b) => (a >= b ? 0 : 1),
      () => {
        const d = new Dice();
        d.increment(0, 0);
        d.increment(1, 0);
        return d;
      }
    );
  }

  public ac(other: Dice | number): Dice {
    return this.binaryOp(
      other,
      (a, b) => (a >= b ? a : 0),
      () => {
        const d = new Dice();
        d.increment(0, 0);
        d.increment(1, 0);
        return d;
      }
    );
  }

  public deleteFace(face: number | string): Dice {
    const result = new Dice();

    for (const [key, value] of this.faces.entries()) {
      if (key !== face) {
        result.faces.set(key, value);
      }
    }

    result.privateData = { ...this.privateData };
    result.metadata = { ...this.metadata };
    return result;
  }

  public changeFace(oldFace: number | string, newFace: number | string): Dice {
    const result = new Dice();

    for (const [key, value] of this.faces.entries()) {
      if (key === oldFace) {
        result.faces.set(newFace, value);
      } else {
        result.faces.set(key, value);
      }
    }

    result.privateData = { ...this.privateData };
    result.metadata = { ...this.metadata };
    return result;
  }

  public reroll(toReroll: Dice | number): Dice {
    const rerollDice = typeof toReroll === 'number' ? Dice.scalar(toReroll) : toReroll;

    const removed = this.removeFaces(rerollDice.keys());
    console.log(removed.keys())
    let result = new Dice();

    for (const face of this.keys()) {
      const wasRerolled = rerollDice.keys().includes(face);
      if (wasRerolled) {
        result = result.combine(removed).combine(this);
      } else {
        result = result.combine(removed);
      }
    }

    return result;
  }

  public combine(other: Dice | number): Dice {
    if (typeof other === 'number') {
      other = Dice.scalar(other);
    }

    // Start by copying "other" into a new Dice object
    const result = new Dice();
    for (const [key, value] of other.faces.entries()) {
      result.faces.set(key, value);
    }

    // Build the "except" dice and add faces from `this` to result
    const except = new Dice();
    for (const [key, value] of this.faces.entries()) {
      result.increment(key, value);

      // If the key did not already exist in `other`, we remove it from `except`
      if (!other.faces.has(key)) {
        except.increment(key, value); // still tracked in except
      }
    }

    result.privateData = { ...this.privateData, except: other };
    result.metadata = { ...this.metadata };
    return result;
  }


  public combineInPlace(other: Dice): void {
    for (const [key, value] of other.faces.entries()) {
      const current = this.faces.get(key) || 0;
      this.faces.set(key, current + value);
    }
  }

  public percent(): Dice {
    const total = this.total();
    const result = new Dice();

    for (const [key, value] of this.faces.entries()) {
      result.faces.set(key, value / total);
    }

    result.privateData = { ...this.privateData };
    result.metadata = { ...this.metadata };
    return result;
  }

  public average(): number {
    const total = this.total();
    let sum = 0;

    for (const [key, value] of this.faces.entries()) {
      if (typeof key === 'number') {
        sum += key * value;
      }
    }

    return total === 0 ? 0 : sum / total;
  }

}

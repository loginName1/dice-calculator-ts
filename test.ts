import { parse } from './parser'; // adjust path if needed

function testExpression(expr: string, n: number = 0): void {
  try {
    const result = parse(expr, n);
    console.log(`Expression: "${expr}"`);
    console.log(`Keys:`, result.keys());
    console.log(`Values:`, result.values());
    console.log(`Total: ${result.total()}`);
    console.log(`Average: ${result.average()}`);
    console.log(`Percent:`, result.percent());
    console.log('------------------------');
  } catch (e) {
    console.error(`Error parsing "${expr}":`, e);
  }
}

// Run some basic tests
//testExpression('d20');                            //WORKS
//testExpression('d20 reroll 1');                   //WORKS     
//testExpression('hd20');                           //WORKS
//testExpression('d20 > d20');                      //WORKS
//testExpression('d20!')                            //WORKS
//testExpression('d20 < d20');                      //WORKS
//testExpression('4kh3d6');                         //WORKS
//testExpression('d20 + 6 DC 15');                  //WORKS
//testExpression('d20 + 6 DC 15 * 8d6');            //WORKS
//testExpression('d20 + 6 DC 15 * 8d6 save half');  //WORKS
//testExpression('d20 + 6 AC 15');                  //WORKS
//testExpression('(d20 + 6 AC 15) * (2d6 + 4)');    //WORKS
//testExpression('(d20 > d20 + 6 AC 15) * (2d6 + 4)');  //WORKS
//testExpression('(d20 > d20 + 6 AC 15) * (2d6 + 4) crit (4d6 + 4)');   //WORKS
//testExpression('(d20 > d20 + 6 AC 15) * (2d6 + 4) xcrit2 (4d6 + 4)'); //WORKS

testExpression('(d20 > d20 +13 AC 18) * (2kh1(1d8) + 1d12 + 1d8 + 7) crit (2kh1(2d12 + 4d8 + 7))');
//testExpression('(d20 > d20 +13 AC 18) * (2kh1(1d8) + 1d12 + 1d8 + 7) crit (2kh1(2d12 + 4d8 + 7))');
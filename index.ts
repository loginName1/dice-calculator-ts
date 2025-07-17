import { parse } from './parser';

function displayResult(expr: string): void {
  const output = document.getElementById('output');
  if (!output) return;

  try {
    const result = parse(expr, 0); // you can replace 0 with user-supplied 'n' if needed
    const percent = result.percent();

    const entries = percent.getFaceEntries()
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([k, v]) => `${k}: ${(v * 100).toFixed(2)}%`)
      .join('<br>');

    output.innerHTML = `
      <strong>Average:</strong> ${result.average().toFixed(2)}<br>
      <strong>Total:</strong> ${result.total()}<br><br>
      <strong>Chances:</strong><br>${entries}
    `;
  } catch (e) {
    output.innerHTML = `<span style="color:red;">Error: ${(e as Error).message}</span>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('input') as HTMLInputElement | null;
  if (!input) return;

  input.addEventListener('input', () => {
    displayResult(input.value);
  });

  displayResult(input.value); // evaluate initial value
});

// How amounts and times are written on screen.

export function rupees(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

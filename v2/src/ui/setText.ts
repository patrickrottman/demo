export function setText(node: { textContent: string | null }, value: string): void {
  if (node.textContent !== value) node.textContent = value;
}

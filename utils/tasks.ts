import type { TaskNode } from '@/types/tasks';

export type FlatTaskNode = {
  id: string;
  title: string;
  done: boolean;
  parentId?: string;
  depth: number;
  path: string[]; // array of ids from root to this node
  index: number; // index within its siblings
  isLeaf: boolean;
};

export function flattenTaskTree(nodes: TaskNode[] | undefined, parentId?: string, parentPath: string[] = [], depth = 0): FlatTaskNode[] {
  if (!nodes || nodes.length === 0) return [];
  const flat: FlatTaskNode[] = [];
  nodes.forEach((n, i) => {
    const path = [...parentPath, n.id];
    const isLeaf = !n.children || n.children.length === 0;
    flat.push({ id: n.id, title: n.title, done: n.done, parentId, depth, path, index: i, isLeaf });
    if (n.children && n.children.length) {
      flat.push(...flattenTaskTree(n.children, n.id, path, depth + 1));
    }
  });
  return flat;
}

export function computeProgress(nodes: TaskNode[] | undefined): { total: number; done: number; percent: number } {
  const flat = flattenTaskTree(nodes);
  const total = flat.length;
  const done = flat.filter((n) => n.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, percent };
}

export function findTaskById(nodes: TaskNode[] | undefined, id: string): TaskNode | undefined {
  if (!nodes) return undefined;
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findTaskById(n.children, id);
    if (found) return found;
  }
  return undefined;
}

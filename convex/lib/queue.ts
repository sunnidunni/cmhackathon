// Orders waiting work so every user gets a turn: one item from each user, then a second from each, and so on.
// Users keep the order in which they first appear, and each user's own items keep their order.
// Without this, one person importing thousands of screenshots would make everyone else wait behind them.
export function fairOrder<T extends { userId: string }>(rows: readonly T[]): T[] {
  const perUser = new Map<string, T[]>();
  for (const row of rows) {
    const list = perUser.get(row.userId);
    if (list) list.push(row);
    else perUser.set(row.userId, [row]);
  }
  const queues = [...perUser.values()];
  const out: T[] = [];
  for (let turn = 0; out.length < rows.length; turn++) {
    for (const queue of queues) if (turn < queue.length) out.push(queue[turn]);
  }
  return out;
}

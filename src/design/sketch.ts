export type Pt = [number, number];
type Sub = { pts: Pt[]; closed: boolean };

export function seedFrom(...parts: (string | number)[]): number {
  const s = parts.join("|");
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function circleD(cx: number, cy: number, r: number): string {
  const k = r * 0.5523;
  return `M${cx} ${cy - r} C${cx + k} ${cy - r} ${cx + r} ${cy - k} ${cx + r} ${cy} C${cx + r} ${cy + k} ${cx + k} ${cy + r} ${cx} ${cy + r} C${cx - k} ${cy + r} ${cx - r} ${cy + k} ${cx - r} ${cy} C${cx - r} ${cy - k} ${cx - k} ${cy - r} ${cx} ${cy - r} Z`;
}

export type Tail = "bottom-left" | "bottom-right" | "left";

export function roundedRectD(w: number, h: number, radius: number, tail?: Tail): string {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  const bottom =
    tail === "bottom-left"
      ? ` H32 L19 ${h + 11} L16 ${h}`
      : tail === "bottom-right"
        ? ` H${w - 16} L${w - 19} ${h + 11} L${w - 32} ${h}`
        : "";
  const left = tail === "left" ? ` V26 L-11 15 L0 10` : "";
  return `M${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${h - r} Q${w} ${h} ${w - r} ${h}${bottom} H${r} Q0 ${h} 0 ${h - r}${left} V${r} Q0 0 ${r} 0 Z`;
}

function samplePath(d: string, step: number): Sub[] {
  const tokens = d.match(/[MLHVCQZ]|-?\d*\.?\d+/gi) ?? [];
  const subs: Sub[] = [];
  let cur: Pt[] = [];
  let x = 0, y = 0, sx = 0, sy = 0, i = 0, cmd = "";
  const num = () => parseFloat(tokens[i++]);
  const add = (at: (t: number) => Pt, len: number) => {
    const n = Math.max(1, Math.ceil(len / step));
    for (let k = 1; k <= n; k++) cur.push(at(k / n));
  };
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++].toUpperCase();
    const ox = x, oy = y;
    if (cmd === "M") {
      if (cur.length > 1) subs.push({ pts: cur, closed: false });
      x = sx = num();
      y = sy = num();
      cur = [[x, y]];
      cmd = "L";
    } else if (cmd === "L" || cmd === "H" || cmd === "V") {
      x = cmd === "V" ? x : num();
      y = cmd === "H" ? y : num();
      const nx = x, ny = y;
      add((t) => [ox + (nx - ox) * t, oy + (ny - oy) * t], Math.hypot(nx - ox, ny - oy));
    } else if (cmd === "Q") {
      const cx = num(), cy = num();
      x = num();
      y = num();
      const nx = x, ny = y;
      add((t) => {
        const u = 1 - t;
        return [u * u * ox + 2 * u * t * cx + t * t * nx, u * u * oy + 2 * u * t * cy + t * t * ny];
      }, Math.hypot(cx - ox, cy - oy) + Math.hypot(nx - cx, ny - cy));
    } else if (cmd === "C") {
      const ax = num(), ay = num(), bx = num(), by = num();
      x = num();
      y = num();
      const nx = x, ny = y;
      add((t) => {
        const u = 1 - t;
        return [
          u * u * u * ox + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * nx,
          u * u * u * oy + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * ny,
        ];
      }, Math.hypot(ax - ox, ay - oy) + Math.hypot(bx - ax, by - ay) + Math.hypot(nx - bx, ny - by));
    } else if (cmd === "Z") {
      if (Math.hypot(x - sx, y - sy) > 0.01) add((t) => [ox + (sx - ox) * t, oy + (sy - oy) * t], Math.hypot(sx - ox, sy - oy));
      cur.pop();
      subs.push({ pts: cur, closed: true });
      cur = [];
      x = sx;
      y = sy;
      cmd = "";
    } else {
      i++;
    }
  }
  if (cur.length > 1) subs.push({ pts: cur, closed: false });
  return subs;
}

function displace(pts: Pt[], closed: boolean, r: () => number, amp: number, wave: number): Pt[] {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const last = pts[pts.length - 1];
  const total = L[L.length - 1] + (closed ? Math.hypot(pts[0][0] - last[0], pts[0][1] - last[1]) : 0) || 1;
  const knots = Math.max(3, Math.ceil(total / wave));
  const kx = Array.from({ length: knots + 1 }, () => (r() * 2 - 1) * amp);
  const ky = Array.from({ length: knots + 1 }, () => (r() * 2 - 1) * amp);
  if (closed) {
    kx[knots] = kx[0];
    ky[knots] = ky[0];
  }
  return pts.map((p, i) => {
    const u = (L[i] / total) * knots;
    const k = Math.min(Math.floor(u), knots - 1);
    const f = u - k;
    const s = f * f * (3 - 2 * f);
    return [p[0] + kx[k] + (kx[k + 1] - kx[k]) * s, p[1] + ky[k] + (ky[k + 1] - ky[k]) * s];
  });
}

const line = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");

export type Sketch = { main: string; echo: string; fill: string; box: { x0: number; y0: number; x1: number; y1: number } };

export function sketch(d: string, seed: number, { amp = 1.2, wave = 16, step = 3 }: { amp?: number; wave?: number; step?: number } = {}): Sketch {
  const r = rng(seed);
  const main: string[] = [], echo: string[] = [], fill: string[] = [];
  const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const sub of samplePath(d, step)) {
    for (const [px, py] of sub.pts) {
      box.x0 = Math.min(box.x0, px); box.y0 = Math.min(box.y0, py);
      box.x1 = Math.max(box.x1, px); box.y1 = Math.max(box.y1, py);
    }
    const n = sub.pts.length;
    const p = displace(sub.pts, sub.closed, r, amp, wave);
    if (sub.closed) {
      const s = Math.floor(r() * n);
      const seq = [...p.slice(s), ...p.slice(0, s)];
      const over = Math.max(2, Math.round(n * 0.04));
      const drift: Pt = [(r() * 2 - 1) * amp * 1.6, (r() * 2 - 1) * amp * 1.6];
      for (let j = 0; j <= over; j++) seq.push([seq[j][0] + (drift[0] * j) / over, seq[j][1] + (drift[1] * j) / over]);
      main.push(line(seq));
      fill.push(line(displace(sub.pts, true, r, amp * 0.6, wave * 1.5)) + " Z");
    } else {
      main.push(line(p));
    }
    if (n > 8) {
      const q = displace(sub.pts, sub.closed, r, amp * 1.5, wave);
      const len = Math.round(n * (0.3 + r() * 0.25));
      const s = sub.closed ? Math.floor(r() * n) : Math.floor(r() * (n - len));
      echo.push(line(Array.from({ length: len }, (_, j) => q[(s + j) % n])));
    }
  }
  return { main: main.join(" "), echo: echo.join(" "), fill: fill.join(" "), box };
}

export function scribble(box: Sketch["box"], seed: number, spacing: number): string {
  const r = rng(seed);
  const w = box.x1 - box.x0, h = box.y1 - box.y0;
  const pts: Pt[] = [];
  let flip = false;
  for (let c = spacing * 0.7; c < w + h; c += spacing * (0.75 + r() * 0.5)) {
    const a: Pt = [box.x0 + Math.min(c, w) + 2, box.y1 - Math.max(0, c - w) + 2];
    const b: Pt = [box.x0 + Math.max(0, c - h) - 2, box.y1 - Math.min(c, h) - 2];
    pts.push(...(flip ? [b, a] : [a, b]));
    flip = !flip;
  }
  return line(pts);
}

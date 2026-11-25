#!/usr/bin/env python3
"""Trace a row of pathlines seeded close to the ground through a Fluent
ASCII cell-centre export (steady run) and write them in the same format as
public/f1/pathlines.bin, so the existing streak-line loader can draw them.

Usage:  python3 tools/f1/trace_floor_lines.py <export.csv> [out.bin]

Output (little endian): u32 nLines, u32 count[nLines], then per point 5 float32:
  x - 1.55, z, -y  (three.js model coords, metres), residence time [s], |V| [m/s]
Half-car data is mirrored, so every seed gives a left and a right line.
Only lines that leave the back of the domain are kept (none end on the car).
"""
import struct, sys
import numpy as np, pandas as pd
from scipy.spatial import cKDTree

SEED_X, SEED_Z = -1.5, 0.05                 # Fluent metres: ahead of the nose, 5 cm off the ground
SEED_Y = np.linspace(0.03, 1.05, 24)        # across the half width
X_END, STEP, CX = 6.2, 0.01, 1.55
# wheels as closed cylinders (centre x, centre z, radius, y from, y to): their inner faces are open in the mesh
WHEELS = [(0.2027, 0.363, 0.37, 0.58, 1.03), (3.648, 0.344, 0.37, 0.50, 1.03)]

def main():
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else 'public/f1/floorlines.bin'
    df = pd.read_csv(src, skipinitialspace=True)
    df.columns = [c.strip().lower() for c in df.columns]
    col = lambda k: next(c for c in df.columns if k in c)
    P = df[[col('x-coord'), col('y-coord'), col('z-coord')]].to_numpy()
    V = df[[col('x-vel'), col('y-vel'), col('z-vel')]].to_numpy()
    tree = cKDTree(P)
    spacing = tree.query(P, k=2, workers=-1)[0][:, 1]

    def vel(p):
        q = p.copy(); q[:, 1] = np.abs(q[:, 1])
        d, i = tree.query(q, k=8)
        w = 1 / np.maximum(d, 1e-5) ** 2; w /= w.sum(1, keepdims=True)
        v = (V[i] * w[..., None]).sum(1)
        v[:, 1] *= np.where(p[:, 1] < 0, -1, 1)
        inside = d[:, 0] > np.maximum(1.5 * spacing[i[:, 0]], 0.03)      # no fluid cell nearby: inside the car
        for cx, cz, r, y0, y1 in WHEELS:
            inside |= ((q[:, 0] - cx) ** 2 + (q[:, 2] - cz) ** 2 < r * r) & (q[:, 1] > y0) & (q[:, 1] < y1)
        return v, inside

    p = np.stack([np.full(len(SEED_Y), SEED_X), SEED_Y, np.full(len(SEED_Y), SEED_Z)], 1)
    t = np.zeros(len(p)); alive = np.ones(len(p), bool); done = np.zeros(len(p), bool)
    hist = [[] for _ in p]
    for _ in range(4000):
        v1, _s = vel(p)
        s1 = np.linalg.norm(v1, axis=1)
        mid = p + 0.5 * STEP * v1 / np.maximum(s1, 1)[:, None]
        v2, solid = vel(mid)
        s2 = np.linalg.norm(v2, axis=1)
        for k in np.where(alive)[0]:
            hist[k].append((*p[k], t[k], s1[k]))
        stuck = solid | (s2 < 1.0)
        alive &= ~stuck
        p = np.where(alive[:, None], p + STEP * v2 / np.maximum(s2, 1)[:, None], p)
        p[:, 2] = np.maximum(p[:, 2], 0.005)
        t = np.where(alive, t + STEP / np.maximum(s2, 1), t)
        reached = alive & (p[:, 0] >= X_END)
        done |= reached; alive &= ~reached
        if not alive.any(): break

    lines = []
    for k in np.where(done)[0]:
        h = np.array(hist[k])[::3]                       # ~3 cm spacing
        for sign in (1, -1):
            lines.append(np.stack([h[:, 0] - CX, h[:, 2], -sign * h[:, 1], h[:, 3], h[:, 4]], 1).astype(np.float32))
    buf = bytearray(struct.pack('<I', len(lines)))
    for l in lines: buf += struct.pack('<I', len(l))
    for l in lines: buf += l.tobytes()
    open(out, 'wb').write(buf)
    print(f'{done.sum()} of {len(SEED_Y)} seeds reached the outlet -> {len(lines)} lines, {sum(map(len, lines))} points, {len(buf) // 1024} KB -> {out}')
    print('seed y kept:', np.round(SEED_Y[done], 2).tolist())

if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""Build public/f1/vortex.bin from a Fluent ASCII cell-centre export.

Usage:  python3 tools/f1/build_vortex_volume.py <export.csv> [--transient] [--h 0.028]

The export needs x/y/z-velocity. If it also has q-criterion (and vorticity-mag)
those are used directly; otherwise Q is computed from the gridded velocity.
Half-car (y >= 0) data; the viewer mirrors it.

File layout (little endian):
  u32 nx, ny, nz ; f32 x0, x1, y1, z1 (Fluent metres) ; f32 vscale ; u32 flags (1 = transient)
  RGBA8 [nz][ny][nx] : u, v, w  (x/127.5-1)*vscale , solid mask (255 = inside car)
  RG8   [nz][ny][nx] : R = Q, log-encoded  s = log1p(Q/Q0)/log1p(QMAX/Q0)
                       G = max of R within REACH metres (lets the ray-marcher skip empty space)
"""
import struct, sys
import numpy as np, pandas as pd
from scipy.spatial import cKDTree
from scipy.ndimage import binary_dilation, gaussian_filter, maximum_filter

Q0, QMAX, VSCALE = 2.0e3, 4.0e6, 90.0
X0, X1, Y1, Z1 = -1.4, 6.0, 1.15, 1.35
REACH = 0.25
WHEELS = [(0.2027, 0.363, 0.37, 0.58, 1.03), (3.648, 0.344, 0.37, 0.50, 1.03)]

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    transient = '--transient' in sys.argv
    H = float(sys.argv[sys.argv.index('--h') + 1]) if '--h' in sys.argv else 0.028
    out = args[1] if len(args) > 1 else 'public/f1/vortex.bin'
    df = pd.read_csv(args[0], skipinitialspace=True)
    df.columns = [c.strip().lower() for c in df.columns]
    col = lambda key: next((c for c in df.columns if key in c), None)
    P = df[[col('x-coord'), col('y-coord'), col('z-coord')]].to_numpy()
    V = df[[col('x-vel'), col('y-vel'), col('z-vel')]].to_numpy()
    qc = col('q-crit') if col('q-crit') and 'norm' not in col('q-crit') else None
    print('columns:', list(df.columns), '| Q from export:', bool(qc))

    xs, ys, zs = (np.arange(a, b + 1e-9, H) for a, b in ((X0, X1), (0, Y1), (0, Z1)))
    nx, ny, nz = len(xs), len(ys), len(zs)
    Z, Y, X = np.meshgrid(zs, ys, xs, indexing='ij')
    G = np.stack([X, Y, Z], -1).reshape(-1, 3)
    tree = cKDTree(P)
    nn = tree.query(P, k=2, workers=-1)[0][:, 1]
    dist, idx = tree.query(G, k=8, workers=-1)
    w = 1 / np.maximum(dist, 1e-4) ** 2
    w /= w.sum(1, keepdims=True)
    Vg = (V[idx] * w[..., None]).sum(1)

    solid = (dist[:, 0] > np.maximum(0.9 * nn[idx[:, 0]], 0.02)) & (G[:, 0] > -1.15) & (G[:, 0] < 4.3) & (G[:, 1] < 0.8) & (G[:, 2] < 1.1)
    for cx, cz, r, y0, y1 in WHEELS:
        solid |= ((G[:, 0] - cx) ** 2 + (G[:, 2] - cz) ** 2 < r * r) & (G[:, 1] > y0) & (G[:, 1] < y1)
    sol3 = solid.reshape(nz, ny, nx)

    if qc:
        Q = (df[qc].to_numpy()[idx] * w).sum(1).reshape(nz, ny, nx)
    else:
        U = Vg.copy(); U[solid] = 0; U = U.reshape(nz, ny, nx, 3)
        g = [np.gradient(U[..., c], H) for c in range(3)]            # (d/dz, d/dy, d/dx)
        J = np.stack([np.stack([g[c][2], g[c][1], g[c][0]], -1) for c in range(3)], -2)  # J[i][j] = du_i/dx_j
        S = 0.5 * (J + np.swapaxes(J, -1, -2)); O = 0.5 * (J - np.swapaxes(J, -1, -2))
        Q = 0.5 * ((O ** 2).sum((-1, -2)) - (S ** 2).sum((-1, -2)))
    # wall-adjacent cells carry huge shear-layer Q that would coat the car: damp it
    near = binary_dilation(sol3, iterations=2)
    Q = np.where(near, 0.0, Q)
    Q = gaussian_filter(np.maximum(Q, 0), 0.6)
    print('Q percentiles 50/90/99/99.9:', np.percentile(Q, [50, 90, 99, 99.9]).round(0))

    qenc = np.clip(np.log1p(Q / Q0) / np.log1p(QMAX / Q0) * 255, 0, 255).astype(np.uint8)
    qmax = maximum_filter(qenc, size=2 * int(round(REACH / H)) + 1, mode='reflect')
    qrg = np.stack([qenc, qmax], -1)
    venc = np.clip((Vg / VSCALE + 1) * 127.5, 0, 255).astype(np.uint8)
    rgba = np.concatenate([venc, np.where(solid, 255, 0).astype(np.uint8)[:, None]], 1)
    hdr = struct.pack('<3I5fI', nx, ny, nz, X0, X1, Y1, Z1, VSCALE, 1 if transient else 0)
    with open(out, 'wb') as f:
        f.write(hdr + rgba.tobytes() + qrg.tobytes())
    print(f'wrote {out}: grid {nx}x{ny}x{nz}, {(len(hdr) + rgba.nbytes + qrg.nbytes) / 1e6:.2f} MB, transient={transient}')

if __name__ == '__main__':
    main()

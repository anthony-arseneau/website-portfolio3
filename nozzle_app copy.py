"""
3D CAD-Style De Laval Nozzle — Geometry Baseline
=================================================
Pure geometric rendering of a converging-diverging nozzle
using Plotly go.Surface. No physics / no Dash — just the shape.

Run:
    pip install plotly numpy
    python nozzle_app.py
"""

import numpy as np
import plotly.graph_objects as go

# ──────────────────────────────────────────────
# Geometry parameters
# ──────────────────────────────────────────────
R_CHAMBER = 1.5     # chamber cylinder radius
R_THROAT = 0.85     # throat radius (minimum)
R_EXIT = 2.75        # exit plane radius
THICKNESS = 0.12    # radial wall thickness

# Section boundaries along X
X_CHAM_END = 2.0    # end of chamber cylinder
X_CONV_END = 3.0    # end of converging section (throat begins)
X_THR_END = 3.0     # end of throat cylinder
X_TRANS_END = 5.0    # end of post-throat transition
X_EXIT = 10.0       # nozzle exit

# Transition section: how much radius grows in the t² transition zone
TRANS_RISE = 0.4    # R goes from R_THROAT to R_THROAT + TRANS_RISE

N_X = 200           # axial resolution
N_THETA = 80        # circumferential resolution


def nozzle_radius(x):
    """
    5-section piecewise radius R(x) — fully C1-continuous:

      1. Chamber cylinder          (x = 0    → 2.0)
      2. Converging √-like inward  (x = 2.0  → 3.5)  ends parallel at throat
      3. Throat cylinder            (x = 3.5  → 4.0)
      4. Post-throat √-like flare   (x = 4.0  → 5.0)  starts parallel
      5. Diverging bell             (x = 5.0  → 10 )  slope-matched to §4
    """
    x = np.asarray(x, dtype=float)
    r = np.empty_like(x)

    # ── 1. Chamber cylinder ──
    m1 = x <= X_CHAM_END
    r[m1] = R_CHAMBER

    # ── 2. Converging (parabola vertex at throat end → dR/dx = 0) ──
    m2 = (x > X_CHAM_END) & (x <= X_CONV_END)
    L2 = X_CONV_END - X_CHAM_END
    t2 = (x[m2] - X_CHAM_END) / L2            # 0 → 1
    r[m2] = R_THROAT + (R_CHAMBER - R_THROAT) * (1 - t2) ** 2

    # ── 3. Throat cylinder ──
    m3 = (x > X_CONV_END) & (x <= X_THR_END)
    r[m3] = R_THROAT

    # ── 4. Post-throat transition (parabola vertex at throat → dR/dx = 0 at start) ──
    m4 = (x > X_THR_END) & (x <= X_TRANS_END)
    L4 = X_TRANS_END - X_THR_END
    t4 = (x[m4] - X_THR_END) / L4             # 0 → 1
    r[m4] = R_THROAT + TRANS_RISE * t4 ** 2

    # ── 5. Diverging bell (slope-matched to §4, concave-down √-like expansion) ──
    m5 = x > X_TRANS_END
    R_BELL_START = R_THROAT + TRANS_RISE       # radius at transition-bell junction
    L5 = X_EXIT - X_TRANS_END
    t5 = (x[m5] - X_TRANS_END) / L5           # 0 → 1

    # Match slope at junction: §4 ends with dR/dx = 2·TRANS_RISE / L4
    # Bell form: R = R_BELL_START + ΔR·(1 − (1−t)^q)
    # Bell slope at t=0 = ΔR·q / L5  →  set equal to §4 end slope  →  solve for q
    delta_R = R_EXIT - R_BELL_START
    slope_at_junction = 2.0 * TRANS_RISE / L4
    q = slope_at_junction * L5 / delta_R
    r[m5] = R_BELL_START + delta_R * (1.0 - (1.0 - t5) ** q)

    return r


# ──────────────────────────────────────────────
# Mesh generation (surface of revolution)
# ──────────────────────────────────────────────
x_pts = np.linspace(0, X_EXIT, N_X)
r_inner = nozzle_radius(x_pts)
r_outer = r_inner + THICKNESS

theta_pts = np.linspace(0, 2 * np.pi, N_THETA)
X_mesh, Theta_mesh = np.meshgrid(x_pts, theta_pts)

R_inner_mesh = np.interp(X_mesh, x_pts, r_inner)
R_outer_mesh = np.interp(X_mesh, x_pts, r_outer)

Y_inner = R_inner_mesh * np.cos(Theta_mesh)
Z_inner = R_inner_mesh * np.sin(Theta_mesh)
Y_outer = R_outer_mesh * np.cos(Theta_mesh)
Z_outer = R_outer_mesh * np.sin(Theta_mesh)

# ──────────────────────────────────────────────
# Annular end caps (seal inner ↔ outer shells)
# ──────────────────────────────────────────────
N_R_CAP = 10  # radial resolution for the thin ring

# Inlet cap at X = 0
r_cap_inlet = np.linspace(r_inner[0], r_outer[0], N_R_CAP)
R_cap_in, Th_cap_in = np.meshgrid(r_cap_inlet, theta_pts)
X_cap_inlet = np.zeros_like(R_cap_in)
Y_cap_inlet = R_cap_in * np.cos(Th_cap_in)
Z_cap_inlet = R_cap_in * np.sin(Th_cap_in)

# Exit cap at X = X_EXIT
r_cap_exit = np.linspace(r_inner[-1], r_outer[-1], N_R_CAP)
R_cap_ex, Th_cap_ex = np.meshgrid(r_cap_exit, theta_pts)
X_cap_exit = np.full_like(R_cap_ex, X_EXIT)
Y_cap_exit = R_cap_ex * np.cos(Th_cap_ex)
Z_cap_exit = R_cap_ex * np.sin(Th_cap_ex)

# ──────────────────────────────────────────────
# Build figure
# ──────────────────────────────────────────────
BEIGE = "#EBE7DD"
GRID_COLOR = "#444444"

SURFACE_COMMON = dict(
    surfacecolor=np.ones_like(X_mesh),
    colorscale=[[0, BEIGE], [1, BEIGE]],
    showscale=False,
    opacity=1.0,
    lighting=dict(
        ambient=0.35,
        diffuse=0.55,
        specular=0.45,
        roughness=0.35,
        fresnel=0.2,
    ),
    lightposition=dict(x=5, y=10, z=10),
    contours=dict(
        x=dict(show=True, color=GRID_COLOR, width=1, usecolormap=False),
        y=dict(show=True, color=GRID_COLOR, width=1, usecolormap=False),
        z=dict(show=True, color=GRID_COLOR, width=1, usecolormap=False),
    ),
)

CAP_COMMON = dict(
    colorscale=[[0, BEIGE], [1, BEIGE]],
    showscale=False,
    opacity=1.0,
    lighting=dict(
        ambient=0.35,
        diffuse=0.55,
        specular=0.45,
        roughness=0.35,
        fresnel=0.2,
    ),
    lightposition=dict(x=5, y=10, z=10),
    contours=dict(
        x=dict(show=True, color=GRID_COLOR, width=1, usecolormap=False),
        y=dict(show=True, color=GRID_COLOR, width=1, usecolormap=False),
        z=dict(show=True, color=GRID_COLOR, width=1, usecolormap=False),
    ),
    hoverinfo="skip",
)

fig = go.Figure(
    data=[
        # Inner wall
        go.Surface(
            x=X_mesh, y=Y_inner, z=Z_inner,
            hovertemplate="X: %{x:.2f}<br>R: %{customdata:.2f}<extra></extra>",
            customdata=R_inner_mesh,
            **SURFACE_COMMON,
        ),
        # Outer wall
        go.Surface(
            x=X_mesh, y=Y_outer, z=Z_outer,
            hovertemplate="X: %{x:.2f}<br>R: %{customdata:.2f}<extra></extra>",
            customdata=R_outer_mesh,
            **SURFACE_COMMON,
        ),
        # Inlet annular cap
        go.Surface(
            x=X_cap_inlet, y=Y_cap_inlet, z=Z_cap_inlet,
            surfacecolor=np.ones_like(X_cap_inlet),
            **CAP_COMMON,
        ),
        # Exit annular cap
        go.Surface(
            x=X_cap_exit, y=Y_cap_exit, z=Z_cap_exit,
            surfacecolor=np.ones_like(X_cap_exit),
            **CAP_COMMON,
        ),
    ]
)

# ──────────────────────────────────────────────
# Layout — clean CAD viewport
# ──────────────────────────────────────────────
AXIS_COMMON = dict(
    showgrid=True,
    gridcolor="#d0d0d0",
    zeroline=False,
    showbackground=True,
    backgroundcolor="#f5f5f5",
    color="#555555",
    tickfont=dict(size=10, color="#666666"),
)

fig.update_layout(
    title=dict(
        text="De Laval Nozzle — Geometry Baseline",
        font=dict(size=16, color="#333"),
        x=0.5,
    ),
    paper_bgcolor="#ffffff",
    margin=dict(l=0, r=0, t=50, b=0),
    scene=dict(
        aspectmode="data",
        xaxis=dict(title="X  (axial)", **AXIS_COMMON),
        yaxis=dict(title="Y", **AXIS_COMMON),
        zaxis=dict(title="Z", **AXIS_COMMON),
        camera=dict(
            eye=dict(x=1.4, y=1.0, z=0.5),
            up=dict(x=0, y=0, z=1),
        ),
    ),
)

# ──────────────────────────────────────────────
# Show
# ──────────────────────────────────────────────
if __name__ == "__main__":
    fig.show(renderer="browser")

"""
Exports 3D nozzle geometry + fire particles as standalone HTML.
Run once: python nozzle_export.py
"""

import numpy as np
import plotly.graph_objects as go

# ── Geometry parameters ──
R_CHAMBER = 1.5
R_THROAT = 0.85
R_EXIT = 2.75
THICKNESS = 0.12
X_CHAM_END = 2.0
X_CONV_END = 3.0
X_THR_END = 3.0
X_TRANS_END = 5.0
X_EXIT = 10.0
X_PLUME = 15.0
TRANS_RISE = 0.4
N_X = 200
N_THETA = 80
N_PARTICLES = 12000


def nozzle_radius(x):
    x = np.asarray(x, dtype=float)
    r = np.empty_like(x)
    m1 = x <= X_CHAM_END
    r[m1] = R_CHAMBER
    m2 = (x > X_CHAM_END) & (x <= X_CONV_END)
    L2 = X_CONV_END - X_CHAM_END
    t2 = (x[m2] - X_CHAM_END) / L2
    r[m2] = R_THROAT + (R_CHAMBER - R_THROAT) * (1 - t2) ** 2
    m3 = (x > X_CONV_END) & (x <= X_THR_END)
    r[m3] = R_THROAT
    m4 = (x > X_THR_END) & (x <= X_TRANS_END)
    L4 = X_TRANS_END - X_THR_END
    t4 = (x[m4] - X_THR_END) / L4
    r[m4] = R_THROAT + TRANS_RISE * t4 ** 2
    m5 = x > X_TRANS_END
    R_BELL_START = R_THROAT + TRANS_RISE
    L5 = X_EXIT - X_TRANS_END
    t5 = (x[m5] - X_TRANS_END) / L5
    delta_R = R_EXIT - R_BELL_START
    slope_at_junction = 2.0 * TRANS_RISE / L4
    q = slope_at_junction * L5 / delta_R
    r[m5] = R_BELL_START + delta_R * (1.0 - (1.0 - t5) ** q)
    return r


def plume_radius(x):
    x = np.asarray(x, dtype=float)
    r = np.empty_like(x)
    inside = x <= X_EXIT
    r[inside] = nozzle_radius(x[inside])
    r_exit = float(nozzle_radius(np.array([X_EXIT]))[0])
    r[~inside] = r_exit + 0.3 * (x[~inside] - X_EXIT)
    return r


# ── Nozzle wall meshes ──
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

# ── End caps ──
N_R_CAP = 10
r_cap_inlet = np.linspace(r_inner[0], r_outer[0], N_R_CAP)
R_cap_in, Th_cap_in = np.meshgrid(r_cap_inlet, theta_pts)
X_cap_inlet = np.zeros_like(R_cap_in)
Y_cap_inlet = R_cap_in * np.cos(Th_cap_in)
Z_cap_inlet = R_cap_in * np.sin(Th_cap_in)
r_cap_exit = np.linspace(r_inner[-1], r_outer[-1], N_R_CAP)
R_cap_ex, Th_cap_ex = np.meshgrid(r_cap_exit, theta_pts)
X_cap_exit = np.full_like(R_cap_ex, X_EXIT)
Y_cap_exit = R_cap_ex * np.cos(Th_cap_ex)
Z_cap_exit = R_cap_ex * np.sin(Th_cap_ex)

# ── Particles ──
rng = np.random.default_rng(42)
p_x = rng.uniform(0, X_PLUME, N_PARTICLES)
p_r_max = plume_radius(p_x)
p_r = p_r_max * np.sqrt(rng.uniform(0, 1, N_PARTICLES))
p_theta = rng.uniform(0, 2 * np.pi, N_PARTICLES)
p_y = p_r * np.cos(p_theta)
p_z = p_r * np.sin(p_theta)
p_r_norm = np.where(p_r_max > 0, p_r / p_r_max, 0.0)

# Simple position-based intensity: hotter near center and near exit
intensity = np.clip((p_x / X_PLUME) * (1.0 - p_r_norm ** 1.5), 0.0, 1.0)

FIRE_COLORSCALE = [
    [0.0, "darkred"],
    [0.3, "orangered"],
    [0.6, "orange"],
    [0.8, "white"],
    [1.0, "cyan"],
]

BG = "rgba(0,0,0,0)"
BEIGE = "#EBE7DD"
GRID_COLOR = "#444444"
MUTED = "#8b949e"

SURFACE_COMMON = dict(
    surfacecolor=np.ones_like(X_mesh),
    colorscale=[[0, BEIGE], [1, BEIGE]],
    showscale=False,
    opacity=1.0,
    lighting=dict(ambient=0.35, diffuse=0.55, specular=0.45, roughness=0.35, fresnel=0.2),
    lightposition=dict(x=5, y=10, z=10),
    contours=dict(
        x=dict(show=False),
        y=dict(show=False),
        z=dict(show=False),
    ),
    hoverinfo="skip",
)
CAP_COMMON = dict(
    colorscale=[[0, BEIGE], [1, BEIGE]],
    showscale=False,
    opacity=1.0,
    lighting=dict(ambient=0.35, diffuse=0.55, specular=0.45, roughness=0.35, fresnel=0.2),
    lightposition=dict(x=5, y=10, z=10),
    contours=dict(
        x=dict(show=False),
        y=dict(show=False),
        z=dict(show=False),
    ),
    hoverinfo="skip",
)

fig = go.Figure(data=[
    go.Surface(x=X_mesh, y=Y_inner, z=Z_inner, **SURFACE_COMMON),
    go.Surface(x=X_mesh, y=Y_outer, z=Z_outer, **SURFACE_COMMON),
    go.Surface(x=X_cap_inlet, y=Y_cap_inlet, z=Z_cap_inlet,
               surfacecolor=np.ones_like(X_cap_inlet), **CAP_COMMON),
    go.Surface(x=X_cap_exit, y=Y_cap_exit, z=Z_cap_exit,
               surfacecolor=np.ones_like(X_cap_exit), **CAP_COMMON),
    go.Scatter3d(
        x=p_x, y=p_y, z=p_z,
        mode="markers",
        marker=dict(size=1.8, color=intensity, colorscale=FIRE_COLORSCALE,
                    cmin=0, cmax=1, opacity=0.6),
        hoverinfo="skip",
    ),
])

AXIS = dict(
    showgrid=False, zeroline=False,
    showbackground=False,
    showaxeslabels=False,
    showticklabels=False,
    visible=False,
    title="",
)

fig.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    margin=dict(l=0, r=0, t=0, b=0),
    scene=dict(
        aspectmode="data",
        xaxis=dict(**AXIS),
        yaxis=dict(**AXIS),
        zaxis=dict(**AXIS),
        camera=dict(eye=dict(x=1.4, y=1.0, z=0.5), up=dict(x=0, y=0, z=1)),
        bgcolor="rgba(0,0,0,0)",
    ),
    showlegend=False,
)

html_str = fig.to_html(include_plotlyjs="cdn", full_html=True,
                       config={"displayModeBar": False, "scrollZoom": False})
html_str = html_str.replace(
    "<head><meta charset=\"utf-8\" /></head>",
    "<head><meta charset=\"utf-8\" /><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;}</style></head>",
)
# Strip any stale animation <script> blocks appended after </body>
import re

html_str = re.sub(r'<script>\s*\(function\(\).*?</script>', '', html_str, flags=re.DOTALL)
with open("public/nozzle_3d.html", "w") as f:
    f.write(html_str)

print("Exported → public/nozzle_3d.html")

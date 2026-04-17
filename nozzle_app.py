"""
3D De Laval Nozzle — Interactive Fire & Flow Simulation
=======================================================
CAD-quality nozzle geometry + dense 3D fire/plume particle system
with real-time quasi-1D isentropic flow. Dash + Plotly.

Run:
    pip install -r requirements.txt
    python nozzle_app.py
Then open http://127.0.0.1:8050
"""

import numpy as np
import plotly.graph_objects as go
from dash import Dash, Input, Output, dcc, html
from scipy.optimize import brentq

# ──────────────────────────────────────────────
# Constants
# ──────────────────────────────────────────────
GAMMA = 1.20
R_GAS = 360.0
ATM = 101325.0

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
X_PLUME = 15.0      # plume extends past exit

# Transition section: how much radius grows in the t² transition zone
TRANS_RISE = 0.4    # R goes from R_THROAT to R_THROAT + TRANS_RISE

N_X = 200           # axial resolution
N_THETA = 80        # circumferential resolution
N_PARTICLES = 10000


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


def plume_radius(x):
    """Inner-wall radius extended into the plume region."""
    x = np.asarray(x, dtype=float)
    r = np.empty_like(x)
    inside = x <= X_EXIT
    outside = ~inside
    r[inside] = nozzle_radius(x[inside])
    r_exit = float(nozzle_radius(np.array([X_EXIT]))[0])
    r[outside] = r_exit + 0.3 * (x[outside] - X_EXIT)
    return r


# ──────────────────────────────────────────────
# Nozzle wall meshes
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
# Particle cloud (pre-generate positions once)
# ──────────────────────────────────────────────
rng = np.random.default_rng(42)
p_x_pos = rng.uniform(0, X_PLUME, N_PARTICLES)
p_r_max = plume_radius(p_x_pos)
p_r = p_r_max * np.sqrt(rng.uniform(0, 1, N_PARTICLES))
p_theta = rng.uniform(0, 2 * np.pi, N_PARTICLES)
p_y_pos = p_r * np.cos(p_theta)
p_z_pos = p_r * np.sin(p_theta)
p_r_norm = np.where(p_r_max > 0, p_r / p_r_max, 0.0)

# ──────────────────────────────────────────────
# Physics engine
# ──────────────────────────────────────────────
X_THROAT_MID = (X_CONV_END + X_THR_END) / 2.0


def area_ratio(z_arr, radius_arr):
    r_throat = np.interp(X_THROAT_MID, z_arr, radius_arr)
    A_star = np.pi * r_throat ** 2
    return np.pi * radius_arr ** 2 / A_star


def _area_mach_residual(M, A_over_Astar, gamma):
    g = gamma
    exp = (g + 1) / (2 * (g - 1))
    rhs = (1.0 / M) * ((2.0 / (g + 1)) * (1.0 + (g - 1) / 2.0 * M ** 2)) ** exp
    return A_over_Astar - rhs


def solve_mach_profile(z_arr, A_over_Astar, gamma):
    mach = np.ones_like(z_arr)
    for i, (z, aar) in enumerate(zip(z_arr, A_over_Astar)):
        if np.isclose(z, X_THROAT_MID, atol=(z_arr[1] - z_arr[0]) * 1.5):
            mach[i] = 1.0
            continue
        try:
            if z < X_THROAT_MID:
                mach[i] = brentq(_area_mach_residual, 1e-6, 1.0 - 1e-12,
                                 args=(aar, gamma), xtol=1e-10)
            else:
                mach[i] = brentq(_area_mach_residual, 1.0 + 1e-12, 30.0,
                                 args=(aar, gamma), xtol=1e-10)
        except ValueError:
            mach[i] = mach[i - 1] if i > 0 else 1.0
    return mach


def isentropic_temperature(T_c, mach, gamma):
    return T_c / (1.0 + (gamma - 1) / 2.0 * mach ** 2)


def isentropic_pressure(P_c, mach, gamma):
    return P_c / (1.0 + (gamma - 1) / 2.0 * mach ** 2) ** (gamma / (gamma - 1))


A_over_Astar = area_ratio(x_pts, r_inner)
mach_profile = solve_mach_profile(x_pts, A_over_Astar, GAMMA)
max_mach = mach_profile.max()


def mach_at_x(x_query):
    return np.interp(x_query, x_pts, mach_profile, right=mach_profile[-1])


# ──────────────────────────────────────────────
# Fire colorscale & intensity
# ──────────────────────────────────────────────
FIRE_COLORSCALE = [
    [0.0, "darkred"],
    [0.3, "orangered"],
    [0.6, "orange"],
    [0.8, "white"],
    [1.0, "cyan"],
]

particle_mach = mach_at_x(p_x_pos)


def compute_fire_intensity(p_mach, p_rnorm, m_max):
    intensity = (p_mach / m_max) * (1.0 - p_rnorm ** 1.5)
    return np.clip(intensity, 0.0, 1.0)

# ──────────────────────────────────────────────
# Trace helpers (wall + cap styling)
# ──────────────────────────────────────────────
BEIGE = "#EBE7DD"
GRID_COLOR = "#444444"

SURFACE_COMMON = dict(
    surfacecolor=np.ones_like(X_mesh),
    colorscale=[[0, BEIGE], [1, BEIGE]],
    showscale=False,
    opacity=1.0,
    lighting=dict(
        ambient=0.35, diffuse=0.55, specular=0.45,
        roughness=0.35, fresnel=0.2,
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
        ambient=0.35, diffuse=0.55, specular=0.45,
        roughness=0.35, fresnel=0.2,
    ),
    lightposition=dict(x=5, y=10, z=10),
    contours=dict(
        x=dict(show=True, color=GRID_COLOR, width=1, usecolormap=False),
        y=dict(show=True, color=GRID_COLOR, width=1, usecolormap=False),
        z=dict(show=True, color=GRID_COLOR, width=1, usecolormap=False),
    ),
    hoverinfo="skip",
)

wall_inner = go.Surface(
    x=X_mesh, y=Y_inner, z=Z_inner,
    hovertemplate="X: %{x:.2f}<br>R: %{customdata:.2f}<extra></extra>",
    customdata=R_inner_mesh,
    **SURFACE_COMMON,
)
wall_outer = go.Surface(
    x=X_mesh, y=Y_outer, z=Z_outer,
    hovertemplate="X: %{x:.2f}<br>R: %{customdata:.2f}<extra></extra>",
    customdata=R_outer_mesh,
    **SURFACE_COMMON,
)
cap_inlet = go.Surface(
    x=X_cap_inlet, y=Y_cap_inlet, z=Z_cap_inlet,
    surfacecolor=np.ones_like(X_cap_inlet),
    **CAP_COMMON,
)
cap_exit = go.Surface(
    x=X_cap_exit, y=Y_cap_exit, z=Z_cap_exit,
    surfacecolor=np.ones_like(X_cap_exit),
    **CAP_COMMON,
)

# ──────────────────────────────────────────────
# Dash app
# ──────────────────────────────────────────────
app = Dash(__name__)

COLORS = dict(
    bg="#0d1117",
    card="#161b22",
    accent="#58a6ff",
    text="#c9d1d9",
    muted="#8b949e",
)

sidebar_style = {
    "width": "320px",
    "padding": "24px 20px",
    "backgroundColor": COLORS["card"],
    "overflowY": "auto",
    "flexShrink": "0",
    "borderRight": f"1px solid {COLORS['muted']}",
}

kpi_card_style = {
    "backgroundColor": COLORS["bg"],
    "borderRadius": "8px",
    "padding": "12px 16px",
    "marginBottom": "10px",
    "border": f"1px solid {COLORS['muted']}",
    "textAlign": "center",
}


def kpi_card(label, value_id, unit=""):
    return html.Div(style=kpi_card_style, children=[
        html.Div(label, style={"color": COLORS["muted"], "fontSize": "11px",
                                "textTransform": "uppercase", "letterSpacing": "1px"}),
        html.Div(id=value_id, style={"color": COLORS["accent"], "fontSize": "22px",
                                      "fontWeight": "700", "margin": "4px 0"}),
        html.Div(unit, style={"color": COLORS["muted"], "fontSize": "11px"}),
    ])


app.layout = html.Div(
    style={
        "display": "flex",
        "height": "100vh",
        "fontFamily": "'Inter', 'Segoe UI', sans-serif",
        "backgroundColor": COLORS["bg"],
        "color": COLORS["text"],
    },
    children=[
        # ── Sidebar ──
        html.Div(style=sidebar_style, children=[
            html.H2("Nozzle Sim", style={"color": COLORS["accent"],
                                          "marginTop": "0", "fontSize": "20px"}),
            html.Hr(style={"borderColor": COLORS["muted"], "opacity": 0.3}),

            html.Label("Chamber Pressure (MPa)", style={"fontSize": "12px"}),
            dcc.Slider(id="slider-pc", min=1, max=30, step=0.5, value=10,
                       marks={i: str(i) for i in range(0, 31, 5)},
                       tooltip={"placement": "bottom"}),

            html.Label("Chamber Temperature (K)", style={"fontSize": "12px",
                                                          "marginTop": "16px"}),
            dcc.Slider(id="slider-tc", min=500, max=4000, step=50, value=3500,
                       marks={i: str(i) for i in range(500, 4001, 500)},
                       tooltip={"placement": "bottom"}),

            html.Label("Particle count", style={"fontSize": "12px",
                                                 "marginTop": "16px"}),
            dcc.Slider(id="slider-npart", min=1000, max=30000, step=1000,
                       value=N_PARTICLES,
                       marks={i: f"{i // 1000}k" for i in range(0, 30001, 5000)},
                       tooltip={"placement": "bottom"}),

            html.Hr(style={"borderColor": COLORS["muted"], "opacity": 0.3,
                            "marginTop": "20px"}),
            kpi_card("Exit Mach", "kpi-mach"),
            kpi_card("Exit Temperature", "kpi-temp", "K"),
            kpi_card("Exit Pressure", "kpi-pres", "kPa"),
            kpi_card("Thrust (vac)", "kpi-thrust", "kN"),
        ]),

        # ── 3-D viewport ──
        html.Div(style={"flex": "1", "position": "relative"}, children=[
            dcc.Graph(id="nozzle-3d",
                      style={"height": "100%", "width": "100%"},
                      config={"displayModeBar": True, "scrollZoom": True}),
        ]),
    ],
)


# ──────────────────────────────────────────────
# Callback
# ──────────────────────────────────────────────
@app.callback(
    Output("nozzle-3d", "figure"),
    Output("kpi-mach", "children"),
    Output("kpi-temp", "children"),
    Output("kpi-pres", "children"),
    Output("kpi-thrust", "children"),
    Input("slider-pc", "value"),
    Input("slider-tc", "value"),
    Input("slider-npart", "value"),
)
def update_dashboard(P_c_mpa, T_c, n_particles):
    P_c = P_c_mpa * 1e6  # Pa

    # Physics
    T_exit = isentropic_temperature(T_c, mach_profile[-1], GAMMA)
    P_exit = isentropic_pressure(P_c, mach_profile[-1], GAMMA)
    v_exit = mach_profile[-1] * np.sqrt(GAMMA * R_GAS * T_exit)
    mdot = P_c * (np.pi * R_THROAT ** 2) / np.sqrt(T_c) * np.sqrt(
        GAMMA / R_GAS * (2 / (GAMMA + 1)) ** ((GAMMA + 1) / (GAMMA - 1))
    )
    thrust_vac = mdot * v_exit + P_exit * np.pi * R_EXIT ** 2

    # Subsample particles
    n = min(n_particles, N_PARTICLES)
    idx = np.arange(n)
    intensity = compute_fire_intensity(particle_mach[idx], p_r_norm[idx], max_mach)

    fire_trace = go.Scatter3d(
        x=p_x_pos[idx], y=p_y_pos[idx], z=p_z_pos[idx],
        mode="markers",
        marker=dict(
            size=1.8,
            color=intensity,
            colorscale=FIRE_COLORSCALE,
            cmin=0, cmax=1,
            opacity=0.6,
        ),
        hoverinfo="skip",
    )

    fig = go.Figure(data=[wall_inner, wall_outer, cap_inlet, cap_exit, fire_trace])

    AXIS_COMMON = dict(
        showgrid=True, gridcolor="#222", zeroline=False,
        showbackground=True, backgroundcolor=COLORS["bg"],
        color=COLORS["muted"],
        tickfont=dict(size=10, color=COLORS["muted"]),
    )

    fig.update_layout(
        paper_bgcolor=COLORS["bg"],
        margin=dict(l=0, r=0, t=0, b=0),
        scene=dict(
            aspectmode="data",
            xaxis=dict(title="X (axial)", **AXIS_COMMON),
            yaxis=dict(title="Y", **AXIS_COMMON),
            zaxis=dict(title="Z", **AXIS_COMMON),
            camera=dict(
                eye=dict(x=1.4, y=1.0, z=0.5),
                up=dict(x=0, y=0, z=1),
            ),
        ),
        showlegend=False,
    )

    return (
        fig,
        f"{mach_profile[-1]:.2f}",
        f"{T_exit:.0f}",
        f"{P_exit / 1e3:.1f}",
        f"{thrust_vac / 1e3:.1f}",
    )


# ──────────────────────────────────────────────
# Run
# ──────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=8050)

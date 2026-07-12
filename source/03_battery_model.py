"""手机电池 SOC—温度耦合模型、场景仿真与约束优化。"""
from dataclasses import dataclass

import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import minimize


@dataclass
class Params:
    capacity_wh: float = 18.0
    base_power: float = 0.55
    screen_power: float = 2.2
    cpu_power: float = 3.6
    network_power: float = 1.1
    eta_ref: float = 0.96
    temp_coeff: float = 0.0007
    heat_coeff: float = 0.70
    cool_coeff: float = 0.22
    thermal_mass: float = 14.0
    reference_temp: float = 25.0


P = Params()


def total_power(brightness: float, cpu_load: float, network: float, p=P) -> float:
    """CPU 功耗采用三次非线性，反映高频运行的快速功耗增长。"""
    return (
        p.base_power
        + p.screen_power * brightness
        + p.cpu_power * cpu_load**3
        + p.network_power * network
    )


def coupled_ode(t, state, controls, ambient, p=P):
    """state = [SOC(0~1), battery_temperature(°C)]。"""
    soc, temperature = state
    brightness, cpu_load, network = controls
    power = total_power(brightness, cpu_load, network, p)
    efficiency = p.eta_ref * (
        1 - p.temp_coeff * (temperature - p.reference_temp) ** 2
    )
    efficiency = np.clip(efficiency, 0.70, 1.0)
    d_soc = -power / (p.capacity_wh * efficiency)
    d_temp = (
        p.heat_coeff * power - p.cool_coeff * (temperature - ambient)
    ) / p.thermal_mass
    return [d_soc, d_temp]


def simulate(controls, ambient=25.0, hours=24.0):
    """SOC 降到 5% 或到达模拟上限时停止。"""
    def empty_event(t, state, *_):
        return state[0] - 0.05

    empty_event.terminal = True
    empty_event.direction = -1
    result = solve_ivp(
        coupled_ode,
        t_span=(0, hours),
        y0=[1.0, ambient],
        args=(controls, ambient, P),
        events=empty_event,
        dense_output=True,
        max_step=0.05,
    )
    tte = result.t_events[0][0] if len(result.t_events[0]) else hours
    max_temp = result.y[1].max()
    return tte, max_temp, result


def objective(x):
    """优化目标：最大化续航，同时惩罚超过 42°C 的方案。"""
    brightness, cpu_load = x
    tte, max_temp, _ = simulate((brightness, cpu_load, 0.5))
    thermal_penalty = max(0.0, max_temp - 42.0) ** 2
    return -tte + 10.0 * thermal_penalty


# 亮度与 CPU 均保留最低性能约束
opt = minimize(
    objective,
    x0=[0.55, 0.55],
    bounds=[(0.20, 1.00), (0.30, 1.00)],
    method="SLSQP",
)

baseline = simulate((0.70, 0.65, 0.7))
optimized = simulate((opt.x[0], opt.x[1], 0.5))

print({
    "optimal_brightness": round(opt.x[0], 3),
    "optimal_cpu_load": round(opt.x[1], 3),
    "baseline_tte": round(baseline[0], 2),
    "optimized_tte": round(optimized[0], 2),
    "optimized_max_temp": round(optimized[1], 2),
})

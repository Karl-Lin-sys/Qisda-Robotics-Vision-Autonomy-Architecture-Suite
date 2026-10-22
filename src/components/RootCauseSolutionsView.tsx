import React, { useState } from 'react';
import { ROOT_CAUSE_DIAGNOSTICS } from '../data/roboticsContent';

export const RootCauseSolutionsView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(ROOT_CAUSE_DIAGNOSTICS[0].id);

  // Interactive Lyapunov Phase Margin & Thermal Derating Simulator
  const [gpuTempC, setGpuTempC] = useState<number>(68);
  const [dualRateIsolated, setDualRateIsolated] = useState<boolean>(true);
  const [hardwarePtpSync, setHardwarePtpSync] = useState<boolean>(true);

  // Compute simulated vision delay and control loop stability
  const thermalThrottleFactor = gpuTempC > 82 ? 1 + (gpuTempC - 82) * 0.18 : 1.0;
  const visionLatencyMs = Number((11.4 * thermalThrottleFactor).toFixed(1));
  const timeSyncJitterMs = hardwarePtpSync ? 0.08 : 8.5;
  const effectiveControlRateHz = dualRateIsolated ? 1000 : Math.round(1000 / thermalThrottleFactor);
  const spectralRadius = Number(
    (
      (dualRateIsolated ? 0.72 : 0.72 * thermalThrottleFactor) +
      (hardwarePtpSync ? 0.01 : 0.19)
    ).toFixed(3)
  );
  const isLyapunovStable = spectralRadius < 1.0;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="border-b border-slate-200 pb-5">
        <p className="text-xs font-mono text-slate-500">
          03. Root-Cause Identification &amp; 3 Theoretical Solutions · Peer-Reviewed Literature &amp; Official Issue Trackers (2021–2026)
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Structural Algorithmic &amp; Organisational Root-Cause Analysis
        </h2>
        <p className="mt-2 max-w-4xl text-sm text-slate-600 leading-relaxed">
          Rigorous diagnosis of why multi-sensor robotics platforms fail under real-world industrial/medical deployment
          and why the Qisda JD’s cross-disciplinary scope (Optics + Mech USD + Jetson/EtherCAT + ROS2 + Thermal)
          requires strict mathematical decoupling.
        </p>
      </div>

      {/* 3 Root Causes & Theoretical Solutions */}
      <div className="grid grid-cols-1 gap-6">
        {ROOT_CAUSE_DIAGNOSTICS.map((item, idx) => {
          const isExpanded = item.id === selectedId;
          return (
            <div
              key={item.id}
              className={`bg-white border rounded-lg transition-colors ${
                isExpanded ? 'border-blue-600' : 'border-slate-200'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-slate-500">
                      03.{idx + 1} · {item.category} · {item.primaryCitation}
                    </div>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">{item.title}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                      isExpanded
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isExpanded ? 'Focused Root Cause' : 'Focus Analysis'}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-mono font-semibold text-rose-700">
                        Empirical Symptom in Qisda JD Context
                      </div>
                      <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                        {item.symptomInJobContext}
                      </p>
                    </div>
                    <div>
                      <div className="text-xs font-mono font-semibold text-slate-700">
                        Mathematical &amp; Structural Root Cause
                      </div>
                      <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                        {item.mathematicalRootCause}
                      </p>
                    </div>
                    <div>
                      <div className="text-xs font-mono text-slate-500">
                        Verified Framework Issue Tracker: {item.frameworkIssueRef}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-md border border-slate-200 space-y-3">
                    <div>
                      <div className="text-xs font-mono font-semibold text-emerald-700">
                        {item.solutionTitle}
                      </div>
                      <p className="mt-1 text-xs text-slate-800 leading-relaxed">
                        <span className="font-semibold">Theoretical Guarantee: </span>
                        {item.theoreticalGuarantee}
                      </p>
                    </div>
                    <div>
                      <div className="text-xs font-mono font-semibold text-slate-700">
                        Concrete Engineering Protocol
                      </div>
                      <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                        {item.concreteImplementation}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-200">
                      <div className="text-xs font-mono text-blue-700">
                        Canadian Toddler Translation, Eh:
                      </div>
                      <p className="mt-0.5 text-xs text-slate-700 italic">
                        “{item.canadianToddlerSummary}”
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Closed-Loop Lyapunov Stability & Thermal Throttling Verifier */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              03.4 Interactive Thermal-Compute-Control Lyapunov Stability Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tests Solution 1 (PTP Hardware Sync) &amp; Solution 3 (Dual-Rate RT-Preempt Isolation) under Jetson Orin thermal load
            </p>
          </div>
          <span
            className={`text-xs font-mono font-semibold ${
              isLyapunovStable ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {isLyapunovStable
              ? `● Lyapunov Stable (ρ = ${spectralRadius} < 1.0)`
              : `✖ Closed-Loop Instability (ρ = ${spectralRadius} ≥ 1.0)`}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <label htmlFor="temp-slider" className="block text-xs font-mono text-slate-600">
              Jetson Orin Die Temperature: {gpuTempC} °C (Throttle threshold: 82 °C)
            </label>
            <input
              id="temp-slider"
              type="range"
              min={45}
              max={98}
              value={gpuTempC}
              onChange={(e) => setGpuTempC(Number(e.target.value))}
              className="mt-2 w-full accent-blue-600"
            />
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-800">Solution 1: Hardware PTP + SE(3) Sync</div>
              <div className="text-xs text-slate-500">Eliminates USB/MIPI timestamp drift</div>
            </div>
            <button
              type="button"
              onClick={() => setHardwarePtpSync(!hardwarePtpSync)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                hardwarePtpSync
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {hardwarePtpSync ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200">
            <div>
              <div className="text-xs font-semibold text-slate-800">Solution 3: Dual-Rate RT-Preempt Spine</div>
              <div className="text-xs text-slate-500">Decouples 1kHz EtherCAT from GPU clock</div>
            </div>
            <button
              type="button"
              onClick={() => setDualRateIsolated(!dualRateIsolated)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                dualRateIsolated
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {dualRateIsolated ? 'Isolated' : 'Coupled'}
            </button>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500">Vision Inference Latency</div>
            <div className="mt-1 text-xl font-mono font-bold tabular-nums text-slate-900">
              {visionLatencyMs}
              <span className="text-xs font-mono text-slate-400 ml-1">ms</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-mono text-slate-500">Camera-IMU Sync Jitter</div>
            <div className="mt-1 text-xl font-mono font-bold tabular-nums text-slate-900">
              {timeSyncJitterMs}
              <span className="text-xs font-mono text-slate-400 ml-1">ms</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-mono text-slate-500">EtherCAT WBC Loop Rate</div>
            <div className="mt-1 text-xl font-mono font-bold tabular-nums text-blue-700">
              {effectiveControlRateHz}
              <span className="text-xs font-mono text-slate-400 ml-1">Hz</span>
            </div>
          </div>
          <div>
            <div className="text-xs font-mono text-slate-500">Closed-Loop Spectral Radius ρ</div>
            <div
              className={`mt-1 text-xl font-mono font-bold tabular-nums ${
                isLyapunovStable ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {spectralRadius}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

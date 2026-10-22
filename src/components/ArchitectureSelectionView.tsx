import React, { useState } from 'react';
import {
  PEER_REVIEWED_ARCHITECTURES,
  PeerReviewedArchitecture,
} from '../data/roboticsContent';
import {
  computeDebiasedMetrics,
  auditSpatioTemporalSplitLeakage,
  TrajectoryBagMetadata,
} from '../utils/roboticsMath';

export const ArchitectureSelectionView: React.FC = () => {
  const [subsystemFilter, setSubsystemFilter] = useState<string>('All');
  const [selectedArchId, setSelectedArchId] = useState<string>(PEER_REVIEWED_ARCHITECTURES[0].id);

  // Interactive Confusion Matrix state for Class-Imbalance Debiasing Simulator
  const [tp, setTp] = useState<number>(48);
  const [tn, setTn] = useState<number>(9450);
  const [fp, setFp] = useState<number>(12);
  const [fn, setFn] = useState<number>(4);

  // Interactive Spatio-Temporal ROS2 Bag Split Auditor state
  const [valGapSec, setValGapSec] = useState<number>(75);
  const [sameCorridor, setSameCorridor] = useState<boolean>(false);

  const filteredArchitectures =
    subsystemFilter === 'All'
      ? PEER_REVIEWED_ARCHITECTURES
      : PEER_REVIEWED_ARCHITECTURES.filter((a) => a.subsystem === subsystemFilter);

  const activeArch: PeerReviewedArchitecture =
    PEER_REVIEWED_ARCHITECTURES.find((a) => a.id === selectedArchId) ||
    PEER_REVIEWED_ARCHITECTURES[0];

  const debiased = computeDebiasedMetrics({ tp, tn, fp, fn });

  const trainBags: TrajectoryBagMetadata[] = [
    {
      bagId: 'rosbag2_taoyuan_smt_01',
      corridorZone: 'Taoyuan_SMT_Bay_A',
      startTimestampSec: 1000,
      endTimestampSec: 1600,
      frameCount: 18000,
    },
  ];

  const valBags: TrajectoryBagMetadata[] = [
    {
      bagId: 'rosbag2_eval_02',
      corridorZone: sameCorridor ? 'Taoyuan_SMT_Bay_A' : 'Linkou_BenQ_Dialysis_Ward',
      startTimestampSec: 1600 + valGapSec,
      endTimestampSec: 2100 + valGapSec,
      frameCount: 15000,
    },
  ];

  const leakageAudit = auditSpatioTemporalSplitLeakage(trainBags, valBags, 30);

  const loadNaiveFailurePreset = () => {
    setTp(0);
    setTn(9950);
    setFp(0);
    setFn(50);
  };

  const loadSotaFocalLovaszPreset = () => {
    setTp(48);
    setTn(9940);
    setFp(10);
    setFn(2);
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-slate-500">
              01. Technology Selection &amp; Peer-Reviewed Benchmark · CVPR / ICCV / ECCV / NeurIPS / RSS (2023–2026)
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Qisda Machine Vision Product Center Architecture Matrix
            </h2>
          </div>

          {/* Interactive Filter Controls (Buttons allowed per Zero-Pill rule) */}
          <div
            className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
            role="group"
            aria-label="Filter by robotics subsystem"
          >
            {[
              'All',
              'Perception & SLAM',
              'Locomotion & Whole-Body Control',
              'Sim-to-Real & Hardware Integration',
            ].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSubsystemFilter(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  subsystemFilter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 max-w-4xl text-sm text-slate-600 leading-relaxed">
          Objective technology stack selection for the Qisda Robotics R&amp;D Engineer role (桃園市龜山區山鶯路157號),
          grounded exclusively in peer-reviewed top-conference papers and top-starred reproducible GitHub
          repositories while eliminating data leakage, modality shortcut overfitting, and class-imbalance metric bias.
        </p>
      </div>

      {/* High-Density Peer-Reviewed Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-semibold text-slate-900">
            01.1 Peer-Reviewed SOTA Stack vs. Legacy Baselines
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Click any row to inspect leakage &amp; overfitting defenses
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-mono text-slate-500 bg-slate-50/60">
                <th className="py-3 px-4 font-medium">Subsystem / JD Scope</th>
                <th className="py-3 px-4 font-medium">Selected SOTA Method</th>
                <th className="py-3 px-4 font-medium">Peer-Reviewed Venue (2023–2026)</th>
                <th className="py-3 px-4 font-medium">Official GitHub Repo</th>
                <th className="py-3 px-4 font-medium text-right">Jetson Orin Latency</th>
                <th className="py-3 px-4 font-medium text-right">Debiased MCC</th>
                <th className="py-3 px-4 font-medium text-right">AUPRC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredArchitectures.map((arch) => {
                const isSelected = arch.id === activeArch.id;
                return (
                  <tr
                    key={arch.id}
                    onClick={() => setSelectedArchId(arch.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{arch.subsystem}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{arch.jdRequirement}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-700">{arch.selectedMethod}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{arch.conferenceCitation}</td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-800">
                      {arch.officialRepo} · ★ {arch.githubStars}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {arch.jetsonLatencyMs.toFixed(1)}{' '}
                      <span className="text-xs text-slate-400">ms</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-emerald-700">
                      {arch.mccScore.toFixed(3)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-900">
                      {arch.auprcScore.toFixed(3)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Architecture Deep-Dive Bar */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-mono text-slate-500">Rejected Legacy Alternative</p>
            <p className="mt-1 text-xs text-slate-800 leading-relaxed">{activeArch.alternativeRejected}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500">Data Leakage Defense Protocol</p>
            <p className="mt-1 text-xs text-slate-800 leading-relaxed">{activeArch.leakageDefense}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500">Overfitting &amp; Shortcut Defense</p>
            <p className="mt-1 text-xs text-slate-800 leading-relaxed">{activeArch.overfittingDefense}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-slate-500">Imbalance-Resistant Metric</p>
            <p className="mt-1 text-xs text-slate-800 leading-relaxed">{activeArch.imbalanceMetric}</p>
          </div>
        </div>
      </div>

      {/* Two-Column Interactive Verification Simulators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left: Class Imbalance & Debiased Evaluation Simulator */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  01.2 Class-Imbalance Evaluation Bias Simulator
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Demonstrates why standard Accuracy is deceptive in rare-hazard AMR navigation (Saito &amp; Rehmsmeier, PLOS ONE / CVPR Long-Tail)
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={loadNaiveFailurePreset}
                  className="px-2.5 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0"
                >
                  Simulate All-Negative Dummy
                </button>
                <button
                  type="button"
                  onClick={loadSotaFocalLovaszPreset}
                  className="px-2.5 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0"
                >
                  Restore Focal-Lovasz SOTA
                </button>
              </div>
            </div>

            {/* Sliders for TP, TN, FP, FN */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="tp-input" className="block text-xs font-mono text-slate-600">
                  True Positives (TP - Detected Hazards): {tp}
                </label>
                <input
                  id="tp-input"
                  type="range"
                  min={0}
                  max={200}
                  value={tp}
                  onChange={(e) => setTp(Number(e.target.value))}
                  className="mt-1 w-full accent-blue-600"
                />
              </div>
              <div>
                <label htmlFor="fn-input" className="block text-xs font-mono text-slate-600">
                  False Negatives (FN - Missed Hazards): {fn}
                </label>
                <input
                  id="fn-input"
                  type="range"
                  min={0}
                  max={200}
                  value={fn}
                  onChange={(e) => setFn(Number(e.target.value))}
                  className="mt-1 w-full accent-blue-600"
                />
              </div>
              <div>
                <label htmlFor="fp-input" className="block text-xs font-mono text-slate-600">
                  False Positives (FP - False Alarms): {fp}
                </label>
                <input
                  id="fp-input"
                  type="range"
                  min={0}
                  max={500}
                  value={fp}
                  onChange={(e) => setFp(Number(e.target.value))}
                  className="mt-1 w-full accent-blue-600"
                />
              </div>
              <div>
                <label htmlFor="tn-input" className="block text-xs font-mono text-slate-600">
                  True Negatives (TN - Nominal Frames): {tn}
                </label>
                <input
                  id="tn-input"
                  type="range"
                  min={500}
                  max={10000}
                  step={50}
                  value={tn}
                  onChange={(e) => setTn(Number(e.target.value))}
                  className="mt-1 w-full accent-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Metric Readouts */}
          <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs font-mono text-slate-500">Naive Accuracy</div>
              <div className="mt-1 text-2xl font-mono font-bold tabular-nums text-slate-900">
                {(debiased.naiveAccuracy * 100).toFixed(2)}
                <span className="text-xs font-mono text-slate-400 ml-1">%</span>
              </div>
              <div className="text-xs font-mono text-amber-700 mt-0.5">
                Illusion: +{(debiased.accuracyIllusionDelta * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500">Balanced Accuracy</div>
              <div className="mt-1 text-2xl font-mono font-bold tabular-nums text-blue-700">
                {(debiased.balancedAccuracy * 100).toFixed(2)}
                <span className="text-xs font-mono text-slate-400 ml-1">%</span>
              </div>
              <div className="text-xs font-mono text-slate-500 mt-0.5">Imbalance 1:{Math.round(debiased.imbalanceRatio)}</div>
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500">Matthews Corr (MCC)</div>
              <div className="mt-1 text-2xl font-mono font-bold tabular-nums text-emerald-700">
                {debiased.mcc.toFixed(3)}
              </div>
              <div className="text-xs font-mono text-slate-500 mt-0.5">
                {debiased.mcc > 0.7 ? '● Calibrated' : '▲ Biased / Poor'}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500">AUPRC Proxy / F1</div>
              <div className="mt-1 text-2xl font-mono font-bold tabular-nums text-slate-900">
                {debiased.auprcApprox.toFixed(3)}
              </div>
              <div className="text-xs font-mono text-slate-500 mt-0.5">
                F1: {debiased.f1Score.toFixed(3)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Spatio-Temporal ROS2 Bag Leakage Auditor */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  01.3 Spatio-Temporal ROS2 Bag Data Leakage Auditor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Audits train/val splits for 30Hz video autocorrelation and facility corridor overlap
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-700">
                {leakageAudit.hasTemporalLeakage || leakageAudit.hasSpatialCorridorOverlap
                  ? '✖ Leakage Detected'
                  : '● Zero Leakage Verified'}
              </span>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="temporal-gap-slider" className="block text-xs font-mono text-slate-600">
                  Temporal Buffer Between Train &amp; Validation ROS2 Bags: {valGapSec} s (Min Required: 30 s)
                </label>
                <input
                  id="temporal-gap-slider"
                  type="range"
                  min={0}
                  max={120}
                  value={valGapSec}
                  onChange={(e) => setValGapSec(Number(e.target.value))}
                  className="mt-1 w-full accent-blue-600"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-700">
                  Validation Facility Zone Assignment:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSameCorridor(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                      !sameCorridor
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Disjoint Facility (Linkou Hospital)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSameCorridor(true)}
                    className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 ${
                      sameCorridor
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Same Corridor (Taoyuan SMT Line)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs font-mono text-slate-500">Temporal Buffer</div>
              <div className="mt-1 text-xl font-mono font-bold tabular-nums text-slate-900">
                {leakageAudit.minimumTemporalGapSec.toFixed(0)}
                <span className="text-xs font-mono text-slate-400 ml-1">sec</span>
              </div>
              <div className="text-xs font-mono text-slate-500 mt-0.5">
                {leakageAudit.hasTemporalLeakage ? '✖ Below 30s cutoff' : '● Safe autocorrelation gap'}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500">Corridor Isolation</div>
              <div className="mt-1 text-xl font-mono font-bold text-slate-900">
                {leakageAudit.hasSpatialCorridorOverlap ? 'Overlapped' : 'Disjoint'}
              </div>
              <div className="text-xs font-mono text-slate-500 mt-0.5">
                {leakageAudit.hasSpatialCorridorOverlap
                  ? '▲ Background texture leak'
                  : '● True OOD generalization'}
              </div>
            </div>
            <div>
              <div className="text-xs font-mono text-slate-500">Split Audit Verdict</div>
              <div
                className={`mt-1 text-sm font-mono font-semibold ${
                  leakageAudit.hasTemporalLeakage || leakageAudit.hasSpatialCorridorOverlap
                    ? 'text-rose-600'
                    : 'text-emerald-700'
                }`}
              >
                {leakageAudit.hasTemporalLeakage || leakageAudit.hasSpatialCorridorOverlap
                  ? '✖ Reject Validation Split'
                  : '● Valid Benchmark Split'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">GroupKFold(corridor_id)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

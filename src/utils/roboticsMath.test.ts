import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDebiasedMetrics,
  auditSpatioTemporalSplitLeakage,
  calculateSubsystemComplexity,
  verifyTaiwanLegalCompliance,
} from './roboticsMath';

test('computeDebiasedMetrics exposes accuracy illusion under severe 199:1 class imbalance', () => {
  // 995 True Negatives, 5 False Negatives, 0 True Positives, 0 False Positives
  // A naive classifier that predicts "Safe Corridor" 100% of the time:
  const metrics = computeDebiasedMetrics({ tp: 0, tn: 995, fp: 0, fn: 5 });

  assert.equal(metrics.naiveAccuracy, 0.995);
  assert.equal(metrics.balancedAccuracy, 0.5);
  assert.equal(metrics.mcc, 0);
  assert.ok(metrics.accuracyIllusionDelta > 0.49);
});

test('computeDebiasedMetrics rewards balanced high-precision anomaly detection', () => {
  const metrics = computeDebiasedMetrics({ tp: 48, tn: 945, fp: 5, fn: 2 });
  assert.ok(metrics.mcc > 0.9);
  assert.ok(metrics.balancedAccuracy > 0.97);
  assert.ok(metrics.f1Score > 0.92);
});

test('auditSpatioTemporalSplitLeakage detects adjacent ROS2 bag frames in same corridor', () => {
  const trainBags = [
    { bagId: 'bag_taoyuan_f1_01', corridorZone: 'SMT_Line_A', startTimestampSec: 100, endTimestampSec: 200, frameCount: 3000 },
  ];
  const valBagsLeaking = [
    { bagId: 'bag_taoyuan_f1_02', corridorZone: 'SMT_Line_A', startTimestampSec: 205, endTimestampSec: 260, frameCount: 1650 },
  ];
  const valBagsClean = [
    { bagId: 'bag_linkou_med_01', corridorZone: 'Dialysis_Ward_B', startTimestampSec: 500, endTimestampSec: 600, frameCount: 3000 },
  ];

  const leakReport = auditSpatioTemporalSplitLeakage(trainBags, valBagsLeaking, 30);
  assert.equal(leakReport.hasTemporalLeakage, true);
  assert.equal(leakReport.hasSpatialCorridorOverlap, true);
  assert.equal(leakReport.leakingBagPairs.length, 1);

  const cleanReport = auditSpatioTemporalSplitLeakage(trainBags, valBagsClean, 30);
  assert.equal(cleanReport.hasTemporalLeakage, false);
  assert.equal(cleanReport.hasSpatialCorridorOverlap, false);
});

test('calculateSubsystemComplexity evaluates Jetson AGX Orin real-time budget', () => {
  const nominal = calculateSubsystemComplexity({
    imageHeight: 640,
    imageWidth: 480,
    lidarPoints: 16384,
    voxelCount: 8192,
    stateDim: 15,
    controlDim: 12,
    horizonSteps: 20,
    etherCatSlaves: 12,
  });

  assert.equal(nominal.meetsJetsonOrinBudget, true);
  assert.ok(nominal.memorySavingsRatio > 5);
  assert.ok(nominal.etherCatCycleTimeUs < 100);
});

test('verifyTaiwanLegalCompliance enforces Trade Secrets Act, Copyright Act, and PDPA', () => {
  const cleanFiles = [
    { path: 'README.md', content: '# Clean-Room Robotics Suite\nLicensed under Apache-2.0' },
    { path: 'robotics_core.py', content: 'import torch\n# Official PyTorch AMP implementation' },
  ];
  const passResult = verifyTaiwanLegalCompliance(cleanFiles, 'Apache-2.0');
  assert.equal(passResult.isCompliant, true);
  assert.equal(passResult.flaggedPatterns.length, 0);

  const violatingFiles = [
    { path: 'leak.py', content: 'SECRET_CALIB_MATRIX = [1, 2, 3]\nID = "A123456789"' },
  ];
  const failResult = verifyTaiwanLegalCompliance(violatingFiles, 'Proprietary');
  assert.equal(failResult.isCompliant, false);
  assert.equal(failResult.tradeSecretsActPassed, false);
  assert.equal(failResult.pdpaPassed, false);
  assert.equal(failResult.spdxLicenseValid, false);
});

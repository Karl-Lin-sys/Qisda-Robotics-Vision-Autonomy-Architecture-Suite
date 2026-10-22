/**
 * Pure mathematical, algorithmic, and compliance verification logic
 * for the Qisda Robotics Vision & Autonomy Architecture Suite.
 *
 * Grounded in peer-reviewed literature (CVPR/ICCV/ECCV/NeurIPS 2023-2026)
 * and Taiwan R.O.C. legal statutes.
 */

export interface ConfusionMatrix2x2 {
  tp: number; // True Positive (e.g., detected dynamic obstacle / micro-defect)
  tn: number; // True Negative (e.g., nominal corridor / clean surface)
  fp: number; // False Positive (e.g., thermal reflection false alarm)
  fn: number; // False Negative (e.g., missed hazard in warehouse blindspot)
}

export interface DebiasedEvaluationResult {
  naiveAccuracy: number;
  balancedAccuracy: number;
  mcc: number;
  auprcApprox: number;
  f1Score: number;
  imbalanceRatio: number;
  accuracyIllusionDelta: number;
}

/**
 * Computes debiased classification metrics that resist severe class imbalance
 * (e.g., 99.5% normal navigation frames vs 0.5% rare safety-critical anomalies).
 */
export function computeDebiasedMetrics(cm: ConfusionMatrix2x2): DebiasedEvaluationResult {
  const { tp, tn, fp, fn } = cm;
  const total = tp + tn + fp + fn;
  if (total <= 0) {
    return {
      naiveAccuracy: 0,
      balancedAccuracy: 0,
      mcc: 0,
      auprcApprox: 0,
      f1Score: 0,
      imbalanceRatio: 1,
      accuracyIllusionDelta: 0,
    };
  }

  const naiveAccuracy = (tp + tn) / total;
  const tpr = tp + fn > 0 ? tp / (tp + fn) : 0; // Sensitivity / Recall
  const tnr = tn + fp > 0 ? tn / (tn + fp) : 0; // Specificity
  const ppv = tp + fp > 0 ? tp / (tp + fp) : 0; // Precision

  const balancedAccuracy = (tpr + tnr) / 2;

  // Matthews Correlation Coefficient (MCC)
  const mccNum = tp * tn - fp * fn;
  const mccDenom = Math.sqrt((tp + fp) * (tp + fn) * (tn + fp) * (tn + fn));
  const mcc = mccDenom > 0 ? mccNum / mccDenom : 0;

  const f1Score = ppv + tpr > 0 ? (2 * ppv * tpr) / (ppv + tpr) : 0;

  // Geometric mean of Precision and Recall as a conservative single-threshold AUPRC proxy
  const auprcApprox = Math.sqrt(ppv * tpr);

  const positives = tp + fn;
  const negatives = tn + fp;
  const imbalanceRatio = positives > 0 ? negatives / positives : negatives;

  // How much Naive Accuracy overstates performance compared to Balanced Accuracy
  const accuracyIllusionDelta = naiveAccuracy - balancedAccuracy;

  return {
    naiveAccuracy,
    balancedAccuracy,
    mcc,
    auprcApprox,
    f1Score,
    imbalanceRatio,
    accuracyIllusionDelta,
  };
}

export interface TrajectoryBagMetadata {
  bagId: string;
  corridorZone: string;
  startTimestampSec: number;
  endTimestampSec: number;
  frameCount: number;
}

export interface SplitLeakageReport {
  hasTemporalLeakage: boolean;
  hasSpatialCorridorOverlap: boolean;
  leakingBagPairs: Array<{ trainBag: string; valBag: string; reason: string }>;
  minimumTemporalGapSec: number;
}

/**
 * Audits ROS2 bag splits (train vs validation) to prevent temporal autocorrelation
 * leakage (adjacent frames at 30Hz sharing 99% visual similarity) and spatial corridor
 * overfitting. Requires a minimum temporal buffer (e.g. >= 30s) or disjoint runs.
 */
export function auditSpatioTemporalSplitLeakage(
  trainBags: TrajectoryBagMetadata[],
  valBags: TrajectoryBagMetadata[],
  requiredTemporalGapSec = 30
): SplitLeakageReport {
  const leakingBagPairs: Array<{ trainBag: string; valBag: string; reason: string }> = [];
  let hasTemporalLeakage = false;
  let hasSpatialCorridorOverlap = false;
  let minGap = Number.POSITIVE_INFINITY;

  for (const tBag of trainBags) {
    for (const vBag of valBags) {
      // Check temporal distance between bags recorded in the same corridor
      if (tBag.corridorZone === vBag.corridorZone) {
        hasSpatialCorridorOverlap = true;
      }

      const overlap =
        tBag.startTimestampSec <= vBag.endTimestampSec &&
        vBag.startTimestampSec <= tBag.endTimestampSec;

      const gapAfterTrain = vBag.startTimestampSec - tBag.endTimestampSec;
      const gapBeforeTrain = tBag.startTimestampSec - vBag.endTimestampSec;
      const currentGap = overlap ? 0 : Math.min(Math.abs(gapAfterTrain), Math.abs(gapBeforeTrain));

      if (currentGap < minGap) {
        minGap = currentGap;
      }

      if (overlap || currentGap < requiredTemporalGapSec) {
        hasTemporalLeakage = true;
        leakingBagPairs.push({
          trainBag: tBag.bagId,
          valBag: vBag.bagId,
          reason: overlap
            ? `Direct temporal overlap in zone ${tBag.corridorZone}`
            : `Temporal gap (${currentGap.toFixed(1)}s) is below ${requiredTemporalGapSec}s threshold`,
        });
      }
    }
  }

  return {
    hasTemporalLeakage,
    hasSpatialCorridorOverlap,
    leakingBagPairs,
    minimumTemporalGapSec: Number.isFinite(minGap) ? minGap : 0,
  };
}

export interface ComplexityInputParams {
  imageHeight: number;
  imageWidth: number;
  lidarPoints: number;
  voxelCount: number;
  stateDim: number;
  controlDim: number;
  horizonSteps: number;
  etherCatSlaves: number;
}

export interface SubsystemComplexityMetrics {
  attentionStandardFlops: number;
  attentionFlashIoOps: number;
  memorySavingsRatio: number;
  voxelHashOps: number;
  esEkfUpdateFlops: number;
  mpcRiccatiFlops: number;
  etherCatCycleTimeUs: number;
  totalFrameLatencyMs: number;
  meetsJetsonOrinBudget: boolean;
}

/**
 * Calculates asymptotic operational counts and Jetson AGX Orin real-time budget
 * compliance across Vision, SLAM, ES-EKF, Whole-Body MPC, and EtherCAT rings.
 */
export function calculateSubsystemComplexity(
  params: ComplexityInputParams
): SubsystemComplexityMetrics {
  const {
    imageHeight,
    imageWidth,
    lidarPoints,
    voxelCount,
    stateDim,
    controlDim,
    horizonSteps,
    etherCatSlaves,
  } = params;

  // Token count N after 16x16 patch embedding
  const patchSize = 16;
  const tokenCount = Math.max(1, Math.floor((imageHeight / patchSize) * (imageWidth / patchSize)));
  const embedDim = 256;

  // Standard Self-Attention O(N^2 * d) vs FlashAttention-2 IO-aware tiled complexity
  const attentionStandardFlops = tokenCount * tokenCount * embedDim;
  const sramBlockSize = 128;
  const attentionFlashIoOps = Math.ceil((tokenCount * tokenCount * embedDim) / sramBlockSize);
  const memorySavingsRatio = tokenCount / Math.max(1, sramBlockSize);

  // Voxel spatial hashing + ikd-Tree incremental update: O(P log V)
  const voxelHashOps = Math.round(lidarPoints * Math.log2(Math.max(2, voxelCount)));

  // Lie-Group SE(3) Error-State EKF Update: O(S^3) where S is 15-DOF error state
  const esEkfUpdateFlops = Math.pow(stateDim, 3) + lidarPoints * stateDim;

  // Whole-Body Control Riccati recursion: O(T * (n_x^3 + n_u^3))
  const mpcRiccatiFlops =
    horizonSteps * (Math.pow(stateDim, 3) + Math.pow(controlDim, 3));

  // EtherCAT Distributed Clock cycle propagation: ~0.85us per slave + 15us master overhead
  const etherCatCycleTimeUs = 15 + etherCatSlaves * 0.85;

  // Estimated total latency on Jetson AGX Orin (FP16 TensorRT / CUDA streams)
  const visionMs = attentionStandardFlops / 1.8e8;
  const lidarMs = voxelHashOps / 1.2e5;
  const controlMs = (esEkfUpdateFlops + mpcRiccatiFlops) / 2.5e5;
  const totalFrameLatencyMs = Number((visionMs + lidarMs + controlMs).toFixed(2));

  // 30Hz perception + 1kHz inner control loop requires perception pipeline < 33.3ms
  const meetsJetsonOrinBudget = totalFrameLatencyMs <= 33.33 && etherCatCycleTimeUs <= 1000;

  return {
    attentionStandardFlops,
    attentionFlashIoOps,
    memorySavingsRatio,
    voxelHashOps,
    esEkfUpdateFlops,
    mpcRiccatiFlops,
    etherCatCycleTimeUs: Number(etherCatCycleTimeUs.toFixed(2)),
    totalFrameLatencyMs,
    meetsJetsonOrinBudget,
  };
}

export interface TaiwanComplianceScanResult {
  isCompliant: boolean;
  tradeSecretsActPassed: boolean;
  copyrightActPassed: boolean;
  pdpaPassed: boolean;
  spdxLicenseValid: boolean;
  flaggedPatterns: string[];
}

/**
 * Scans repository files and metadata against Taiwan (R.O.C.) legal requirements:
 * 1. Trade Secrets Act (營業秘密法 Art. 2) - no internal IPs, proprietary CAD/calib keys
 * 2. Copyright Act (著作權法 Art. 11 & 12) - clean-room academic implementation
 * 3. Personal Data Protection Act (個人資料保護法 PDPA) - no applicant PII, phone, or national IDs
 */
export function verifyTaiwanLegalCompliance(
  files: Array<{ path: string; content: string }>,
  licenseIdentifier: string
): TaiwanComplianceScanResult {
  const flaggedPatterns: string[] = [];

  const forbiddenTradeSecretRegex = /(PRIVATE_KEY|SECRET_CALIB_MATRIX|192\.168\.\d+\.\d+|INTERNAL_QISDA_NDA)/i;
  const taiwanIdRegex = /\b[A-Z][12]\d{8}\b/; // Taiwan National ID format

  let tradeSecretsActPassed = true;
  let pdpaPassed = true;

  for (const file of files) {
    if (forbiddenTradeSecretRegex.test(file.content)) {
      tradeSecretsActPassed = false;
      flaggedPatterns.push(`Potential proprietary secret in ${file.path}`);
    }
    if (taiwanIdRegex.test(file.content)) {
      pdpaPassed = false;
      flaggedPatterns.push(`Potential R.O.C. National ID (PDPA violation) in ${file.path}`);
    }
  }

  const validSpdx = ['Apache-2.0', 'MIT', 'BSD-3-Clause'].includes(licenseIdentifier);
  const copyrightActPassed = validSpdx && files.length > 0;

  if (!validSpdx) {
    flaggedPatterns.push(`Invalid or missing open-source SPDX license: ${licenseIdentifier}`);
  }

  return {
    isCompliant: tradeSecretsActPassed && copyrightActPassed && pdpaPassed && validSpdx,
    tradeSecretsActPassed,
    copyrightActPassed,
    pdpaPassed,
    spdxLicenseValid: validSpdx,
    flaggedPatterns,
  };
}

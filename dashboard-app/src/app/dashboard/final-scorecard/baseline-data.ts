export const BASELINE_DATA = {
  // Overall baseline scores for each metric
  metrics: {
    overallScore: 49,
    pairingEfficiency: 56,
    pairingAssignment: 50,
    pairingRotation: 43,
    pairingFrequency: 49
  },
  
  // Target scores for each metric
  targets: {
    overallScore: 90,
    pairingEfficiency: 85,
    pairingAssignment: 80,
    pairingRotation: 75,
    pairingFrequency: 70
  },
  
  // Frequency distribution baseline
  frequencyDistribution: {
    rarely: 10,
    weekly: 20,
    severalTimesWeek: 30,
    dailyFewTimes: 25,
    continuous: 15
  },
  
  // Rotation distribution baseline
  rotationDistribution: {
    adHoc: 6,
    sprint: 13,
    weekly: 17,
    story: 25,
    daily: 38
  },
  
  // Assignment distribution baseline
  assignmentDistribution: {
    missing: 0,
    poScrumMaster: 0,
    anchorLead: 6,
    manuallyFormed: 47,
    randomized: 47
  },
  
  // Efficiency distribution baseline
  efficiencyDistribution: {
    missing: 0,
    inefficient: 0,
    marginal: 0,
    adequate: 17,
    effective: 53,
    optimal: 30
  }
}; 
export const seasonalityPresets = {
  beach:        [50,55,60,70,80,88,92,90,78,65,55,50],   // summer peak
  winterResort: [70,75,85,75,60,45,35,35,45,60,75,85],   // winter peak
  majorCity:    [62,64,72,78,82,80,78,76,82,84,76,70],   // strong year-round
  businessCity: [68,70,78,82,80,70,65,66,80,84,78,72],   // weekdays heavy, softer Jul/Aug
} as const;

export type SeasonalityPresetKey = keyof typeof seasonalityPresets;

export const presetLabels = {
  beach: "Beach Resort",
  winterResort: "Winter Resort", 
  majorCity: "Major City",
  businessCity: "Business City"
} as const;
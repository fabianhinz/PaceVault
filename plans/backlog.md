# not a backlog

## maintenance

- ios/safari map cache broken when offline
- folder structure (apply pattern skill)
- timestamps all over the place (unix ms / iso strings / whatever strings)
- stats should be migrated into matching charts (min/max/avg)
- Error Boundaries

## ideas

### new

- compare activities
- ??? "Normalized Power® (NP®), Intensity Factor® (IF®) und Training Stress Score® (TSS®) sind eingetragene Marken von Peaksware, LLC."
- carbs counter
  - no validated per-session carb method without gas exchange (±25–35%) → show a range, label "Estimated carbs burned"
  - approach: energy (per-record energy from `recordEnergySeries`, see plans/calorie-estimate.md) × CHO fraction by intensity (%FTP / %HRR)
  - RER/CHO curves: Rothschild et al. 2022, Sports Med 52:2775, doi:10.1007/s40279-022-01727-7; Romijn et al. 1993, doi:10.1152/ajpendo.1993.265.3.E380
  - kcal → g via Jeukendrup & Wallis 2005, doi:10.1055/s-2004-830512
  - intervals.icu uses Rothschild et al. 2024, doi:10.1007/s40279-024-02131-z (cycling-focused, needs VO2max + prior-day sRPE)
  - avoid trademarked terms (TSS/NP/IF, Firstbeat, Smart Fueling)
- support ".tcx" files --> the "archive" already prepared that

### improvements

- lap pick popup gets chevrons to go to the previous / next round
- preformance metrics with toggle for ctl/atl/tsb (also persisted in the store)

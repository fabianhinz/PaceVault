# Engine — Scientific Sources

Central bibliography for every published formula, model, or algorithm implemented in `src/engine/`.
Each engine file contains a short `// Sources: [KEY]` comment pointing into this table.

## Validation Summary

| Module                | Formula / Model                                           | Source Key                                                        | Verdict                                                     |
| --------------------- | --------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| `metrics.ts`          | Coggan PMC (CTL / ATL / TSB via EWMA)                     | `[CogganAllen2010]`, `[TP-PMC]`                                   | Matches published model                                     |
| `stress.ts`           | Banister TRIMP (HR-based training impulse)                | `[Banister1991]`, `[Fellrnr]`                                     | Matches published coefficients                              |
| `stress.ts`           | Coggan TSS (power-based training stress)                  | `[CogganAllen2010]`                                               | Matches published formula                                   |
| `normalize.ts`        | Normalized Power (30 s rolling → 4th power)               | `[CogganAllen2010]`                                               | Matches published algorithm                                 |
| `normalize.ts`        | Grade Adjusted Pace (Minetti energy-cost curve)           | `[Minetti2002]`                                                   | Matches published polynomial; distance-adjusted aggregation |
| `vdot.ts`             | Daniels/Gilbert VDOT & race predictions                   | `[DanielsGilbert1979]`, `[Daniels2013]`                           | Matches published tables                                    |
| `zoneDistribution.ts` | Karvonen HRR zones                                        | `[Karvonen1957]`                                                  | Matches published method                                    |
| `zoneDistribution.ts` | Coggan power zones                                        | `[CogganAllen2010]`                                               | Matches published zones                                     |
| `coaching.ts`         | Gabbett ACWR (acute:chronic workload ratio)               | `[Gabbett2016]`                                                   | Matches published thresholds                                |
| `coaching.ts`         | Friel CTL ramp-rate guidelines                            | `[Friel2009]`, `[TP-PMC]`                                         | Matches published ranges                                    |
| `zones.ts`            | Daniels pace zones (% of VDOT pace)                       | `[Daniels2013]`                                                   | Matches published zone boundaries                           |
| `trainingEffect.ts`   | Aerobic TE: Banister TRIMP → reference-anchored power-law | `[Banister1991]`, `[Karvonen1957]`, `[Swain1998]`, `[Wenger1986]` | Derived from published reference values                     |
| `trainingEffect.ts`   | Anaerobic TE: time above VT2 → reference-anchored linear  | `[Billat1999]`, `[Swain1998]`, `[Stagno2007]`, `[ACSM2018]`       | Derived from published reference values                     |
| `trainingEffect.ts`   | Fitness scaling: CTL-based divisor                        | `[CogganAllen2010]`, `[Friel2009]`                                | Matches published CTL ranges                                |
| `gps.ts`              | Ramer–Douglas–Peucker simplification                      | `[Ramer1972]`, `[DouglasPeucker1973]`                             | Standard algorithm                                          |
| `gps.ts`              | Liang–Barsky line clipping                                | `[LiangBarsky1984]`                                               | Standard algorithm                                          |
| `gps.ts`              | Initial bearing (forward azimuth)                         | `[Veness2019]`                                                    | Standard great-circle formula                               |
| `windExposure.ts`     | Head/cross/tail classification (±45° sectors)             | `[Veness2019]`                                                    | Bearing per standard formula; ±45° sectors are convention   |

## Full Bibliography

| Key                    | Citation                                                                                                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[DanielsGilbert1979]` | Daniels, J. & Gilbert, J. (1979). _Oxygen Power: Performance Tables for Distance Runners._                                                                                          |
| `[Daniels2013]`        | Daniels, J. (2013). _Daniels' Running Formula_, 3rd ed. Human Kinetics.                                                                                                             |
| `[Karvonen1957]`       | Karvonen, M.J., Kentala, E. & Mustala, O. (1957). "The effects of training on heart rate." _Ann. Med. Exp. Biol. Fenn._, 35(3), 307–315.                                            |
| `[Banister1991]`       | Banister, E.W. (1991). "Modeling elite athletic performance." In: Green et al. (eds.) _Physiological Testing of Elite Athletes_. Human Kinetics, pp. 403–424.                       |
| `[Minetti2002]`        | Minetti, A.E. et al. (2002). "Energy cost of walking and running at extreme uphill and downhill slopes." _J. Appl. Physiol._, 93(3), 1039–1046.                                     |
| `[CogganAllen2010]`    | Coggan, A. & Allen, H. (2010). _Training and Racing with a Power Meter_, 2nd ed. VeloPress.                                                                                         |
| `[Friel2009]`          | Friel, J. (2009). _The Cyclist's Training Bible_, 4th ed. VeloPress.                                                                                                                |
| `[Gabbett2016]`        | Gabbett, T.J. (2016). "The training—injury prevention paradox." _Br. J. Sports Med._, 50(5), 273–280.                                                                               |
| `[Ramer1972]`          | Ramer, U. (1972). "An iterative procedure for the polygonal approximation of plane curves." _CGIP_, 1(3), 244–256.                                                                  |
| `[DouglasPeucker1973]` | Douglas, D. & Peucker, T. (1973). "Algorithms for the reduction of the number of points." _Cartographica_, 10(2), 112–122.                                                          |
| `[LiangBarsky1984]`    | Liang, Y.D. & Barsky, B.A. (1984). "A new concept and method for line clipping." _ACM TOG_, 3(1), 1–22.                                                                             |
| `[Swain1998]`          | Swain, D.P. et al. (1998). "Target heart rates for the development of cardiorespiratory fitness." _Med. Sci. Sports Exerc._, 30(1), 112–116.                                        |
| `[Billat1999]`         | Billat, V.L. et al. (1999). "Interval training at VO2max: effects on aerobic performance and overtraining markers." _Med. Sci. Sports Exerc._, 31(1), 156–163.                      |
| `[Wenger1986]`         | Wenger, H.A. & Bell, G.J. (1986). "The interactions of intensity, frequency and duration of exercise training in altering cardiorespiratory fitness." _Sports Med._, 3(5), 346–356. |
| `[Stagno2007]`         | Stagno, K.M. et al. (2007). "Quantifying training load in rugby union." _Int. J. Sports Physiol. Perform._, 2(1), 10–19.                                                            |
| `[ACSM2018]`           | American College of Sports Medicine. (2018). _ACSM's Guidelines for Exercise Testing and Prescription_, 10th ed. Wolters Kluwer.                                                    |
| `[Fellrnr]`            | Fellrnr. "TRIMP." <https://fellrnr.com/wiki/TRIMP>                                                                                                                                  |
| `[TP-PMC]`             | TrainingPeaks. "The Science of the Performance Manager." <https://www.trainingpeaks.com/learn/articles/the-science-of-the-performance-manager/>                                     |

## App-Specific Logic

App-specific heuristics and feature logic (fingerprinting, downsampling, lap analysis, PB detection, sensor validation) live in `src/lib/`, not in the engine.

| Module              | Logic                                        | Notes                               |
| ------------------- | -------------------------------------------- | ----------------------------------- |
| `paceCalculator.ts` | Pace / distance / time arithmetic converters | Basic algebra, no published formula |

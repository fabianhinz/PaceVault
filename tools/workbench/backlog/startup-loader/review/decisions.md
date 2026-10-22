# Decisions

## Agent decisions

- [ ] **(look) In A–D the logo stays empty from the hand-off through the fade; in E and at the 10 s cap it keeps animating while it fades.** Agent: the hand-off rule is "empty logo"; cutting mid-stroke is what defines E and the cap.
- [ ] **(behaviour) At the 10 s cap every loader variant fades at once with its own fade length, without waiting for the cycle to end.** Agent: the cap should not add up to another cycle.
- [ ] **(behaviour) C on a slow load counts A's 1.5 s cycles from the moment the logo appears (700 ms), so a cold hand-off lands at 3.7 s.** Agent: C is "like A from the moment the logo appears".
- [ ] **(behaviour) On a session link reload the session track is drawn behind the loader as soon as data is ready; picking unlocks after the fade.** Agent: camera and layer are already final behind the loader (Q15).
- [ ] **(behaviour) V3 Ripple starts each track by its start point's distance from the centre of the fitted view; V6 Ground speed sets one linear speed so the 75th-percentile track takes 1.5 s.** Agent: neither was specified.
- [ ] **(scope) The mockup adds Intensity and Speed controls to the toolbar.** Agent: Intensity checks Q11 (last frame equals the final map); Speed makes the hand-off judgeable.

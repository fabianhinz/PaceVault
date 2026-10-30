## Agent decisions

- [x] **(behaviour) A foreground import badges sessions inside the window when intervals sessions already exist (e.g. reconnecting after a disconnect).** Agent: the owner chose "regardless of foreground/background"; on a first connect there is no window, so nothing is badged.
- [x] **(behaviour) On a 429 or 401, downloads already in flight are dropped and fetched again by the next sync.** Agent: matches today's stop-on-fatal behaviour without new retry logic; at most 4 wasted requests.
- [x] **(behaviour) Downloads still save in listing order (newest first), only the network part runs in parallel.** Agent: parsing runs on the main thread and saving goes through the batcher, so doing those in parallel adds no speed and risks duplicate checks running against each other.
- [x] **(look) In `preparing` the reprocess overlay keeps its "Migrating your sessions…" label; only imports show the skeleton, sized to the label line (20 × 128 px).** Agent: the reprocess label does not come from the phase map, so it stays; the skeleton has the label's line height so the ring does not shift when the label appears.

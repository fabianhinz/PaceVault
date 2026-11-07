// Writes the app's demo sessions as timed GPX files, a stand-in for a real export.
// BENCH_OUT=<folder> (default: <os tmpdir>/pv-detect-bench-demo, kept out of the repo, about 84 MB)
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { it } from 'vite-plus/test';
import demoRoutesJson from '@/lib/demo/demoRoutes.json';
import { parseDemoRoutes } from '@/lib/demo/demoRecords.ts';
import { buildDemoDataset, DEMO_SEED } from '@/components/demo/buildDemoDataset.ts';

const GPX_TYPE_BY_SPORT = { running: 'running', cycling: 'cycling' } as const;

it('generates demo GPX files', () => {
  const out = process.env.BENCH_OUT ?? path.join(tmpdir(), 'pv-detect-bench-demo');
  mkdirSync(out, { recursive: true });
  const routes = parseDemoRoutes(demoRoutesJson);
  if (!routes) throw new Error('demo routes invalid');
  const dataset = buildDemoDataset({ seed: DEMO_SEED, today: new Date(), routes });
  const sessionById = new Map(dataset.sessions.map((session) => [session.id, session]));
  let written = 0;
  for (const entry of dataset.sessionData) {
    const session = sessionById.get(entry.sessionId);
    const points = entry.records.filter((r) => r.lat !== undefined && r.lng !== undefined);
    if (!session || points.length < 2) continue;
    const trkpts = points
      .map((r) => {
        const time = new Date(session.date + r.timestamp * 1000).toISOString();
        const ele = r.elevation === undefined ? '' : `<ele>${r.elevation.toFixed(1)}</ele>`;
        return `<trkpt lat="${r.lat}" lon="${r.lng}">${ele}<time>${time}</time></trkpt>`;
      })
      .join('');
    const gpx = `<?xml version="1.0"?><gpx version="1.1" creator="detect-bench"><trk><name>${entry.sessionId}</name><type>${GPX_TYPE_BY_SPORT[session.sport]}</type><trkseg>${trkpts}</trkseg></trk></gpx>`;
    writeFileSync(path.join(out, `${entry.sessionId}.gpx`), gpx);
    written += 1;
  }
  console.log(`wrote ${written} GPX files to ${out}`);
});

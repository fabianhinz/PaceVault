import { boundaryLine, boundaryOf, cruiseRepo } from './deps.ts';

const cruise = cruiseRepo();
if (cruise === undefined) process.exit(1);
const boundary = boundaryOf(cruise);
console.log(boundaryLine(boundary));
if (boundary.violations.length > 0) process.exit(1);

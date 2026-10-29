import { colocationLine, libModuleCount, singleOwnerLibModules } from './colocation.ts';
import { boundaryLine, boundaryOf, cruiseRepo } from './deps.ts';

const cruise = cruiseRepo();
if (cruise === undefined) process.exit(1);
const boundary = boundaryOf(cruise);
console.log(boundaryLine(boundary));
const singleOwner = singleOwnerLibModules(cruise.modules);
console.log(colocationLine(singleOwner, libModuleCount(cruise.modules)));
if (boundary.violations.length > 0 || singleOwner.length > 0) process.exit(1);

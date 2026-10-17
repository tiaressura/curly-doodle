/**
 * Public entry point for curly-doodle.
 *
 * @example
 * import { pathLength, boundingBox } from "curly-doodle";
 *
 * const doodle = [{ x: 0, y: 0 }, { x: 3, y: 4 }];
 * pathLength(doodle); // 5
 * boundingBox(doodle); // { minX: 0, minY: 0, maxX: 3, maxY: 4, width: 3, height: 4 }
 */
export {
  distance,
  pathLength,
  boundingBox,
  centroid,
  clamp,
  scale,
  translate,
} from "./geometry.js";

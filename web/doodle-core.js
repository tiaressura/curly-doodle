/**
 * Pure, DOM-free helpers shared by the curly-doodle web template.
 *
 * Keeping these here (instead of inline in `app.js`) means the interesting
 * logic can be unit-tested with `node:test` without a browser.
 */
import { boundingBox, centroid, clamp, pathLength } from "../src/index.js";

/**
 * @typedef {{ x: number, y: number }} Point
 */

/**
 * Summarise a set of points for the stats panel.
 *
 * @param {Point[]} points
 * @returns {{
 *   count: number,
 *   length: number,
 *   box: ReturnType<typeof boundingBox> | null,
 *   centroid: Point | null,
 * }}
 */
export function computeStats(points) {
  if (!Array.isArray(points)) {
    throw new TypeError("points must be an array");
  }

  if (points.length === 0) {
    return { count: 0, length: 0, box: null, centroid: null };
  }

  return {
    count: points.length,
    length: pathLength(points),
    box: boundingBox(points),
    centroid: centroid(points),
  };
}

/**
 * Round a coordinate to a fixed number of decimals for tidy output.
 * @param {number} value
 * @param {number} [decimals]
 * @returns {number}
 */
export function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Serialise a polyline to an SVG path `d` string. Returns an empty string for
 * an empty polyline.
 * @param {Point[]} points
 * @returns {string}
 */
export function pointsToSvgPath(points) {
  if (!Array.isArray(points)) {
    throw new TypeError("points must be an array");
  }
  if (points.length === 0) {
    return "";
  }
  return points
    .map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${round(point.x)} ${round(point.y)}`;
    })
    .join(" ");
}

/**
 * Keep a point inside a rectangle, e.g. the canvas bounds.
 * @param {Point} point
 * @param {number} width
 * @param {number} height
 * @returns {Point}
 */
export function constrainPoint(point, width, height) {
  return {
    x: clamp(point.x, 0, width),
    y: clamp(point.y, 0, height),
  };
}

/**
 * Flatten a list of strokes (each an array of points) into a single polyline.
 * @param {Point[][]} strokes
 * @returns {Point[]}
 */
export function flattenStrokes(strokes) {
  if (!Array.isArray(strokes)) {
    throw new TypeError("strokes must be an array");
  }
  return strokes.flat();
}

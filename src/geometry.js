/**
 * Core geometry helpers for curly-doodle.
 *
 * A *point* is a plain object of the shape `{ x: number, y: number }`.
 * A *polyline* (or "doodle") is an array of points in drawing order.
 *
 * Every exported function validates its input and throws a `TypeError` for
 * malformed points/polylines, which keeps the maths below free of `NaN`s.
 */

/**
 * @typedef {{ x: number, y: number }} Point
 */

const isFiniteNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

/**
 * Assert that `value` is a well-formed point.
 * @param {unknown} value
 * @param {string} [name]
 * @returns {Point}
 */
function assertPoint(value, name = "point") {
  if (
    value === null ||
    typeof value !== "object" ||
    !isFiniteNumber(/** @type {Point} */ (value).x) ||
    !isFiniteNumber(/** @type {Point} */ (value).y)
  ) {
    throw new TypeError(`${name} must be an object with finite x and y numbers`);
  }
  return /** @type {Point} */ (value);
}

/**
 * Assert that `value` is an array of well-formed points.
 * @param {unknown} value
 * @param {{ min?: number, name?: string }} [options]
 * @returns {Point[]}
 */
function assertPolyline(value, options = {}) {
  const { min = 0, name = "points" } = options;
  if (!Array.isArray(value)) {
    throw new TypeError(`${name} must be an array of points`);
  }
  if (value.length < min) {
    throw new TypeError(`${name} must contain at least ${min} point(s)`);
  }
  value.forEach((point, index) => assertPoint(point, `${name}[${index}]`));
  return value;
}

/**
 * Euclidean distance between two points.
 * @param {Point} a
 * @param {Point} b
 * @returns {number}
 */
export function distance(a, b) {
  assertPoint(a, "a");
  assertPoint(b, "b");
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Total length of a polyline. A polyline with fewer than two points has
 * length `0`.
 * @param {Point[]} points
 * @returns {number}
 */
export function pathLength(points) {
  assertPolyline(points);
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Axis-aligned bounding box of a polyline.
 * @param {Point[]} points
 * @returns {{ minX: number, minY: number, maxX: number, maxY: number, width: number, height: number }}
 */
export function boundingBox(points) {
  assertPolyline(points, { min: 1 });
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const { x, y } of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

/**
 * Arithmetic mean of a polyline's points (the centroid).
 * @param {Point[]} points
 * @returns {Point}
 */
export function centroid(points) {
  assertPolyline(points, { min: 1 });
  let sumX = 0;
  let sumY = 0;
  for (const { x, y } of points) {
    sumX += x;
    sumY += y;
  }
  return { x: sumX / points.length, y: sumY / points.length };
}

/**
 * Constrain a number to the inclusive range `[min, max]`.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  if (!isFiniteNumber(value) || !isFiniteNumber(min) || !isFiniteNumber(max)) {
    throw new TypeError("clamp expects finite numbers for value, min and max");
  }
  if (min > max) {
    throw new RangeError("clamp expects min to be less than or equal to max");
  }
  return Math.min(Math.max(value, min), max);
}

/**
 * Scale a polyline about an optional origin, returning a new array of points.
 * @param {Point[]} points
 * @param {number} factor
 * @param {Point} [origin]
 * @returns {Point[]}
 */
export function scale(points, factor, origin = { x: 0, y: 0 }) {
  assertPolyline(points);
  if (!isFiniteNumber(factor)) {
    throw new TypeError("factor must be a finite number");
  }
  assertPoint(origin, "origin");
  return points.map(({ x, y }) => ({
    x: origin.x + (x - origin.x) * factor,
    y: origin.y + (y - origin.y) * factor,
  }));
}

/**
 * Translate a polyline by `(dx, dy)`, returning a new array of points.
 * @param {Point[]} points
 * @param {number} dx
 * @param {number} dy
 * @returns {Point[]}
 */
export function translate(points, dx, dy) {
  assertPolyline(points);
  if (!isFiniteNumber(dx) || !isFiniteNumber(dy)) {
    throw new TypeError("dx and dy must be finite numbers");
  }
  return points.map(({ x, y }) => ({ x: x + dx, y: y + dy }));
}

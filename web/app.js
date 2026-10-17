/**
 * curly-doodle web template — interactive doodle pad.
 *
 * Draw on the canvas with a mouse, stylus or finger; the stats panel updates
 * live using the geometry helpers from `../src/index.js`.
 */
import {
  computeStats,
  constrainPoint,
  flattenStrokes,
  pointsToSvgPath,
  round,
} from "./doodle-core.js";

const canvas = /** @type {HTMLCanvasElement} */ (document.querySelector("#pad"));
const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));

const els = {
  strokeCount: document.querySelector("[data-stat='strokes']"),
  pointCount: document.querySelector("[data-stat='points']"),
  length: document.querySelector("[data-stat='length']"),
  box: document.querySelector("[data-stat='box']"),
  centroid: document.querySelector("[data-stat='centroid']"),
  svgPath: document.querySelector("[data-stat='svg']"),
  undo: document.querySelector("[data-action='undo']"),
  clear: document.querySelector("[data-action='clear']"),
};

const STROKE_STYLE = {
  lineWidth: 3,
  lineJoin: "round",
  lineCap: "round",
  strokeStyle: "#8b7cff",
};

const MARKER_STYLE = {
  fillStyle: "#ff6b9d",
};

/** @type {Array<Array<{x: number, y: number}>>} */
let strokes = [];
/** @type {Array<{x: number, y: number}> | null} */
let active = null;

/** Canvas size in CSS pixels. */
function size() {
  const rect = canvas.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

/** Resize the backing store to match the CSS size and device pixel ratio. */
function resize() {
  const { width, height } = size();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

/** Convert a pointer event to canvas-relative CSS-pixel coordinates. */
function eventToPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return constrainPoint(
    { x: event.clientX - rect.left, y: event.clientY - rect.top },
    rect.width,
    rect.height,
  );
}

/** Redraw everything and refresh the stats panel. */
function render() {
  const { width, height } = size();
  ctx.clearRect(0, 0, width, height);

  ctx.lineWidth = STROKE_STYLE.lineWidth;
  ctx.lineJoin = STROKE_STYLE.lineJoin;
  ctx.lineCap = STROKE_STYLE.lineCap;
  ctx.strokeStyle = STROKE_STYLE.strokeStyle;

  for (const stroke of strokes) {
    if (stroke.length === 1) {
      // A tap: draw a dot so single points are visible.
      const [point] = stroke;
      ctx.beginPath();
      ctx.arc(point.x, point.y, STROKE_STYLE.lineWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = STROKE_STYLE.strokeStyle;
      ctx.fill();
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    for (let i = 1; i < stroke.length; i += 1) {
      ctx.lineTo(stroke[i].x, stroke[i].y);
    }
    ctx.stroke();
  }

  const stats = computeStats(flattenStrokes(strokes));

  if (stats.centroid) {
    ctx.beginPath();
    ctx.arc(stats.centroid.x, stats.centroid.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = MARKER_STYLE.fillStyle;
    ctx.fill();
  }

  updateStats(stats);
}

/** Push the computed stats into the DOM. */
function updateStats(stats) {
  els.strokeCount.textContent = String(strokes.length);
  els.pointCount.textContent = String(stats.count);
  els.length.textContent = stats.count ? `${round(stats.length, 1)} px` : "—";
  els.box.textContent = stats.box
    ? `${round(stats.box.width, 1)} × ${round(stats.box.height, 1)} px`
    : "—";
  els.centroid.textContent = stats.centroid
    ? `${round(stats.centroid.x, 1)}, ${round(stats.centroid.y, 1)}`
    : "—";
  els.svgPath.textContent = pointsToSvgPath(flattenStrokes(strokes)) || "—";

  els.undo.disabled = strokes.length === 0;
  els.clear.disabled = strokes.length === 0;
}

function startStroke(point) {
  active = [point];
  strokes.push(active);
  render();
}

function extendStroke(point) {
  if (!active) {
    return;
  }
  const last = active[active.length - 1];
  // Skip points that barely moved to keep polylines tidy.
  if (Math.hypot(point.x - last.x, point.y - last.y) < 1.5) {
    return;
  }
  active.push(point);
  render();
}

function endStroke() {
  active = null;
}

canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  startStroke(eventToPoint(event));
});

canvas.addEventListener("pointermove", (event) => {
  if (!active) {
    return;
  }
  extendStroke(eventToPoint(event));
});

canvas.addEventListener("pointerup", endStroke);
canvas.addEventListener("pointercancel", endStroke);
canvas.addEventListener("pointerleave", endStroke);

els.undo.addEventListener("click", () => {
  strokes = strokes.slice(0, -1);
  render();
});

els.clear.addEventListener("click", () => {
  strokes = [];
  render();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "z" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    strokes = strokes.slice(0, -1);
    render();
  }
});

window.addEventListener("resize", resize);

// Initial paint.
resize();

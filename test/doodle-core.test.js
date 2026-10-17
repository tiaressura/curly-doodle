import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  computeStats,
  constrainPoint,
  flattenStrokes,
  pointsToSvgPath,
  round,
} from "../web/doodle-core.js";

describe("computeStats", () => {
  it("returns an empty summary for no points", () => {
    assert.deepEqual(computeStats([]), {
      count: 0,
      length: 0,
      box: null,
      centroid: null,
    });
  });

  it("summarises a polyline", () => {
    const stats = computeStats([
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ]);
    assert.equal(stats.count, 2);
    assert.equal(stats.length, 5);
    assert.deepEqual(stats.box, {
      minX: 0,
      minY: 0,
      maxX: 3,
      maxY: 4,
      width: 3,
      height: 4,
    });
    assert.deepEqual(stats.centroid, { x: 1.5, y: 2 });
  });

  it("rejects non-arrays", () => {
    assert.throws(() => computeStats(null), TypeError);
  });
});

describe("round", () => {
  it("rounds to two decimals by default", () => {
    assert.equal(round(1.23456), 1.23);
  });

  it("honours a custom precision", () => {
    assert.equal(round(1.25, 1), 1.3);
    assert.equal(round(9.876, 0), 10);
  });
});

describe("pointsToSvgPath", () => {
  it("emits M then L commands", () => {
    assert.equal(
      pointsToSvgPath([
        { x: 0, y: 0 },
        { x: 10, y: 5 },
      ]),
      "M 0 0 L 10 5",
    );
  });

  it("rounds coordinates in the output", () => {
    assert.equal(
      pointsToSvgPath([{ x: 1.239, y: 2.5 }]),
      "M 1.24 2.5",
    );
  });

  it("returns an empty string for no points", () => {
    assert.equal(pointsToSvgPath([]), "");
  });

  it("rejects non-arrays", () => {
    assert.throws(() => pointsToSvgPath(42), TypeError);
  });
});

describe("constrainPoint", () => {
  it("clamps points into the rectangle", () => {
    assert.deepEqual(constrainPoint({ x: -5, y: 500 }, 100, 200), {
      x: 0,
      y: 200,
    });
  });

  it("leaves in-bounds points untouched", () => {
    assert.deepEqual(constrainPoint({ x: 10, y: 20 }, 100, 200), {
      x: 10,
      y: 20,
    });
  });
});

describe("flattenStrokes", () => {
  it("concatenates strokes in order", () => {
    assert.deepEqual(
      flattenStrokes([
        [{ x: 0, y: 0 }],
        [{ x: 1, y: 1 }, { x: 2, y: 2 }],
      ]),
      [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 2 }],
    );
  });

  it("returns an empty array for no strokes", () => {
    assert.deepEqual(flattenStrokes([]), []);
  });

  it("rejects non-arrays", () => {
    assert.throws(() => flattenStrokes("nope"), TypeError);
  });
});

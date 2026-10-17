import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  distance,
  pathLength,
  boundingBox,
  centroid,
  clamp,
  scale,
  translate,
} from "../src/index.js";

describe("distance", () => {
  it("computes the classic 3-4-5 triangle", () => {
    assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  });

  it("is symmetric", () => {
    const a = { x: -2, y: 7 };
    const b = { x: 5, y: -1 };
    assert.equal(distance(a, b), distance(b, a));
  });

  it("returns 0 for identical points", () => {
    assert.equal(distance({ x: 1.5, y: 2.5 }, { x: 1.5, y: 2.5 }), 0);
  });

  it("rejects malformed points", () => {
    assert.throws(() => distance({ x: 0, y: 0 }, { x: 1 }), TypeError);
    assert.throws(() => distance(null, { x: 0, y: 0 }), TypeError);
    assert.throws(() => distance({ x: NaN, y: 0 }, { x: 0, y: 0 }), TypeError);
  });
});

describe("pathLength", () => {
  it("sums the segments of a polyline", () => {
    const doodle = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 3, y: 5 },
    ];
    assert.equal(pathLength(doodle), 6);
  });

  it("is 0 for an empty or single-point polyline", () => {
    assert.equal(pathLength([]), 0);
    assert.equal(pathLength([{ x: 9, y: 9 }]), 0);
  });

  it("rejects non-arrays", () => {
    assert.throws(() => pathLength("nope"), TypeError);
  });
});

describe("boundingBox", () => {
  it("reports extents for a spread of points", () => {
    const doodle = [
      { x: 2, y: 3 },
      { x: -1, y: 8 },
      { x: 5, y: -4 },
    ];
    assert.deepEqual(boundingBox(doodle), {
      minX: -1,
      minY: -4,
      maxX: 5,
      maxY: 8,
      width: 6,
      height: 12,
    });
  });

  it("collapses to a point for a single point", () => {
    assert.deepEqual(boundingBox([{ x: 7, y: 7 }]), {
      minX: 7,
      minY: 7,
      maxX: 7,
      maxY: 7,
      width: 0,
      height: 0,
    });
  });

  it("rejects an empty polyline", () => {
    assert.throws(() => boundingBox([]), TypeError);
  });
});

describe("centroid", () => {
  it("averages the coordinates", () => {
    const doodle = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 6 },
    ];
    assert.deepEqual(centroid(doodle), { x: 2, y: 2 });
  });

  it("returns the point itself for a single point", () => {
    assert.deepEqual(centroid([{ x: -3, y: 2.5 }]), { x: -3, y: 2.5 });
  });

  it("rejects an empty polyline", () => {
    assert.throws(() => centroid([]), TypeError);
  });
});

describe("clamp", () => {
  it("leaves in-range values untouched", () => {
    assert.equal(clamp(5, 0, 10), 5);
  });

  it("clamps below and above the range", () => {
    assert.equal(clamp(-5, 0, 10), 0);
    assert.equal(clamp(42, 0, 10), 10);
  });

  it("supports negative ranges", () => {
    assert.equal(clamp(-3, -2, 2), -2);
    assert.equal(clamp(3, -2, 2), 2);
  });

  it("rejects inverted ranges and non-finite input", () => {
    assert.throws(() => clamp(1, 10, 0), RangeError);
    assert.throws(() => clamp(Infinity, 0, 10), TypeError);
  });
});

describe("scale", () => {
  it("scales about the origin by default", () => {
    assert.deepEqual(scale([{ x: 1, y: 2 }], 3), [{ x: 3, y: 6 }]);
  });

  it("scales about a custom origin", () => {
    assert.deepEqual(scale([{ x: 2, y: 2 }], 2, { x: 1, y: 1 }), [
      { x: 3, y: 3 },
    ]);
  });

  it("does not mutate the input", () => {
    const input = [{ x: 1, y: 1 }];
    scale(input, 10);
    assert.deepEqual(input, [{ x: 1, y: 1 }]);
  });

  it("rejects a non-finite factor", () => {
    assert.throws(() => scale([{ x: 0, y: 0 }], NaN), TypeError);
  });
});

describe("translate", () => {
  it("offsets every point", () => {
    assert.deepEqual(
      translate([{ x: 0, y: 0 }, { x: 1, y: 1 }], 2, -3),
      [{ x: 2, y: -3 }, { x: 3, y: -2 }],
    );
  });

  it("preserves path length", () => {
    const doodle = [{ x: 0, y: 0 }, { x: 3, y: 4 }];
    assert.equal(pathLength(translate(doodle, 100, 100)), pathLength(doodle));
  });

  it("rejects non-finite offsets", () => {
    assert.throws(() => translate([{ x: 0, y: 0 }], Infinity, 0), TypeError);
  });
});

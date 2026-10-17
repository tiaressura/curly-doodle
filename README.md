# curly-doodle

A tiny, dependency-free geometry toolkit for doodles and polylines.

Points are plain objects (`{ x, y }`) and a doodle is an array of points in
drawing order. Every helper validates its input and throws a `TypeError`
(rather than silently producing `NaN`) when handed malformed data.

## Install

No dependencies. Just Node.js 20 or newer.

```bash
git clone https://github.com/tiaressura/curly-doodle.git
cd curly-doodle
```

## Usage

```js
import { pathLength, boundingBox, centroid } from "./src/index.js";

const doodle = [
  { x: 0, y: 0 },
  { x: 3, y: 4 },
  { x: 3, y: 5 },
];

pathLength(doodle);   // 6
boundingBox(doodle);  // { minX: 0, minY: 0, maxX: 3, maxY: 5, width: 3, height: 5 }
centroid(doodle);     // { x: 2, y: 3 }
```

## API

| Function | Description |
| --- | --- |
| `distance(a, b)` | Euclidean distance between two points. |
| `pathLength(points)` | Total length of a polyline. |
| `boundingBox(points)` | Axis-aligned bounding box with `width`/`height`. |
| `centroid(points)` | Arithmetic mean of the points. |
| `clamp(value, min, max)` | Constrain a number to an inclusive range. |
| `scale(points, factor, origin?)` | Scale a polyline about an origin (non-mutating). |
| `translate(points, dx, dy)` | Translate a polyline (non-mutating). |

## Testing

Tests use the built-in [`node:test`](https://nodejs.org/api/test.html) runner —
no test framework to install.

```bash
npm test               # run the suite
npm run test:watch     # re-run on change
npm run test:coverage  # run with coverage report
```

## License

MIT

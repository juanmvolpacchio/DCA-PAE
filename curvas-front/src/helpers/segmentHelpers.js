import exponentialFitter from "./ExponentialFitter";
import { defaultColors } from "./constants";

export function getSeriesSegmentation(series, points) {
  const segments = Array();
  const segment = [];

  let firstPeak = false;
  let foundLimit = false;

  for (let i = 0; i < series.length; i++) {
    if (points[i] === "peak") {
      if (firstPeak) {
        segment.length = series.length;
        segments.push([...segment]);
      }

      segment.splice(0, segment.length);
      firstPeak = true;
      foundLimit = false;
    } else if (points[i] === "limit") foundLimit = true;

    if (firstPeak && !foundLimit) segment[i] = series[i];
  }

  if (firstPeak) {
    segment.length = series.length;
    segments.push([...segment]);
  }

  return segments;
}

export function getNormalizedSegments(segments, globalMaxQo = null) {
  return Object.fromEntries(
    segments.map((segment, i) => {
      const filteredSeg = segment.filter(
        (s, index) => s !== undefined && index < segment.length - 5
      );
      const filterSeg2WithIndexes = segment
        .map((s, index) => ({ value: s, index: index }))
        .filter((s) => s.value !== undefined);
      const filterSeg2 = filterSeg2WithIndexes.map((s) => s.value);

      // NO NORMALIZE - use real values directly
      const [qo, dea] = exponentialFitter(filterSeg2);

      const segIndexes = filterSeg2WithIndexes.map((s) => s.index);

      return [
        `Seg. ${i + 1}`,
        {
          seg: filterSeg2,
          segIndexes: segIndexes,
          t: 12, // Default extrapolation months beyond data
          qo: Number(qo.toFixed(2)),
          dea: Number(dea.toFixed(4)),
          color: defaultColors[i % defaultColors.length],
          realMaxQo: 1, // No longer needed, set to 1 for compatibility
        },
      ];
    })
  );
}

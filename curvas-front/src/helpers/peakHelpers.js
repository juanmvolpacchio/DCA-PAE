export function peakFinderOld(qoArr) {
  const peaks = [];

  let lastLeftEdge = 0,
    lastPeak = 0;
  let trend = "up";

  for (let i = 0; i < qoArr.length; i++) {
    if (qoArr[i] < qoArr[i + 1]) {
      if (trend === "down") {
        peaks[lastPeak] = {
          leftEdge: lastLeftEdge,
          rightEdge: i,
          qo: qoArr[lastPeak],
        };
        lastLeftEdge = i;
        trend = "up";
      }
    } else if (trend === "up") {
      trend = "down";
      lastPeak = i;
    }
  }

  peaks[qoArr.length - 1] = "end";

  return peaks;
}

export function peakFinder(qoArr) {
  if (!qoArr || qoArr.length === 0) return ["end"];

  // Define window size
  const windowSize = 60;
  const startIndex = Math.max(0, qoArr.length - windowSize);

  // Extract the last 60 datapoints (or fewer if array shorter)
  const window = qoArr.slice(startIndex);

  // Find maximum value and its index within the window
  const maxVal = Math.max(...window);
  const localIndex = window.indexOf(maxVal);

  // Convert local index to global index
  const globalIndex = startIndex + localIndex;
  // Construct a single "peak" object
  const peaks = [
    {
      leftEdge: globalIndex,
      rightEdge: qoArr.length - 6,
      qo: maxVal,
    },
    "end",
  ];

  return peaks;
}

export function peakFilters(peaks, params) {
  return peaks.map((peak, i, arr) =>
    // Filtro por altura
    peak.qo >= params.minHeight &&
    // Filtro por prominencia

    // Filtro por distancia
    !arr
      .slice(
        Math.max(i - params.distance, 0),
        Math.min(i + params.distance, arr.length - 1)
      )
      .find((p) => p?.qo > peak.qo) &&
    // Filtro por ancho
    peak.rightEdge - peak.leftEdge >= params.width
      ? "peak"
      : undefined
  );
}

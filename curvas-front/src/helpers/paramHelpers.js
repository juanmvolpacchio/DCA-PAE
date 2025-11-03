export function getInitialParams(qoData) {
  return {
    minHeight: Math.trunc(Math.max(...qoData) * 0.6),
    prominence: 1,
    distance: Math.trunc(qoData.length / 30),
    width: 1,
  };
}

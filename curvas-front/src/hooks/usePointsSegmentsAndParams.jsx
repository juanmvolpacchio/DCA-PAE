import { useState } from "react";

import { getInitialParams } from "../helpers/paramHelpers";
import { peakFilters, peakFinder } from "../helpers/peakHelpers";
import {
  getNormalizedSegments,
  getSeriesSegmentation,
} from "../helpers/segmentHelpers";

export default function usePointsSegmentsAndParams(series) {
  const allPeaks = peakFinder(series);
  const initialParams = getInitialParams(series);
  const initialPoints = series.map((x, i) =>
    allPeaks[0].leftEdge === i ? "peak" : undefined
  );

  const initialSegments = getSeriesSegmentation(series, initialPoints);

  const [points, setPoints] = useState(initialPoints);

  const [segments, setSegments] = useState(initialSegments);

  const [editableParams, setEditableParams] = useState(
    getNormalizedSegments(initialSegments)
  );

  function applyPeakFilter(params) {
    const newPoints = peakFilters(allPeaks, params);
    const newSegments = getSeriesSegmentation(series, newPoints);
    setPoints(newPoints);
    setSegments(newSegments);
    setEditableParams(getNormalizedSegments(newSegments));
  }

  function addNewPoint(typePoint, indexPoint) {
    const newPoints = points.with(
      indexPoint,
      points[indexPoint] === undefined ? typePoint : undefined
    );
    const newSegments = getSeriesSegmentation(series, newPoints);

    setPoints(newPoints);
    setSegments(newSegments);
    setEditableParams(getNormalizedSegments(newSegments));
  }

  function updateEditableParam(curveName, par, value) {
    if (Object.keys(editableParams).find((name) => name === curveName))
      setEditableParams({
        ...editableParams,
        [curveName]: {
          ...editableParams[curveName],
          [par]: Number(value),
        },
      });
  }

  function addEditableParam(curveName, seg, qo, dea, t, color, realMaxQo) {
    setEditableParams({
      ...editableParams,
      [curveName]: { seg, qo, dea, t, color, realMaxQo },
    });
  }

  function removeEditableParam(curveName) {
    const paramsCopy = JSON.parse(JSON.stringify(editableParams));
    delete paramsCopy[curveName];

    setEditableParams(paramsCopy);
  }

  function toggleEditableParam(curveName, seg, qo, dea, t, color, realMaxQo) {
    if (Object.keys(editableParams).find((name) => name === curveName))
      removeEditableParam(curveName);
    else addEditableParam(curveName, seg, qo, dea, t, color, realMaxQo);
  }

  return [
    points,
    segments,
    applyPeakFilter,
    addNewPoint,
    editableParams,
    updateEditableParam,
    addEditableParam,
    removeEditableParam,
    toggleEditableParam,
  ];
}

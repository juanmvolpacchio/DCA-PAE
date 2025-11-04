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

  // Calculate global max from entire series (for consistent normalization)
  const globalMaxQo = Math.max(...series.filter(s => s !== undefined && !isNaN(s)));

  // Initialize with only the first segment (Seg. 1)
  const initialNormalizedSegments = getNormalizedSegments(initialSegments, globalMaxQo);
  const [editableParams, setEditableParams] = useState(
    initialNormalizedSegments["Seg. 1"]
      ? { "Seg. 1": initialNormalizedSegments["Seg. 1"] }
      : initialNormalizedSegments
  );

  function applyPeakFilter(params) {
    const newPoints = peakFilters(allPeaks, params);
    const newSegments = getSeriesSegmentation(series, newPoints);
    setPoints(newPoints);
    setSegments(newSegments);

    // Update only the first segment (Seg. 1) with new calculated values
    const normalizedSegments = getNormalizedSegments(newSegments, globalMaxQo);
    if (normalizedSegments["Seg. 1"]) {
      setEditableParams({
        "Seg. 1": normalizedSegments["Seg. 1"]
      });
    }
  }

  function addNewPoint(typePoint, indexPoint, start_date) {
    // Clear all previous points and set only the new one
    const newPoints = series.map((_, i) => {
      if (i === indexPoint) {
        return typePoint;
      }
      return undefined;
    });

    const newSegments = getSeriesSegmentation(series, newPoints);

    setPoints(newPoints);
    setSegments(newSegments);

    // Update only the first segment (Seg. 1) with new calculated values
    const normalizedSegments = getNormalizedSegments(newSegments, globalMaxQo);
    if (normalizedSegments["Seg. 1"]) {
      setEditableParams({
        "Seg. 1": {
          ...normalizedSegments["Seg. 1"],
          start_date: start_date || null
        }
      });
    }
  }

  function updateEditableParam(curveName, par, value) {
    if (Object.keys(editableParams).find((name) => name === curveName)) {
      const updated = {
        ...editableParams,
        [curveName]: {
          ...editableParams[curveName],
          [par]: par === 'start_date' ? value : Number(value),
        },
      };
      console.log(`✓ Updated ${par}:`, value);
      setEditableParams(updated);
    } else {
      console.warn('⚠️ Curve name not found:', curveName);
    }
  }

  function updateMultipleParams(curveName, updates) {
    if (Object.keys(editableParams).find((name) => name === curveName)) {
      const updated = {
        ...editableParams,
        [curveName]: {
          ...editableParams[curveName],
          ...Object.fromEntries(
            Object.entries(updates).map(([key, value]) => [
              key,
              key === 'start_date' ? value : Number(value)
            ])
          ),
        },
      };
      console.log('✓ Updated multiple params:', updates);
      setEditableParams(updated);
    } else {
      console.warn('⚠️ Curve name not found:', curveName);
    }
  }

  function clearAllPoints() {
    console.log('🗑️ Clearing all selected points');
    const clearedPoints = series.map(() => undefined);
    setPoints(clearedPoints);
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
    updateMultipleParams,
    clearAllPoints,
  ];
}

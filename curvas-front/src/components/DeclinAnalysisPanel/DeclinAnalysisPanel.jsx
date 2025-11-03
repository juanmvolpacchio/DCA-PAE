import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

import "./ChartPanels.css";
import "./DeclinAnalysisPanel.css";

import usePointsSegmentsAndParams from "../../hooks/usePointsSegmentsAndParams";
import { useWell } from "../../hooks/useWell";
import CurveEditorPanel from "../CurveEditorPanel/CurveEditorPanel";
import SavedCurvePanel from "../SavedCurvePanel/SavedCurvePanel";
import PeakChartPanel from "../PeakChartPanel/PeakChartPanel";
import CurveEditor from "../CurveEditorPanel/CurveEditor/CurveEditor";

import { API_BASE } from "../../helpers/constants";

export default function DeclinAnalysisPanel({ wellProdSeries }) {
  const { well } = useParams();
  const { well: activeWell } = useWell();
  const { data: wellSavedCurves } = useQuery({
    queryKey: ["well", well, "curves"],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/wells/${encodeURIComponent(well)}/curves`
      );
      if (!res.ok) throw new Error("Failed to load well curves");
      const json = await res.json();
      return json.curves;
    },
    enabled: Boolean(well),
    staleTime: 60_000,
  });

  const [
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
  ] = usePointsSegmentsAndParams(wellProdSeries.efec_oil_prod);

  // Track the most recent saved curve
  const [savedCurve, setSavedCurve] = useState(null);
  const initializedRef = useRef(false);

  // Initialize editableParams with saved curve when available
  useEffect(() => {
    if (wellSavedCurves && wellSavedCurves.length > 0) {
      const mostRecentCurve = wellSavedCurves[0];
      setSavedCurve(mostRecentCurve);

      // Initialize editable params with saved curve values only once per well
      const firstSegmentName = Object.keys(editableParams)[0];
      if (firstSegmentName && mostRecentCurve && !initializedRef.current) {
        console.log('🔧 Initializing curve params from saved curve:', mostRecentCurve);

        // Update all three parameters at once
        updateMultipleParams(firstSegmentName, {
          qo: mostRecentCurve.qo,
          dea: mostRecentCurve.dea,
          t: mostRecentCurve.t
        });

        initializedRef.current = true;
      }
    }
  }, [wellSavedCurves]);

  // Reset initialization flag when well changes
  useEffect(() => {
    initializedRef.current = false;
  }, [well]);

  // Function to reset editable params to saved curve
  function handleResetToSaved() {
    if (savedCurve) {
      const firstSegmentName = Object.keys(editableParams)[0];
      if (firstSegmentName) {
        console.log('🔄 Resetting to saved curve:', savedCurve);

        // Clear all selected points from production chart
        clearAllPoints();

        // Reset parameters to saved curve values
        updateMultipleParams(firstSegmentName, {
          qo: savedCurve.qo,
          dea: savedCurve.dea,
          t: savedCurve.t
        });
      }
    }
  }

  /*
   * Fue necesario implementar este mecanismo de rerenderización forzada,
   * porque el plot no disparaba el click_event en la primera renderización.
   * Las pruebas mostraron que la correcta renderización de un plot cualquiera
   * era impedida por el segundo loader (el de la ruta "/well"), cuando
   * esperaba una promesa. Este useEffect obliga a una última renderización de
   * los componentes luego de la resolución de la promesa. Si la rerenderización
   * se hacía individualmente en cada Plot, se generaba conflicto.""
   */
  // Trigger re-render on well change

  const [chartRerenderer, setChartRerender] = useState("init");
  useEffect(() => setChartRerender(well), [well]);

  // Get activeSegment state to pass to CurveEditor
  const [activeSegment, setActiveSegment] = useState(
    Object.keys(editableParams)[0]
  );

  if (wellSavedCurves === undefined) {
    return "Loading...";
  }

  return (
    <>
      <div id="main-chart-panel">
        <div id="top-row">
          <PeakChartPanel
            series={{
              oil: wellProdSeries.efec_oil_prod,
              gas: wellProdSeries.efec_gas_prod,
              water: wellProdSeries.efec_water_prod,
              months: wellProdSeries.month,
            }}
            points={points}
            applyPeakFilter={applyPeakFilter}
            addNewPoint={addNewPoint}
          />
        </div>
        <div id="bottom-row">
          <div id="left-column">
            <SavedCurvePanel savedCurve={savedCurve} />
            <CurveEditorPanel
              wellProdSeries={wellProdSeries}
              editableParams={editableParams}
              updateEditableParam={updateEditableParam}
              removeEditableParam={removeEditableParam}
              activeWell={activeWell}
              onResetToSaved={handleResetToSaved}
              savedCurve={savedCurve}
              activeSegment={activeSegment}
              setActiveSegment={setActiveSegment}
            />
          </div>
          <div id="right-column">
            <CurveEditor
              editableParams={editableParams}
              setActiveSegment={setActiveSegment}
              wellProdSeries={wellProdSeries}
              savedCurve={savedCurve}
            />
          </div>
        </div>
      </div>
    </>
  );
}

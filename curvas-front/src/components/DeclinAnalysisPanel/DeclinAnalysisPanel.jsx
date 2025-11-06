import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col } from "react-bootstrap";

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

  // Track visibility of CurveEditorPanel (Nueva Curva)
  const [isNewCurveVisible, setIsNewCurveVisible] = useState(false);

  // Initialize editableParams with saved curve when available
  useEffect(() => {
    if (wellSavedCurves && wellSavedCurves.length > 0) {
      const mostRecentCurve = wellSavedCurves[0];
      setSavedCurve(mostRecentCurve);

      // Initialize editable params with saved curve values only once per well
      const firstSegmentName = Object.keys(editableParams)[0];
      if (firstSegmentName && mostRecentCurve && !initializedRef.current) {
        console.log('🔧 Initializing curve params from saved curve:', mostRecentCurve);

        // Find the index of the saved curve's start_date
        if (mostRecentCurve.start_date) {
          const startDateCurve = new Date(mostRecentCurve.start_date).getTime();
          const pointIndex = wellProdSeries.month.findIndex((monthStr) => {
            const monthDate = new Date(monthStr).getTime();
            return monthDate === startDateCurve;
          });

          if (pointIndex !== -1) {
            console.log('📍 Found saved curve point at index:', pointIndex);
            // Set the point on the production chart
            addNewPoint('peak', pointIndex, mostRecentCurve.start_date);
          }
        }

        // Don't overwrite qo/dea - let addNewPoint handle everything

        initializedRef.current = true;
      }
    }
  }, [wellSavedCurves, wellProdSeries.month]);

  // Reset initialization flag when well changes
  useEffect(() => {
    initializedRef.current = false;
    setIsNewCurveVisible(false); // Hide new curve panel when well changes
  }, [well]);

  // Function to reset editable params to saved curve
  function handleResetToSaved() {
    if (savedCurve) {
      const firstSegmentName = Object.keys(editableParams)[0];
      if (firstSegmentName) {
        console.log('🔄 Resetting to saved curve:', savedCurve);

        // Find the index of the saved curve's start_date and set the point
        if (savedCurve.start_date) {
          const startDateCurve = new Date(savedCurve.start_date).getTime();
          const pointIndex = wellProdSeries.month.findIndex((monthStr) => {
            const monthDate = new Date(monthStr).getTime();
            return monthDate === startDateCurve;
          });

          if (pointIndex !== -1) {
            console.log('📍 Resetting to saved curve point at index:', pointIndex);
            // Set the point on the production chart
            addNewPoint('peak', pointIndex, savedCurve.start_date);
          }
        }
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
    <Container fluid className="h-100 py-3">
      <Row className="h-100 g-3">
        {/* Columna izquierda: Curva guardada y Curva actual */}
        <Col xs={3} className="d-flex flex-column gap-3">
          <SavedCurvePanel
            savedCurve={savedCurve}
            onEdit={() => setIsNewCurveVisible(!isNewCurveVisible)}
            isEditMode={isNewCurveVisible}
          />
          {isNewCurveVisible && (
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
          )}
        </Col>

        {/* Columna derecha: Gráficos */}
        <Col xs={9} className="d-flex flex-column gap-3" style={{ height: '100%' }}>
          <div style={{ height: 'calc(50% - 6px)', minHeight: 0 }}>
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
              savedCurve={savedCurve}
              showNewCurve={isNewCurveVisible}
            />
          </div>
          <div style={{ height: 'calc(50% - 6px)', minHeight: 0 }}>
            <CurveEditor
              editableParams={editableParams}
              setActiveSegment={setActiveSegment}
              wellProdSeries={wellProdSeries}
              savedCurve={savedCurve}
              showNewCurve={isNewCurveVisible}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
}

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

  // Create separate hooks for each fluid type
  const [
    pointsOil,
    segmentsOil,
    applyPeakFilterOil,
    addNewPointOil,
    editableParamsOil,
    updateEditableParamOil,
    addEditableParamOil,
    removeEditableParamOil,
    toggleEditableParamOil,
    updateMultipleParamsOil,
    clearAllPointsOil,
  ] = usePointsSegmentsAndParams(wellProdSeries.efec_oil_prod);

  const [
    pointsGas,
    segmentsGas,
    applyPeakFilterGas,
    addNewPointGas,
    editableParamsGas,
    updateEditableParamGas,
    addEditableParamGas,
    removeEditableParamGas,
    toggleEditableParamGas,
    updateMultipleParamsGas,
    clearAllPointsGas,
  ] = usePointsSegmentsAndParams(wellProdSeries.efec_gas_prod);

  const [
    pointsWater,
    segmentsWater,
    applyPeakFilterWater,
    addNewPointWater,
    editableParamsWater,
    updateEditableParamWater,
    addEditableParamWater,
    removeEditableParamWater,
    toggleEditableParamWater,
    updateMultipleParamsWater,
    clearAllPointsWater,
  ] = usePointsSegmentsAndParams(wellProdSeries.efec_water_prod);

  // Track the most recent saved curve for each fluid type
  const [savedCurveOil, setSavedCurveOil] = useState(null);
  const [savedCurveGas, setSavedCurveGas] = useState(null);
  const [savedCurveWater, setSavedCurveWater] = useState(null);
  const initializedRef = useRef(false);

  // Track visibility of CurveEditorPanel (Nueva Curva) for each fluid type
  const [isNewCurveVisibleOil, setIsNewCurveVisibleOil] = useState(false);
  const [isNewCurveVisibleGas, setIsNewCurveVisibleGas] = useState(false);
  const [isNewCurveVisibleWater, setIsNewCurveVisibleWater] = useState(false);

  // Initialize editableParams with saved curves when available
  useEffect(() => {
    if (wellSavedCurves && wellSavedCurves.length > 0) {
      // Filter curves by fluid type
      const oilCurves = wellSavedCurves.filter(c => c.fluid_type === 'oil');
      const gasCurves = wellSavedCurves.filter(c => c.fluid_type === 'gas');
      const waterCurves = wellSavedCurves.filter(c => c.fluid_type === 'water');

      // Set most recent curve for each fluid type
      if (oilCurves.length > 0) {
        const mostRecentOil = oilCurves[0];
        setSavedCurveOil(mostRecentOil);

        // Initialize editable params with saved curve values only once per well
        const firstSegmentName = Object.keys(editableParamsOil)[0];
        if (firstSegmentName && mostRecentOil && !initializedRef.current) {
          console.log('🔧 Initializing oil curve params from saved curve:', mostRecentOil);

          // Find the index of the saved curve's start_date
          if (mostRecentOil.start_date) {
            const startDateCurve = new Date(mostRecentOil.start_date).getTime();
            const pointIndex = wellProdSeries.month.findIndex((monthStr) => {
              const monthDate = new Date(monthStr).getTime();
              return monthDate === startDateCurve;
            });

            if (pointIndex !== -1) {
              console.log('📍 Found saved oil curve point at index:', pointIndex);
              // Set the point on the production chart
              addNewPointOil('peak', pointIndex, mostRecentOil.start_date);
            }
          }

          initializedRef.current = true;
        }
      }

      if (gasCurves.length > 0) {
        setSavedCurveGas(gasCurves[0]);
      }

      if (waterCurves.length > 0) {
        setSavedCurveWater(waterCurves[0]);
      }
    }
  }, [wellSavedCurves, wellProdSeries.month]);

  // Reset initialization flag when well changes
  useEffect(() => {
    initializedRef.current = false;
    setIsNewCurveVisibleOil(false);
    setIsNewCurveVisibleGas(false);
    setIsNewCurveVisibleWater(false);
  }, [well]);

  // Functions to reset editable params to saved curve for each fluid type
  function handleResetToSavedOil() {
    if (savedCurveOil) {
      const firstSegmentName = Object.keys(editableParamsOil)[0];
      if (firstSegmentName) {
        console.log('🔄 Resetting to saved oil curve:', savedCurveOil);

        // Find the index of the saved curve's start_date and set the point
        if (savedCurveOil.start_date) {
          const startDateCurve = new Date(savedCurveOil.start_date).getTime();
          const pointIndex = wellProdSeries.month.findIndex((monthStr) => {
            const monthDate = new Date(monthStr).getTime();
            return monthDate === startDateCurve;
          });

          if (pointIndex !== -1) {
            console.log('📍 Resetting to saved oil curve point at index:', pointIndex);
            addNewPointOil('peak', pointIndex, savedCurveOil.start_date);
          }
        }
      }
    }
  }

  function handleResetToSavedGas() {
    if (savedCurveGas) {
      const firstSegmentName = Object.keys(editableParamsGas)[0];
      if (firstSegmentName && savedCurveGas.start_date) {
        console.log('🔄 Resetting to saved gas curve:', savedCurveGas);
        const startDateCurve = new Date(savedCurveGas.start_date).getTime();
        const pointIndex = wellProdSeries.month.findIndex((monthStr) => {
          const monthDate = new Date(monthStr).getTime();
          return monthDate === startDateCurve;
        });

        if (pointIndex !== -1) {
          console.log('📍 Resetting to saved gas curve point at index:', pointIndex);
          addNewPointGas('peak', pointIndex, savedCurveGas.start_date);
        }
      }
    }
  }

  function handleResetToSavedWater() {
    if (savedCurveWater) {
      const firstSegmentName = Object.keys(editableParamsWater)[0];
      if (firstSegmentName && savedCurveWater.start_date) {
        console.log('🔄 Resetting to saved water curve:', savedCurveWater);
        const startDateCurve = new Date(savedCurveWater.start_date).getTime();
        const pointIndex = wellProdSeries.month.findIndex((monthStr) => {
          const monthDate = new Date(monthStr).getTime();
          return monthDate === startDateCurve;
        });

        if (pointIndex !== -1) {
          console.log('📍 Resetting to saved water curve point at index:', pointIndex);
          addNewPointWater('peak', pointIndex, savedCurveWater.start_date);
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

  // Get activeSegment state to pass to CurveEditor for each fluid type
  const [activeSegmentOil, setActiveSegmentOil] = useState(
    Object.keys(editableParamsOil)[0]
  );
  const [activeSegmentGas, setActiveSegmentGas] = useState(
    Object.keys(editableParamsGas)[0]
  );
  const [activeSegmentWater, setActiveSegmentWater] = useState(
    Object.keys(editableParamsWater)[0]
  );

  if (wellSavedCurves === undefined) {
    return "Loading...";
  }

  return (
    <Container fluid className="h-100 py-3">
      <PeakChartPanel
        series={{
          oil: wellProdSeries.efec_oil_prod,
          gas: wellProdSeries.efec_gas_prod,
          water: wellProdSeries.efec_water_prod,
          months: wellProdSeries.month,
        }}
        // Oil props
        pointsOil={pointsOil}
        applyPeakFilterOil={applyPeakFilterOil}
        addNewPointOil={addNewPointOil}
        editableParamsOil={editableParamsOil}
        updateEditableParamOil={updateEditableParamOil}
        removeEditableParamOil={removeEditableParamOil}
        activeSegmentOil={activeSegmentOil}
        setActiveSegmentOil={setActiveSegmentOil}
        // Gas props
        pointsGas={pointsGas}
        addNewPointGas={addNewPointGas}
        editableParamsGas={editableParamsGas}
        updateEditableParamGas={updateEditableParamGas}
        removeEditableParamGas={removeEditableParamGas}
        activeSegmentGas={activeSegmentGas}
        setActiveSegmentGas={setActiveSegmentGas}
        // Water props
        pointsWater={pointsWater}
        addNewPointWater={addNewPointWater}
        editableParamsWater={editableParamsWater}
        updateEditableParamWater={updateEditableParamWater}
        removeEditableParamWater={removeEditableParamWater}
        activeSegmentWater={activeSegmentWater}
        setActiveSegmentWater={setActiveSegmentWater}
        // Saved curves
        savedCurveOil={savedCurveOil}
        savedCurveGas={savedCurveGas}
        savedCurveWater={savedCurveWater}
        // Visibility states
        isNewCurveVisibleOil={isNewCurveVisibleOil}
        isNewCurveVisibleGas={isNewCurveVisibleGas}
        isNewCurveVisibleWater={isNewCurveVisibleWater}
        setIsNewCurveVisibleOil={setIsNewCurveVisibleOil}
        setIsNewCurveVisibleGas={setIsNewCurveVisibleGas}
        setIsNewCurveVisibleWater={setIsNewCurveVisibleWater}
        // Reset functions
        handleResetToSavedOil={handleResetToSavedOil}
        handleResetToSavedGas={handleResetToSavedGas}
        handleResetToSavedWater={handleResetToSavedWater}
        // Common props
        wellProdSeries={wellProdSeries}
        activeWell={activeWell}
      />
    </Container>
  );
}

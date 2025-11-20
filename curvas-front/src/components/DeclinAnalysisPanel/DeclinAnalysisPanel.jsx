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
  const { wellNames } = useParams();
  const { well: activeWell } = useWell();

  // Check if single or multiple wells
  const isSingleWell = wellNames && !wellNames.includes(',');
  const wellNamesArray = wellNames ? wellNames.split(',') : [];

  // State for extrapolation months (for multiple wells)
  const [mesesExtrapolacion, setMesesExtrapolacion] = useState(12);

  // Fetch saved curves for single well
  const { data: wellSavedCurves, isLoading: isLoadingCurves } = useQuery({
    queryKey: ["well", wellNames, "curves"],
    queryFn: async () => {
      const res = await fetch(
        `${API_BASE}/wells/${encodeURIComponent(wellNames)}/curves`
      );
      if (!res.ok) throw new Error("Failed to load well curves");
      const json = await res.json();
      return json.curves;
    },
    enabled: isSingleWell,
    staleTime: 60_000,
  });

  // Fetch saved curves for all wells when multiple wells selected
  const { data: allWellsCurves, isLoading: isLoadingAllCurves } = useQuery({
    queryKey: ["wells", wellNamesArray, "curves"],
    queryFn: async () => {
      const promises = wellNamesArray.map(async (wellName) => {
        try {
          const res = await fetch(
            `${API_BASE}/wells/${encodeURIComponent(wellName)}/curves`
          );
          if (!res.ok) return { wellName, curves: [] };
          const json = await res.json();
          return { wellName, curves: json.curves };
        } catch (error) {
          console.error(`Error fetching curves for ${wellName}:`, error);
          return { wellName, curves: [] };
        }
      });
      return await Promise.all(promises);
    },
    enabled: !isSingleWell && wellNamesArray.length > 1,
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
  }, [wellNames]);

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
  useEffect(() => setChartRerender(wellNames), [wellNames]);

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

  // Calculate extrapolated series for multiple wells
  const calculateMultiWellExtrapolation = () => {
    if (isSingleWell || !allWellsCurves || allWellsCurves.length === 0) {
      return null;
    }

    // Calculate extrapolated values for each fluid type
    const extrapolatedOil = [];
    const extrapolatedGas = [];
    const extrapolatedWater = [];
    const extrapolatedMonths = [];

    // Get the last production month
    const lastMonth = wellProdSeries.month[wellProdSeries.month.length - 1];
    const lastMonthDate = new Date(lastMonth);

    // For each future month of extrapolation
    for (let monthIndex = 0; monthIndex < mesesExtrapolacion; monthIndex++) {
      let totalOil = 0;
      let totalGas = 0;
      let totalWater = 0;

      // Sum contributions from all wells' saved curves
      allWellsCurves.forEach(({ wellName, curves }) => {
        // Get most recent curve for each fluid type
        const oilCurve = curves.find(c => c.fluid_type === 'oil');
        const gasCurve = curves.find(c => c.fluid_type === 'gas');
        const waterCurve = curves.find(c => c.fluid_type === 'water');

        // For oil curve - calculate from current position, not from month 0
        if (oilCurve && oilCurve.start_date) {
          const qo = Number(oilCurve.qo);
          const dea = Number(oilCurve.dea);

          // Calculate how many months have passed since curve started
          const startDate = new Date(oilCurve.start_date);
          const monthsSinceStart = (lastMonthDate.getFullYear() - startDate.getFullYear()) * 12
                                 + (lastMonthDate.getMonth() - startDate.getMonth());

          // Calculate value for this extrapolation month from current position
          const n = monthsSinceStart + monthIndex;
          totalOil += qo * Math.E ** (-dea * n);
        }

        // For gas curve
        if (gasCurve && gasCurve.start_date) {
          const qo = Number(gasCurve.qo);
          const dea = Number(gasCurve.dea);

          const startDate = new Date(gasCurve.start_date);
          const monthsSinceStart = (lastMonthDate.getFullYear() - startDate.getFullYear()) * 12
                                 + (lastMonthDate.getMonth() - startDate.getMonth());

          const n = monthsSinceStart + monthIndex;
          totalGas += qo * Math.E ** (-dea * n);
        }

        // For water curve
        if (waterCurve && waterCurve.start_date) {
          const qo = Number(waterCurve.qo);
          const dea = Number(waterCurve.dea);

          const startDate = new Date(waterCurve.start_date);
          const monthsSinceStart = (lastMonthDate.getFullYear() - startDate.getFullYear()) * 12
                                 + (lastMonthDate.getMonth() - startDate.getMonth());

          const n = monthsSinceStart + monthIndex;
          totalWater += qo * Math.E ** (-dea * n);
        }
      });

      extrapolatedOil.push(totalOil);
      extrapolatedGas.push(totalGas);
      extrapolatedWater.push(totalWater);

      // Calculate the month date
      const extrapDate = new Date(lastMonthDate);
      extrapDate.setMonth(extrapDate.getMonth() + monthIndex + 1);
      extrapolatedMonths.push(extrapDate.toISOString());
    }

    return {
      oil: extrapolatedOil,
      gas: extrapolatedGas,
      water: extrapolatedWater,
      months: extrapolatedMonths,
    };
  };

  const multiWellExtrapolation = calculateMultiWellExtrapolation();

  // Only show loading for single wells waiting for saved curves
  if (isSingleWell && isLoadingCurves) {
    return "Loading...";
  }

  // Calculate display title
  const getDisplayTitle = () => {
    if (!wellNames) return "";
    const wellCount = wellNames.split(',').length;
    if (wellCount === 1) {
      return wellNames;
    }
    return `Mostrando acumulado (${wellCount} pozos)`;
  };

  return (
    <Container fluid className="h-100 py-3">
      {wellNames && (
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">{getDisplayTitle()}</h4>
          {!isSingleWell && (
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="meses-extrapolacion" style={{ whiteSpace: 'nowrap' }}>
                Meses Extrapolación:
              </label>
              <input
                id="meses-extrapolacion"
                type="number"
                min="1"
                max="120"
                value={mesesExtrapolacion}
                onChange={(e) => setMesesExtrapolacion(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: '80px' }}
                className="form-control form-control-sm"
              />
            </div>
          )}
        </div>
      )}
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
        // Multiple wells flag
        isSingleWell={isSingleWell}
        // Multi-well extrapolation
        multiWellExtrapolation={multiWellExtrapolation}
        mesesExtrapolacion={mesesExtrapolacion}
      />
    </Container>
  );
}

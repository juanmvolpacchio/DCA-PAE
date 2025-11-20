import { useState } from "react";

import { getInitialParams } from "../../helpers/paramHelpers";
import PeakChart from "./PeakChart/PeakChart";
import GasChart from "./PeakChart/GasChart";
import WaterChart from "./PeakChart/WaterChart";
import SavedCurvePanel from "../SavedCurvePanel/SavedCurvePanel";
import CurveEditorPanel from "../CurveEditorPanel/CurveEditorPanel";

export default function PeakChartPanel({
  series,
  // Oil props
  pointsOil,
  applyPeakFilterOil,
  addNewPointOil,
  editableParamsOil,
  updateEditableParamOil,
  removeEditableParamOil,
  activeSegmentOil,
  setActiveSegmentOil,
  // Gas props
  pointsGas,
  addNewPointGas,
  editableParamsGas,
  updateEditableParamGas,
  removeEditableParamGas,
  activeSegmentGas,
  setActiveSegmentGas,
  // Water props
  pointsWater,
  addNewPointWater,
  editableParamsWater,
  updateEditableParamWater,
  removeEditableParamWater,
  activeSegmentWater,
  setActiveSegmentWater,
  // Saved curves
  savedCurveOil,
  savedCurveGas,
  savedCurveWater,
  // Visibility states
  isNewCurveVisibleOil,
  isNewCurveVisibleGas,
  isNewCurveVisibleWater,
  setIsNewCurveVisibleOil,
  setIsNewCurveVisibleGas,
  setIsNewCurveVisibleWater,
  // Reset functions
  handleResetToSavedOil,
  handleResetToSavedGas,
  handleResetToSavedWater,
  // Common props
  wellProdSeries,
  activeWell,
  // Multiple wells flag
  isSingleWell,
  // Multi-well extrapolation
  multiWellExtrapolation,
  mesesExtrapolacion,
}) {
  const chartParams = {
    minHeight: "Altura",
    //prominence: 'Prominencia',
    distance: "Distancia",
    width: "Ancho",
  };

  const [peakParams, setPeakParams] = useState(getInitialParams(series.oil));

  function handleParamsChange(newValue, param) {
    const newParams = {
      ...peakParams,
      [param]: newValue >= 0 ? newValue : 0,
    };

    setPeakParams(newParams);

    applyPeakFilterOil(newParams);
  }

  return (
    <div id="peak-chart-container" className="chart-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px', width: '100%', overflowX: 'hidden' }}>
      {/* Row 1: Oil Graph + Panels */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-start', width: '100%' }}>
        <div style={{ width: isSingleWell ? 'calc(50% - 10px)' : '100%', flexShrink: 0, height: '40vh', minHeight: '300px' }}>
          <PeakChart
            series={series}
            points={pointsOil}
            addNewPoint={addNewPointOil}
            savedCurve={savedCurveOil}
            showNewCurve={isNewCurveVisibleOil}
            editableParams={editableParamsOil}
            isSingleWell={isSingleWell}
            multiWellExtrapolation={multiWellExtrapolation}
            mesesExtrapolacion={mesesExtrapolacion}
          />
        </div>
        {isSingleWell && (
          <>
            <div style={{ width: 'calc(25% - 5px)', flexShrink: 0 }}>
              <SavedCurvePanel
                savedCurve={savedCurveOil}
                onEdit={() => setIsNewCurveVisibleOil(!isNewCurveVisibleOil)}
                isEditMode={isNewCurveVisibleOil}
                fluidType="oil"
              />
            </div>
            <div style={{ width: 'calc(25% - 5px)', flexShrink: 0 }}>
              {isNewCurveVisibleOil && (
                <CurveEditorPanel
                  wellProdSeries={wellProdSeries}
                  editableParams={editableParamsOil}
                  updateEditableParam={updateEditableParamOil}
                  removeEditableParam={removeEditableParamOil}
                  activeWell={activeWell}
                  onResetToSaved={handleResetToSavedOil}
                  savedCurve={savedCurveOil}
                  activeSegment={activeSegmentOil}
                  setActiveSegment={setActiveSegmentOil}
                  fluidType="oil"
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Row 2: Gas Graph + Panels */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-start', width: '100%' }}>
        <div style={{ width: isSingleWell ? 'calc(50% - 10px)' : '100%', flexShrink: 0, height: '40vh', minHeight: '300px' }}>
          <GasChart
            series={series}
            points={pointsGas}
            addNewPoint={addNewPointGas}
            savedCurve={savedCurveGas}
            showNewCurve={isNewCurveVisibleGas}
            editableParams={editableParamsGas}
            isSingleWell={isSingleWell}
            multiWellExtrapolation={multiWellExtrapolation}
            mesesExtrapolacion={mesesExtrapolacion}
          />
        </div>
        {isSingleWell && (
          <>
            <div style={{ width: 'calc(25% - 5px)', flexShrink: 0 }}>
              <SavedCurvePanel
                savedCurve={savedCurveGas}
                onEdit={() => setIsNewCurveVisibleGas(!isNewCurveVisibleGas)}
                isEditMode={isNewCurveVisibleGas}
                fluidType="gas"
              />
            </div>
            <div style={{ width: 'calc(25% - 5px)', flexShrink: 0 }}>
              {isNewCurveVisibleGas && (
                <CurveEditorPanel
                  wellProdSeries={wellProdSeries}
                  editableParams={editableParamsGas}
                  updateEditableParam={updateEditableParamGas}
                  removeEditableParam={removeEditableParamGas}
                  activeWell={activeWell}
                  onResetToSaved={handleResetToSavedGas}
                  savedCurve={savedCurveGas}
                  activeSegment={activeSegmentGas}
                  setActiveSegment={setActiveSegmentGas}
                  fluidType="gas"
                />
              )}
            </div>
          </>
        )}
      </div>

      {/* Row 3: Water Graph + Panels */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-start', width: '100%' }}>
        <div style={{ width: isSingleWell ? 'calc(50% - 10px)' : '100%', flexShrink: 0, height: '40vh', minHeight: '300px' }}>
          <WaterChart
            series={series}
            points={pointsWater}
            addNewPoint={addNewPointWater}
            savedCurve={savedCurveWater}
            showNewCurve={isNewCurveVisibleWater}
            editableParams={editableParamsWater}
            isSingleWell={isSingleWell}
            multiWellExtrapolation={multiWellExtrapolation}
            mesesExtrapolacion={mesesExtrapolacion}
          />
        </div>
        {isSingleWell && (
          <>
            <div style={{ width: 'calc(25% - 5px)', flexShrink: 0 }}>
              <SavedCurvePanel
                savedCurve={savedCurveWater}
                onEdit={() => setIsNewCurveVisibleWater(!isNewCurveVisibleWater)}
                isEditMode={isNewCurveVisibleWater}
                fluidType="water"
              />
            </div>
            <div style={{ width: 'calc(25% - 5px)', flexShrink: 0 }}>
              {isNewCurveVisibleWater && (
                <CurveEditorPanel
                  wellProdSeries={wellProdSeries}
                  editableParams={editableParamsWater}
                  updateEditableParam={updateEditableParamWater}
                  removeEditableParam={removeEditableParamWater}
                  activeWell={activeWell}
                  onResetToSaved={handleResetToSavedWater}
                  savedCurve={savedCurveWater}
                  activeSegment={activeSegmentWater}
                  setActiveSegment={setActiveSegmentWater}
                  fluidType="water"
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

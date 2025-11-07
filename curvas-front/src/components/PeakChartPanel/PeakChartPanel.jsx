import { useState } from "react";

import { getInitialParams } from "../../helpers/paramHelpers";
import PeakChart from "./PeakChart/PeakChart";
import GasChart from "./PeakChart/GasChart";
import WaterChart from "./PeakChart/WaterChart";

export default function PeakChartPanel({
  series,
  points,
  applyPeakFilter,
  addNewPoint,
  savedCurve,
  showNewCurve,
  editableParams,
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

    applyPeakFilter(newParams);
  }

  return (
    <div id="peak-chart-container" className="chart-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>
      <div style={{ height: '40vh', minHeight: '300px' }}>
        <PeakChart
          series={series}
          points={points}
          addNewPoint={addNewPoint}
          savedCurve={savedCurve}
          showNewCurve={showNewCurve}
          editableParams={editableParams}
        />
      </div>
      <div style={{ height: '40vh', minHeight: '300px' }}>
        <GasChart series={series} />
      </div>
      <div style={{ height: '40vh', minHeight: '300px' }}>
        <WaterChart series={series} />
      </div>
    </div>
  );
}

import { useState } from "react";

import { getInitialParams } from "../../helpers/paramHelpers";
import PeakChart from "./PeakChart/PeakChart";

export default function PeakChartPanel({
  series,
  points,
  applyPeakFilter,
  addNewPoint,
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
    <div id="peak-chart-container" className="chart-panel">
      {/* <div className="param-panel">
        <h3>Filtro picos</h3>
        <div className="filter-container">
          {Object.keys(chartParams).map((par) => {
            return (
              <div key={par} className="filter-viewer">
                <label htmlFor={par}>{chartParams[par]}</label>
                <input
                  id={par}
                  type="number"
                  step={1}
                  value={peakParams[par]}
                  onChange={(e) =>
                    handleParamsChange(Number(e.target.value), par)
                  }
                />
              </div>
            );
          })}
        </div>
      </div> */}
      <PeakChart series={series} points={points} addNewPoint={addNewPoint} />
    </div>
  );
}

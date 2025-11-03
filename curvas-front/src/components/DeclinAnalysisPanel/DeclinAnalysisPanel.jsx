import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "./ChartPanels.css";
import "./DeclinAnalysisPanel.css";

import usePointsSegmentsAndParams from "../../hooks/usePointsSegmentsAndParams";
import { useWell } from "../../hooks/useWell";
import CurveEditorPanel from "../CurveEditorPanel/CurveEditorPanel";
import FittedCurveChart from "../FittedCurveChart/FittedCurveChart";
import PeakChartPanel from "../PeakChartPanel/PeakChartPanel";
import SegmentChart from "../SegmentChart/SegmentChart";

import { API_BASE } from "../../helpers/constants";
import { getNormalizedSegments } from "../../helpers/segmentHelpers";
import SavedCurveChart from "../SavedCurveChart/SavedCurveChart";

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
  ] = usePointsSegmentsAndParams(wellProdSeries.efec_oil_prod);

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

  if (wellSavedCurves === undefined) {
    return "Loading...";
  }

  return (
    <>
      <div id="main-chart-panel">
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
        <CurveEditorPanel
          wellProdSeries={wellProdSeries}
          editableParams={editableParams}
          updateEditableParam={updateEditableParam}
          removeEditableParam={removeEditableParam}
          activeWell={activeWell}
        />
      </div>
      {/* <div id="unresp-chart-panel">
        <SegmentChart segments={segments} />
        <FittedCurveChart segments={getNormalizedSegments(segments)} />
        <SavedCurveChart
          savedCurves={wellSavedCurves}
          toggleEditableParam={toggleEditableParam}
        />
      </div> */}
    </>
  );
}

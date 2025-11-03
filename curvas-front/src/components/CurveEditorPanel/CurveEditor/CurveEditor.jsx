import { useEffect, useState } from "react";

import Plot from "react-plotly.js";

const getLayoutXAxis = (wellProdSeries, editableParams, zoomRanges) => {
  const months = wellProdSeries.month
    .filter((x, i) => editableParams["Seg. 1"].segIndexes.includes(i))
    .map((month) =>
      new Date(month).toLocaleDateString("es-ES", {
        month: "numeric",
        year: "numeric",
      })
    );
  const total = months.length;
  const maxTicks = 15;
  const step = Math.ceil(total / maxTicks);
  const tickvals = Array.from({ length: total }, (_, i) => i + 1).filter(
    (v) => (v - 1) % step === 0
  );
  const ticktext = months.filter((_, i) => i % step === 0);
  return {
    title: "Mes",
    titlefont: { size: 9 },
    tickfont: { size: 7 },
    range: zoomRanges.x,
    ticktext: ticktext,
    tickvals: tickvals,
    tickangle: -45,
    automargin: true,
  };
};

export default function CurveEditor({
  editableParams,
  setActiveSegment,
  wellProdSeries,
}) {
  const lastMonthlyProd = wellProdSeries.efec_oil_prod.at(-1);

  const [visibleLines, setVisibleLines] = useState(
    Object.fromEntries(
      Object.entries(editableParams).map(([name, par]) => [
        name,
        par.seg ? true : "legendonly",
      ])
    )
  );

  const [logScale, setLogScale] = useState(false);

  const initialRanges = {
    x: [0, 120],
    y: [0, Math.max(...Object.values(editableParams).map((p) => p.qo)) * 1.1],
  };

  const [zoomRanges, setZoomRanges] = useState(initialRanges);

  const [windowSize, setWindowSize] = useState({
    x: window.innerWidth,
    y: window.innerHeight,
  });

  useEffect(() => {
    function updateSize() {
      setWindowSize({
        x: window.innerWidth,
        y: window.innerHeight,
      });
    }

    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return (
    <div className="chart-displayer">
      <Plot
        data={Object.entries(editableParams)
          .map(([name, par]) => {
            return [
              {
                x: Array.from(new Array(par.t), (x, n) => n + 1),
                y: Array.from(
                  new Array(par.t),
                  (x, n) => par.qo * Math.E ** (-par.dea * n)
                ),
                type: "scatter",
                mode: "lines",
                line: {
                  width: 2,
                  color: par.color,
                },
                text: Array.from(
                  new Array(par.t),
                  (x, i) =>
                    `Acumulada al mes ${i + 1}: ${Array.from(
                      new Array(i + 1),
                      (x, n) => lastMonthlyProd * Math.E ** (-par.dea * n)
                    )
                      .reduce((n, ac) => n + ac, 0)
                      .toFixed(2)}m3`
                ),
                hovertemplate: "%{text}<extra></extra>",
                hoverlabel: {
                  font: {
                    size: 10,
                  },
                },
                name,
                visible: visibleLines[name],
                showlegend: true,
              },
              {
                x: par.seg?.map((s, i) => i + 1),
                y: par.seg,
                type: "scatter",
                mode: "markers",
                marker: {
                  size: 4,
                  color: par.color,
                },
                text: par.seg?.map(
                  (s, i) =>
                    `Real mes ${i + 1}: ${(s * par.realMaxQo).toFixed(2)}m3`
                ),
                hovertemplate: "%{text}<extra></extra>",
                hoverlabel: {
                  font: {
                    size: 10,
                  },
                },
                name,
                visible: visibleLines[name],
                showlegend: false,
              },
            ];
          })
          .flat()}
        layout={{
          plot_bgcolor: "#eee",
          paper_bgcolor: "#faf3e1",
          width: windowSize.x * 0.82 - (140 + 220 + 100), // Resta $main-left-padding, $main-right-padding y width de .param-panel
          height: windowSize.y * 0.42 - 38, //Resta $height-header
          margin: {
            l: 30,
            r: 10,
            b: 30,
            t: 25,
            pad: 2,
          },
          legend: {
            title: "Curvas",
            font: { size: 8 },
            orientation: "v",
          },
          xaxis: getLayoutXAxis(wellProdSeries, editableParams, zoomRanges),
          yaxis: {
            title: "Oil [m3]",
            titlefont: { size: 9 },
            tickfont: { size: 7 },
            range: logScale ? "sarasa" : zoomRanges.y,
            type: logScale ? "log" : "linear",
          },
        }}
        onClick={({ points }) => setActiveSegment(points[0].data.name)}
        onLegendClick={(e) => {
          const clickedName = e.data[e.curveNumber].name;

          setVisibleLines({
            ...visibleLines,
            [clickedName]:
              visibleLines[clickedName] === true ? "legendonly" : true,
          });

          return false;
        }}
        onRelayout={(newRanges) => {
          const ranges = newRanges["xaxis.autorange"]
            ? initialRanges
            : {
                x: [newRanges["xaxis.range[0]"], newRanges["xaxis.range[1]"]],
                y: [newRanges["yaxis.range[0]"], newRanges["yaxis.range[1]"]],
              };
          setZoomRanges(ranges);
        }}
        config={{
          displaylogo: false,
          modeBarButtonsToRemove: [
            "zoom2d",
            "zoomIn2d",
            "zoomOut2d",
            "select2d",
            "lasso2d",
            "pan",
            "resetScale2d",
          ],
        }}
      />
      <label htmlFor="log-check" className="log-check-label">
        <input
          id="log-check"
          type="checkbox"
          checked={logScale}
          onChange={(e) => setLogScale(e.target.checked)}
        />
        Log
      </label>
    </div>
  );
}

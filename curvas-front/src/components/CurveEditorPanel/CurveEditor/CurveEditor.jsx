import { useEffect, useState, useRef } from "react";

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
  savedCurve,
}) {
  console.log('🎨 CurveEditor render - editableParams:', editableParams);

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

  // Calculate max Qo including saved curve
  const maxQo = Math.max(
    ...Object.values(editableParams).map((p) => p.qo),
    savedCurve?.qo || 0
  );

  const initialRanges = {
    x: [0, 120],
    y: [0, maxQo * 1.1],
  };

  const [zoomRanges, setZoomRanges] = useState(initialRanges);

  const [containerSize, setContainerSize] = useState({
    width: 600,
    height: 400,
  });

  const containerRef = useRef(null);
  const plotRef = useRef(null);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Match production chart height: 42vh - 38px, minus padding
        const maxHeight = window.innerHeight * 0.42 - 38 - 20;
        setContainerSize({
          width: Math.max(rect.width - 20, 300), // Account for padding, min 300px
          height: Math.min(Math.max(rect.height - 20, 200), maxHeight), // Limit to production chart height
        });
      }
    }

    // Initial sizing with a small delay to ensure DOM is ready
    setTimeout(updateSize, 100);

    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Auto-scale when editableParams or savedCurve change
  useEffect(() => {
    if (plotRef.current) {
      console.log('📐 Auto-scaling chart');
      // Trigger autoscale by resetting to initial ranges based on current data
      const allQoValues = [
        ...Object.values(editableParams).map(p => p.qo),
        savedCurve?.qo || 0
      ].filter(v => v > 0);

      const allTValues = [
        ...Object.values(editableParams).map(p => p.t),
        savedCurve?.t || 0
      ].filter(v => v > 0);

      if (allQoValues.length > 0 && allTValues.length > 0) {
        const newMaxQo = Math.max(...allQoValues);
        const newMaxT = Math.max(...allTValues);

        const newRanges = {
          x: [0, Math.min(newMaxT * 1.1, 240)],
          y: [0, newMaxQo * 1.1],
        };

        setZoomRanges(newRanges);
      }
    }
  }, [editableParams, savedCurve]);

  // Generate saved curve data
  const savedCurveData = savedCurve
    ? [
        {
          x: Array.from(new Array(Number(savedCurve.t)), (x, n) => n + 1),
          y: Array.from(
            new Array(Number(savedCurve.t)),
            (x, n) => Number(savedCurve.qo) * Math.E ** (-Number(savedCurve.dea) * n)
          ),
          type: "scatter",
          mode: "lines",
          line: {
            width: 3,
            color: "#0066cc",
            dash: "solid",
          },
          hovertemplate: "Curva Guardada<br>Mes %{x}: %{y:.2f}m3<extra></extra>",
          hoverlabel: {
            font: {
              size: 10,
            },
          },
          name: "Curva Guardada",
          visible: true,
          showlegend: true,
        },
      ]
    : [];

  // Generate editable curves data
  const editableCurvesData = Object.entries(editableParams)
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
            width: 3,
            color: "#ff6600",
            dash: "dash",
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
          name: name + " (Actual)",
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
            (s, i) => `Real mes ${i + 1}: ${(s * par.realMaxQo).toFixed(2)}m3`
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
    .flat();

  return (
    <div className="chart-displayer" ref={containerRef}>
      <Plot
        ref={plotRef}
        data={[...savedCurveData, ...editableCurvesData]}
        layout={{
          plot_bgcolor: "#eee",
          paper_bgcolor: "#faf3e1",
          width: containerSize.width,
          height: containerSize.height,
          margin: {
            l: 40,
            r: 20,
            b: 50,
            t: 30,
            pad: 2,
          },
          legend: {
            title: "Curvas",
            font: { size: 9 },
            orientation: "v",
            x: 1.02,
            y: 1,
          },
          xaxis: getLayoutXAxis(wellProdSeries, editableParams, zoomRanges),
          yaxis: {
            title: "Oil [m3]",
            titlefont: { size: 10 },
            tickfont: { size: 8 },
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
          responsive: true,
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

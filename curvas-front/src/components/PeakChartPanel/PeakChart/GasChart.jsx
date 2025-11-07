import { useEffect, useState, useRef } from "react";

import Plot from "react-plotly.js";

const getLayoutXAxis = (series, zoomRanges) => {
  const total = series.gas.length;
  const maxTicks = 20;
  const step = Math.ceil(total / maxTicks);

  return {
    title: "Mes",
    titlefont: { size: 9 },
    tickfont: { size: 7 },
    range: zoomRanges.x,
    automargin: true,
    tickangle: -45,
    tickvals: Array.from({ length: total }, (_, i) => i + 1).filter(
      (v) => (v - 1) % step === 0
    ),
    ticktext: series.months
      .filter((_, i) => i % step === 0)
      .map((month) =>
        new Date(month).toLocaleDateString("es-ES", {
          month: "numeric",
          year: "numeric",
        })
      ),
  };
};

export default function GasChart({ series }) {
  const [logScale, setLogScale] = useState(false);

  // Calculate EUR (Estimated Ultimate Recovery) - total gas produced
  const calculateEUR = () => {
    return series.gas.reduce((acc, val) => acc + (val || 0), 0);
  };

  const eur = calculateEUR();

  const initialRanges = {
    x: [0, series.gas.length],
    y: [0, Math.max(...series.gas) * 1.1],
  };

  const [zoomRanges, setZoomRanges] = useState(initialRanges);

  const [containerSize, setContainerSize] = useState({
    width: 600,
    height: 400,
  });

  const containerRef = useRef(null);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({
          width: Math.max(rect.width - 20, 300),
          height: Math.max(rect.height - 20, 200),
        });
      }
    }

    setTimeout(updateSize, 100);
    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const xaxis = getLayoutXAxis(series, zoomRanges);

  const plotData = [
    {
      x: Array.from(new Array(series.gas.length), (x, n) => n + 1),
      y: series.gas,
      type: "scatter",
      mode: "lines+markers",
      marker: {
        size: 4,
      },
      line: {
        width: 2,
        color: "#888",
      },
      hovertemplate: "%{x}: %{y}<extra></extra>",
      hoverlabel: {
        font: {
          size: 10,
        },
      },
      name: "Gas",
      showlegend: true,
    },
  ].filter(Boolean);

  return (
    <div className="chart-displayer" ref={containerRef}>
      <Plot
        data={plotData}
        layout={{
          plot_bgcolor: "#eee",
          paper_bgcolor: "#faf3e1",
          width: containerSize.width,
          height: containerSize.height,
          margin: {
            l: 30,
            r: 10,
            b: 30,
            t: 40,
            pad: 2,
          },
          title: {
            text: `Gas - EUR: ${eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })} m³`,
            font: { size: 11, weight: 'bold' },
            x: 0.5,
            xanchor: 'center',
          },
          legend: {
            font: { size: 8 },
            orientation: "v",
          },
          xaxis: xaxis,
          yaxis: {
            title: "Gas [m³]",
            titlefont: { size: 9 },
            tickfont: { size: 7 },
            range: logScale ? "sarasa" : zoomRanges.y,
            type: logScale ? "log" : "linear",
          },
        }}
        onRelayout={(newRanges) => {
          const ranges = newRanges["xaxis.autorange"]
            ? initialRanges
            : {
                x: [newRanges["xaxis.range[0]"], newRanges["xaxis.range[1]"]],
                y: [
                  Math.max(newRanges["yaxis.range[0]"], 0),
                  newRanges["yaxis.range[1]"],
                ],
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
      <label htmlFor="gas-log-check" className="log-check-label">
        <input
          id="gas-log-check"
          type="checkbox"
          checked={logScale}
          onChange={(e) => setLogScale(e.target.checked)}
        />
        Log
      </label>
    </div>
  );
}

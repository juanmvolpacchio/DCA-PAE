import { useEffect, useState, useRef } from "react";

import Plot from "react-plotly.js";

const getLayoutXAxis = (series, zoomRanges) => {
  const total = series.oil.length;
  const maxTicks = 20;
  const step = Math.ceil(total / maxTicks);

  return {
    title: "Mes",
    titlefont: { size: 9 },
    tickfont: { size: 7 },
    range: zoomRanges.oil.x,
    automargin: true,
    tickangle: -45,
    tickvals: Array.from({ length: total }, (_, i) => i + 1).filter(
      (v) => (v - 1) % step === 0
    ),
    ticktext: series.months
      .filter((_, i) => i % step === 0)
      //locale to a month and year
      .map((month) =>
        new Date(month).toLocaleDateString("es-ES", {
          month: "numeric",
          year: "numeric",
        })
      ),
  };
};

export default function PeakChart({ series, points, addNewPoint, savedCurve, showNewCurve }) {
  const [logScale, setLogScale] = useState(false);

  const initialRanges = {
    oil: {
      x: [0, series.oil.length],
      y: [0, Math.max(...series.oil) * 1.1],
    },
    gas: {
      x: [0, series.gas.length],
      y: [0, Math.max(...series.gas) * 1.1],
    },
    water: {
      x: [0, series.water.length],
      y: [0, Math.max(...series.water) * 1.1],
    },
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
          width: Math.max(rect.width - 20, 300), // Account for padding, min 300px
          height: Math.max(rect.height - 20, 200), // Account for padding, min 200px
        });
      }
    }

    // Initial sizing with a small delay to ensure DOM is ready
    setTimeout(updateSize, 100);

    window.addEventListener("resize", updateSize);

    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const xaxis = getLayoutXAxis(series, zoomRanges);

  // Prepare data array and filter out null values
  const plotData = [
          {
            x: Array.from(new Array(series.oil.length), (x, n) => n + 1),
            y: series.oil,
            type: "scatter",
            mode: "lines+markers",
            marker: {
              size: 4,
            },
            line: {
              width: 2,
              color: "#2bcc2b",
            },
            hovertemplate: "%{x}: %{y}<extra></extra>",
            hoverlabel: {
              font: {
                size: 10,
              },
            },
            name: "Oil",
            showlegend: true,
          },
          // Orange point for new curve - only show if Nueva Curva panel is visible
          showNewCurve ? {
            x: Array.from(new Array(series.oil.length), (x, n) => n + 1),
            y: series.oil.map((qo, i) =>
              points[i] === "peak" ? qo : undefined
            ),
            type: "scatter",
            mode: "markers",
            marker: {
              color: "#FF8C42",
              size: 8,
            },
            hovertemplate: "Nueva Curva: (%{x},%{y})<extra></extra>",
            hoverlabel: {
              font: {
                size: 8,
              },
            },
            showlegend: false,
          } : null,
          // Blue point for saved curve
          savedCurve && savedCurve.start_date ? {
            x: [series.months.findIndex(month =>
              new Date(month).getTime() === new Date(savedCurve.start_date).getTime()
            ) + 1],
            y: [series.oil[series.months.findIndex(month =>
              new Date(month).getTime() === new Date(savedCurve.start_date).getTime()
            )]],
            type: "scatter",
            mode: "markers",
            marker: {
              color: "#4A90E2",
              size: 8,
            },
            hovertemplate: "Curva Guardada: (%{x},%{y})<extra></extra>",
            hoverlabel: {
              font: {
                size: 8,
              },
            },
            showlegend: false,
          } : null,
          {
            x: Array.from(new Array(series.oil.length), (x, n) => n + 1),
            y: series.oil.map((qo, i) =>
              points[i] === "limit" ? qo : undefined
            ),
            type: "scatter",
            mode: "markers",
            marker: {
              color: "black",
              size: 7,
            },
            hovertemplate: "Límite: (%{x},%{y})<extra></extra>",
            hoverlabel: {
              font: {
                size: 8,
              },
            },
            showlegend: false,
          },
          {
            x: Array.from(new Array(series.gas.length), (x, n) => n + 1),
            y: series.gas,
            type: "scatter",
            mode: "lines",
            line: {
              width: 1.4,
              color: "#888",
            },
            opacity: 0.5,
            hovertemplate: "%{x}: %{y}<extra></extra>",
            hoverlabel: {
              font: {
                size: 10,
              },
            },
            showlegend: true,
            name: "Gas",
            yaxis: "y2",
          },
          {
            x: Array.from(new Array(series.water.length), (x, n) => n + 1),
            y: series.water,
            type: "scatter",
            mode: "lines",
            line: {
              width: 1.4,
              color: "#FFaaaa",
            },
            opacity: 0.5,
            hovertemplate: "%{x}: %{y}<extra></extra>",
            hoverlabel: {
              font: {
                size: 10,
              },
            },
            showlegend: true,
            name: "Agua",
            yaxis: "y3",
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
            t: 25,
            pad: 2,
          },
          legend: {
            title: "Curvas",
            font: { size: 8 },
            orientation: "v",
          },
          xaxis: xaxis,
          yaxis: {
            title: "Oil [m3]",
            titlefont: { size: 9 },
            tickfont: { size: 7 },
            range: logScale ? "sarasa" : zoomRanges.oil.y,
            type: logScale ? "log" : "linear",
          },
          yaxis2: {
            title: "Gas [m3]",
            titlefont: { size: 8 },
            tickfont: { size: 6 },
            overlaying: "y",
            side: "right",
            anchor: "free",
            position: 0.98,
            range: logScale ? "sarasa" : zoomRanges.gas.y,
            type: logScale ? "log" : "linear",
          },
          yaxis3: {
            title: "Agua [m3]",
            titlefont: { size: 8 },
            tickfont: { size: 6 },
            overlaying: "y",
            side: "right",
            anchor: "free",
            position: 1,
            range: logScale ? "sarasa" : zoomRanges.water.y,
            type: logScale ? "log" : "linear",
          },
        }}
        onClick={(e) => {
          const typePoint = e.event.button === 2 ? "limit" : "peak";
          const pointIndex = e.points[0].x - 1;
          const start_date = series.months[pointIndex];
          addNewPoint(typePoint, pointIndex, start_date);
        }}
        onRelayout={(newRanges) => {
          const ranges = newRanges["xaxis.autorange"]
            ? initialRanges
            : {
                oil: {
                  x: [newRanges["xaxis.range[0]"], newRanges["xaxis.range[1]"]],
                  y: [
                    Math.max(newRanges["yaxis.range[0]"], 0),
                    newRanges["yaxis.range[1]"],
                  ],
                },
                gas: {
                  x: [newRanges["xaxis.range[0]"], newRanges["xaxis.range[1]"]],
                  y: [
                    Math.max(newRanges["yaxis2.range[0]"], 0),
                    newRanges["yaxis2.range[1]"],
                  ],
                },
                water: {
                  x: [newRanges["xaxis.range[0]"], newRanges["xaxis.range[1]"]],
                  y: [
                    Math.max(newRanges["yaxis3.range[0]"], 0),
                    newRanges["yaxis3.range[1]"],
                  ],
                },
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

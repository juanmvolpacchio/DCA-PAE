import { useEffect, useState } from "react";

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

export default function PeakChart({ series, points, addNewPoint }) {
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

  const xaxis = getLayoutXAxis(series, zoomRanges);
  return (
    <div className="chart-displayer">
      <Plot
        data={[
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
          {
            x: Array.from(new Array(series.oil.length), (x, n) => n + 1),
            y: series.oil.map((qo, i) =>
              points[i] === "peak" ? qo : undefined
            ),
            type: "scatter",
            mode: "markers",
            marker: {
              color: "orangered",
              size: 8,
            },
            hovertemplate: "Pico: (%{x},%{y})<extra></extra>",
            hoverlabel: {
              font: {
                size: 8,
              },
            },
            showlegend: false,
          },
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
        ]}
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
          addNewPoint(typePoint, e.points[0].x - 1);
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

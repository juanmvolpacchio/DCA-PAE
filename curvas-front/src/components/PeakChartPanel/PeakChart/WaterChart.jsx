import { useEffect, useState, useRef, useMemo } from "react";

import Plot from "react-plotly.js";

const getLayoutXAxis = (series, zoomRanges, extrapolationMonths) => {
  const historicalLength = series.water.length;
  const total = historicalLength + extrapolationMonths;
  const maxTicks = 20;
  const step = Math.ceil(total / maxTicks);

  // Generate tick values and labels
  const tickvals = Array.from({ length: total }, (_, i) => i + 1).filter(
    (v) => (v - 1) % step === 0
  );

  const ticktext = tickvals.map((tickval) => {
    const index = tickval - 1;
    if (index < historicalLength) {
      // Historical data - use actual month
      return new Date(series.months[index]).toLocaleDateString("es-ES", {
        month: "numeric",
        year: "numeric",
      });
    } else {
      // Extrapolated months - calculate from last historical month
      const lastMonth = new Date(series.months[historicalLength - 1]);
      const monthsAhead = index - historicalLength + 1;
      const extrapDate = new Date(lastMonth);
      extrapDate.setMonth(extrapDate.getMonth() + monthsAhead);
      return extrapDate.toLocaleDateString("es-ES", {
        month: "numeric",
        year: "numeric",
      });
    }
  });

  return {
    title: "Mes",
    titlefont: { size: 9 },
    tickfont: { size: 7 },
    range: zoomRanges.x,
    automargin: true,
    tickangle: -45,
    tickvals: tickvals,
    ticktext: ticktext,
  };
};

export default function WaterChart({ series, points, addNewPoint, savedCurve, showNewCurve, editableParams, isSingleWell, multiWellExtrapolation, mesesExtrapolacion }) {
  const [logScale, setLogScale] = useState(false);

  // Calculate EUR (Estimated Ultimate Recovery) - total water produced
  const calculateEUR = () => {
    return series.water.reduce((acc, val) => acc + (val || 0), 0);
  };

  const eur = calculateEUR();

  // Helper function to calculate extrapolated water with real values
  const calculateExtrapolatedWater = (qo, dea, months) => {
    let total = 0;
    for (let n = 0; n < months; n++) {
      total += qo * Math.E ** (-dea * n);
    }
    return total;
  };

  // Get extrapolation parameters
  // For single well: use editableParams, for multiple wells: use mesesExtrapolacion
  const extrapolationMonths = isSingleWell
    ? Math.max(editableParams?.["Seg. 1"]?.t || 12, 0)
    : (mesesExtrapolacion || 12);

  // Calculate the max range including extrapolation
  const maxXRange = series.water.length + extrapolationMonths;

  const initialRanges = {
    x: [0, maxXRange],
    y: [0, Math.max(...series.water) * 1.1],
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

  const xaxis = getLayoutXAxis(series, zoomRanges, extrapolationMonths);

  // Calculate R² for saved curve if available
  const savedCurveR2 = useMemo(() => {
    if (!savedCurve || !editableParams?.["Seg. 1"]?.seg) return null;

    const realData = editableParams["Seg. 1"].seg;
    const qo = Number(savedCurve.qo);
    const dea = Number(savedCurve.dea);

    // Generate predicted values
    const predicted = realData.map((_, i) => qo * Math.E ** (-dea * i));

    // Calculate R²
    const mean = realData.reduce((sum, val) => sum + val, 0) / realData.length;
    const ssRes = realData.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    const ssTot = realData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);

    return ssTot === 0 ? 1 : Math.max(0, 1 - (ssRes / ssTot));
  }, [savedCurve, editableParams]);

  // Generate saved curve data (blue curve)
  const savedCurveData = savedCurve && savedCurve.start_date
    ? (() => {
        // Find the closest production point on or after the start_date
        const startDate = new Date(savedCurve.start_date);
        const startIndex = series.months.findIndex(month =>
          new Date(month) >= startDate
        );

        if (startIndex === -1) return null;

        const totalMonths = series.months.length - startIndex + extrapolationMonths;

        // Calculate extrapolated potential from current position, not from month 0
        const monthsSinceStart = series.months.length - startIndex;
        let savedCurveExtrapolated = 0;
        for (let n = monthsSinceStart; n < monthsSinceStart + extrapolationMonths; n++) {
          savedCurveExtrapolated += Number(savedCurve.qo) * Math.E ** (-Number(savedCurve.dea) * n);
        }

        const r2Display = savedCurveR2 !== null ? `, R²: ${savedCurveR2.toFixed(4)}` : '';

        return {
          x: Array.from(new Array(totalMonths), (_, n) => n + 1 + startIndex),
          y: Array.from(new Array(totalMonths), (_, n) =>
            Number(savedCurve.qo) * Math.E ** (-Number(savedCurve.dea) * n)
          ),
          type: "scatter",
          mode: "lines",
          line: {
            width: 3,
            color: "#4A90E2",
            dash: "solid",
          },
          hovertemplate: "Curva Guardada<br>Mes %{x}: %{y:.2f}m³<extra></extra>",
          hoverlabel: {
            font: { size: 10 },
          },
          name: `Curva Guardada (Potencial: ${savedCurveExtrapolated.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³${r2Display})`,
          visible: true,
          showlegend: true,
        };
      })()
    : null;

  // Generate new curve data (orange curve) - only if visible
  const newCurveData = showNewCurve && editableParams?.["Seg. 1"]
    ? (() => {
        // Find the closest production point on or after the start_date
        const startDate = new Date(editableParams["Seg. 1"].start_date);
        const startIndex = series.months.findIndex(month =>
          new Date(month) >= startDate
        );

        if (startIndex === -1) return null;

        const totalMonths = series.months.length - startIndex + extrapolationMonths;

        // Calculate extrapolated potential from current position, not from month 0
        const monthsSinceStart = series.months.length - startIndex;
        let newCurveExtrapolated = 0;
        for (let n = monthsSinceStart; n < monthsSinceStart + extrapolationMonths; n++) {
          newCurveExtrapolated += editableParams["Seg. 1"].qo * Math.E ** (-editableParams["Seg. 1"].dea * n);
        }

        const r2Display = editableParams["Seg. 1"].r2 !== undefined ? `, R²: ${editableParams["Seg. 1"].r2.toFixed(4)}` : '';

        return {
          x: Array.from(new Array(totalMonths), (_, n) => n + 1 + startIndex),
          y: Array.from(new Array(totalMonths), (_, n) =>
            editableParams["Seg. 1"].qo * Math.E ** (-editableParams["Seg. 1"].dea * n)
          ),
          type: "scatter",
          mode: "lines",
          line: {
            width: 3,
            color: "#FF8C42",
            dash: "dash",
          },
          hovertemplate: "Nueva Curva<br>Mes %{x}: %{y:.2f}m³<extra></extra>",
          hoverlabel: {
            font: { size: 10 },
          },
          name: `Nueva Curva (Potencial: ${newCurveExtrapolated.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³${r2Display})`,
          visible: true,
          showlegend: true,
        };
      })()
    : null;

  // Generate multi-well extrapolation curve (purple curve) - only for multiple wells
  const multiWellExtrapolationData = !isSingleWell && multiWellExtrapolation && multiWellExtrapolation.water
    ? {
        x: Array.from(
          { length: multiWellExtrapolation.water.length },
          (_, n) => series.water.length + n + 1
        ),
        y: multiWellExtrapolation.water,
        type: "scatter",
        mode: "lines",
        line: {
          width: 3,
          color: "#9B59B6",
          dash: "dash",
        },
        hovertemplate: "Extrapolación<br>Mes %{x}: %{y:.2f}m³<extra></extra>",
        hoverlabel: {
          font: { size: 10 },
        },
        name: `Extrapolación (${multiWellExtrapolation.water.reduce((a, b) => a + b, 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³)`,
        visible: true,
        showlegend: true,
      }
    : null;

  // Prepare data array and filter out null values
  const plotData = [
    savedCurveData,
    newCurveData,
    multiWellExtrapolationData,
    {
      x: Array.from(new Array(series.water.length), (x, n) => n + 1),
      y: series.water,
      type: "scatter",
      mode: "lines+markers",
      marker: {
        size: 4,
      },
      line: {
        width: 2,
        color: "#FFaaaa",
      },
      customdata: series.months.map(month =>
        new Date(month).toLocaleDateString("es-ES", {
          month: "numeric",
          year: "numeric",
        })
      ),
      hovertemplate: "%{customdata}: %{y:.2f} m³<extra></extra>",
      hoverlabel: {
        font: {
          size: 10,
        },
      },
      name: "Agua",
      showlegend: true,
    },
    // Orange point for new curve - only show if Nueva Curva panel is visible
    showNewCurve ? {
      x: Array.from(new Array(series.water.length), (x, n) => n + 1),
      y: series.water.map((qo, i) =>
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
      y: [series.water[series.months.findIndex(month =>
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
      x: Array.from(new Array(series.water.length), (x, n) => n + 1),
      y: series.water.map((qo, i) =>
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
            text: `Agua - EUR: ${eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })} m³`,
            font: { size: 11, weight: 'bold' },
            x: 0.5,
            xanchor: 'center',
          },
          legend: {
            font: { size: 8 },
            orientation: "h",
            x: 0.5,
            xanchor: "center",
            y: -0.15,
            yanchor: "top",
          },
          xaxis: xaxis,
          yaxis: {
            title: "Agua [m³]",
            titlefont: { size: 9 },
            tickfont: { size: 7 },
            range: logScale ? "sarasa" : zoomRanges.y,
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
      <label htmlFor="water-log-check" className="log-check-label">
        <input
          id="water-log-check"
          type="checkbox"
          checked={logScale}
          onChange={(e) => setLogScale(e.target.checked)}
        />
        Log
      </label>
    </div>
  );
}

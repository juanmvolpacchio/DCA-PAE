import { useEffect, useState, useRef, useMemo } from "react";

import Plot from "react-plotly.js";

const getLayoutXAxis = (wellProdSeries, editableParams, currentBaseMonths, extrapolationMonths, zoomRanges) => {
  const startDate = editableParams["Seg. 1"]?.start_date;

  if (!startDate || !wellProdSeries.month.length) {
    return {
      title: "Mes",
      titlefont: { size: 9 },
      tickfont: { size: 7 },
      range: zoomRanges.x,
      tickangle: -45,
      automargin: true,
    };
  }

  // Find start index in data
  const startIndex = wellProdSeries.month.findIndex(monthStr => {
    return new Date(monthStr).getTime() === new Date(startDate).getTime();
  });

  if (startIndex === -1) return { title: "Mes" };

  // Generate month labels from start_date to end of data + extrapolation
  const totalMonths = currentBaseMonths + extrapolationMonths;
  const months = [];

  for (let i = 0; i < totalMonths; i++) {
    const dataIndex = startIndex + i;
    if (dataIndex < wellProdSeries.month.length) {
      // Use real data month
      months.push(new Date(wellProdSeries.month[dataIndex]).toLocaleDateString("es-ES", {
        month: "numeric",
        year: "numeric",
      }));
    } else {
      // Extrapolated months: calculate from last data month
      const lastMonth = new Date(wellProdSeries.month[wellProdSeries.month.length - 1]);
      const monthsAhead = dataIndex - wellProdSeries.month.length + 1;
      const extrapDate = new Date(lastMonth);
      extrapDate.setMonth(extrapDate.getMonth() + monthsAhead);
      months.push(extrapDate.toLocaleDateString("es-ES", {
        month: "numeric",
        year: "numeric",
      }));
    }
  }

  const maxTicks = 15;
  const step = Math.max(Math.ceil(totalMonths / maxTicks), 1);
  const tickvals = Array.from({ length: totalMonths }, (_, i) => i + 1).filter(
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
  showNewCurve,
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

  // Calculate max Qo including saved curve
  const maxQo = Math.max(
    ...Object.values(editableParams).map((p) => p.qo),
    savedCurve?.qo || 0
  );

  const [zoomRanges, setZoomRanges] = useState({
    x: [0, 120],
    y: [0, maxQo * 1.1],
  });

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

  // Calculate base months from start_date to last data point
  const calculateBaseMonths = (startDate) => {
    if (!startDate || !wellProdSeries.month.length) return 0;

    const start = new Date(startDate);
    const lastDataMonth = new Date(wellProdSeries.month[wellProdSeries.month.length - 1]);

    // Find the actual index in the data where the start_date is
    const startIndex = wellProdSeries.month.findIndex(monthStr => {
      const monthDate = new Date(monthStr);
      return monthDate.getTime() === start.getTime();
    });

    // If start_date is found in data, calculate from that point to the end
    if (startIndex !== -1) {
      return wellProdSeries.month.length - startIndex;
    }

    // Fallback: calculate time difference
    const monthsToLastData = (lastDataMonth.getFullYear() - start.getFullYear()) * 12
                           + (lastDataMonth.getMonth() - start.getMonth()) + 1;
    return Math.max(monthsToLastData, 0);
  };

  // Calculate base months for current curve
  const currentBaseMonths = editableParams["Seg. 1"]?.start_date
    ? calculateBaseMonths(editableParams["Seg. 1"].start_date)
    : 0;

  // Calculate base months for saved curve
  const savedBaseMonths = savedCurve?.start_date
    ? calculateBaseMonths(savedCurve.start_date)
    : 0;

  // Get extrapolation months (always positive)
  const extrapolationMonths = Math.max(editableParams["Seg. 1"]?.t || 12, 0);

  // Calculate initial ranges based on actual data (memoized to prevent infinite loops)
  const initialRanges = useMemo(() => ({
    x: [0, Math.max(currentBaseMonths + extrapolationMonths, 12)],
    y: [0, maxQo * 1.1],
  }), [currentBaseMonths, extrapolationMonths, maxQo]);

  // Auto-scale when savedCurve is loaded
  useEffect(() => {
    if (savedCurve && plotRef.current) {
      setZoomRanges(initialRanges);
    }
  }, [savedCurve?.id, initialRanges]);

  // Calculate x offset for saved curve based on its start_date
  const savedCurveXOffset = (() => {
    if (!savedCurve?.start_date || !editableParams["Seg. 1"]?.start_date) return 0;

    const savedStart = new Date(savedCurve.start_date);
    const currentStart = new Date(editableParams["Seg. 1"].start_date);

    // Find indices in wellProdSeries
    const savedStartIndex = wellProdSeries.month.findIndex(m =>
      new Date(m).getTime() === savedStart.getTime()
    );
    const currentStartIndex = wellProdSeries.month.findIndex(m =>
      new Date(m).getTime() === currentStart.getTime()
    );

    if (savedStartIndex === -1 || currentStartIndex === -1) return 0;

    // Offset is the difference in indices
    return savedStartIndex - currentStartIndex;
  })();

  // Generate saved curve data
  const savedCurveData = savedCurve
    ? (() => {
        const totalMonths = savedBaseMonths + extrapolationMonths;
        return [
          {
            x: Array.from(new Array(totalMonths), (x, n) => n + 1 + savedCurveXOffset),
            y: Array.from(
              new Array(totalMonths),
              (x, n) => Number(savedCurve.qo) * Math.E ** (-Number(savedCurve.dea) * n)
            ),
          type: "scatter",
          mode: "lines",
          line: {
            width: 3,
            color: "#4A90E2",
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
        }];
      })()
    : [];

  // Generate new curve line data - only show if Nueva Curva panel is visible
  const newCurveLineData = showNewCurve
    ? Object.entries(editableParams)
        .map(([name, par]) => {
          // Calculate total months: base months + extrapolation
          const totalMonths = currentBaseMonths + extrapolationMonths;

          return {
            x: Array.from(new Array(totalMonths), (x, n) => n + 1),
            y: Array.from(
              new Array(totalMonths),
              (x, n) => par.qo * Math.E ** (-par.dea * n)
            ),
            type: "scatter",
            mode: "lines",
            line: {
              width: 3,
              color: "#FF8C42",
              dash: "dash",
            },
            text: Array.from(
              new Array(totalMonths),
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
            name: name + " (Nueva Curva)",
            visible: visibleLines[name],
            showlegend: true,
          };
        })
    : [];

  // Real data points - always visible
  const realDataPoints = Object.entries(editableParams)
    .map(([name, par]) => {
      return {
        x: par.seg?.map((s, i) => i + 1),
        y: par.seg,
        type: "scatter",
        mode: "markers",
        marker: {
          size: 5,
          color: "#2ca02c", // Green color for real data points
          line: {
            width: 1,
            color: "#1a661a"
          }
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
        name: "Datos Reales",
        visible: true, // Always visible
        showlegend: true,
      };
    });

  return (
    <div className="chart-displayer" ref={containerRef}>
      <Plot
        ref={plotRef}
        data={[...savedCurveData, ...newCurveLineData, ...realDataPoints]}
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
          xaxis: getLayoutXAxis(wellProdSeries, editableParams, currentBaseMonths, extrapolationMonths, zoomRanges),
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

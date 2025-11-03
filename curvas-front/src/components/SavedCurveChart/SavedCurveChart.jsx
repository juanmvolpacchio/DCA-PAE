

import Plot from "react-plotly.js";
import { savedCurvesPalette } from "../../helpers/constants";


export default function SavedCurveChart({ 
    savedCurves, toggleEditableParam
}) {

    return (
        <div className="unresp-chart-container">
            <h3>Curvas consolidadas</h3>
            <div className="unresp-chart-displayer">
            <Plot 
                    data={ savedCurves.map( ( par, i ) => {
                        return {
                            x: Array.from(
                                new Array( par.t ), ( x, n ) => n + 1
                            ),
                            y:  Array.from(
                                new Array( par.t ), 
                                (x, n) => par.qo * Math.E**(-par.dea * n)
                            ),
                            type: 'scatter',
                            mode: 'lines',
                            i,
                            line: {
                                width: 1.6,
                                color: savedCurvesPalette[ i % savedCurvesPalette.length ],
                            },
                            hoverinfo: "text",
                            hoverlabel: {
                                font: {
                                    size: 8
                                }
                            },
                            text: `${ par.name } (${ par.username })`,
                            name: par.name,
                            showlegend: false,
                        }
                    })}
                    layout={{
                        plot_bgcolor: '#eee',
                        paper_bgcolor: '#faf3e1',
                        width: 180,
                        height: 120,
                        margin: {
                            l: 0,
                            r: 0,
                            b: 0,
                            t: 0,
                            pad: 0,
                        },
                        xaxis: {
                            title: false,
                            showticklabels: false
                        },
                        yaxis: {
                            title: false,
                            showticklabels: false
                        }
                    }}
                    onClick={ ({ points }) => {
                        const { name, qo, dea, t } = savedCurves.find(
                            cur => cur.name === points[0].data.name
                        )
                        toggleEditableParam(
                            name, null, qo, dea, t,
                            savedCurvesPalette[ points[0].curveNumber % savedCurvesPalette.length ]
                        )
                    }}
                    config={{
                        displaylogo: false,
                        modeBarButtonsToRemove: [
                            'zoom2d', 'zoomIn2d', 'zoomOut2d', 'select2d','lasso2d',
                            'pan', 'resetScale2d'
                        ]
                    }}
                />
            </div>
        </div>
    )
}
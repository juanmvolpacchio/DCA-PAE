
import Plot from "react-plotly.js";
import { defaultColors } from "../../helpers/constants";


export default function FittedCurveChart({ segments }) {
    
    return (
        <div className="unresp-chart-container">
            <h3>Curvas adecuadas</h3>

            <div className="unresp-chart-displayer">
                <Plot 
                    data={ Object.entries( segments ).map( 
                        ([ name, { seg, qo, dea, t, color } ]) => {
                            return [
                                {
                                    x: Array.from(
                                        new Array( t ), ( x, n ) => n + 1
                                    ),
                                    y:  Array.from(
                                        new Array( t ), 
                                        (x, n) => qo * Math.E**(-dea * n)
                                    ),
                                    type: 'scatter',
                                    mode: 'lines',
                                    line: {
                                        width: 1.6,
                                        color
                                    },
                                    hoverinfo: "name",
                                    hoverlabel: {
                                        font: {
                                            size: 8
                                        }
                                    },
                                    name,
                                    showlegend: false,
                                },
                                {
                                    x: seg.map( ( s, i ) => i + 1 ),
                                    y: seg,
                                    type: 'scatter',
                                    mode: 'markers',
                                    marker: {
                                        size: 2.5,
                                        color
                                    },
                                    hoverinfo: "name",
                                    hoverlabel: {
                                        font: {
                                            size: 8
                                        }
                                    },
                                    name,
                                    showlegend: false
                                }
                            ]
                        }
                    ).flat()}
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
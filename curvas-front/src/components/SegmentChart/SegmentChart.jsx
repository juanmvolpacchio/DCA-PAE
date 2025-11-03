

import Plot from "react-plotly.js";


export default function SegmentChart({ segments }) {
    
    return (
        <div className="unresp-chart-container">
            <h3>Segmentos</h3>
            <div className="unresp-chart-displayer">
                <Plot 
                    data={
                        segments.map(( seg, j ) => {
                            return {
                                x: seg.map( ( s, i ) => i + 1 ),
                                y: seg,
                                type: 'scatter',
                            mode: 'markers',
                            marker: {
                                size: 2.5
                            },
                            hoverinfo: "name",
                            hoverlabel: {
                                font: {
                                    size: 8
                                }
                            },
                            name: `Seg. ${ j + 1 }`,
                            showlegend: false
                            }
                        })
                    }
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
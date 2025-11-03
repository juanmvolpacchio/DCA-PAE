import { curveParams } from "../../helpers/constants";
import "./SavedCurvePanel.css";

export default function SavedCurvePanel({ savedCurve }) {
  if (!savedCurve) {
    return (
      <div id="saved-curve-container" className="chart-panel">
        <div className="param-panel">
          <h3>Curva Guardada</h3>
          <div className="no-saved-curve">
            <p>No hay curva guardada para este pozo</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="saved-curve-container" className="chart-panel">
      <div className="param-panel">
        <h3>Curva Guardada</h3>
        <div className="filter-container">
          {Object.entries(curveParams).map(([par, name]) => (
            <div
              key={par}
              className="filter-viewer"
              style={{
                backgroundColor: "#aaa",
              }}
            >
              <label htmlFor={`saved-${par}`}>{name}</label>
              <input
                id={`saved-${par}`}
                className="curve-editor-input"
                type="number"
                disabled={true}
                value={savedCurve[par] || ""}
                readOnly
              />
            </div>
          ))}
          {savedCurve.comment && (
            <div className="filter-viewer comment-viewer">
              <label>Comentario</label>
              <div className="comment-display">{savedCurve.comment}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { curveParams } from "../../helpers/constants";
import "./SavedCurvePanel.css";

export default function SavedCurvePanel({ savedCurve, onEdit, isEditMode }) {
  if (!savedCurve) {
    return (
      <div id="saved-curve-params-panel" className="param-panel">
        <div className="panel-header">
          <h3>Curva Guardada</h3>
          <button
            className={`edit-button ${isEditMode ? 'active' : ''}`}
            onClick={onEdit}
            title={isEditMode ? "Ocultar Nueva Curva" : "Crear Nueva Curva"}
          >
            {isEditMode ? '✖️ Cerrar' : '➕ Nueva'}
          </button>
        </div>
        <div className="no-saved-curve">
          <p>No hay curva guardada para este pozo</p>
        </div>
      </div>
    );
  }

  return (
    <div id="saved-curve-params-panel" className="param-panel compact-panel">
      <div className="panel-header">
        <h3>Curva Guardada</h3>
        <button
          className={`edit-button ${isEditMode ? 'active' : ''}`}
          onClick={onEdit}
          title={isEditMode ? "Ocultar Nueva Curva" : "Editar curva"}
        >
          {isEditMode ? '✖️ Cerrar' : '✏️ Editar'}
        </button>
      </div>
      <div className="params-row">
        {Object.entries(curveParams).map(([par, name]) => (
          <div
            key={par}
            className="param-item saved-curve-item"
            style={{
              backgroundColor: "#4A90E2",
            }}
          >
            <label htmlFor={`saved-${par}`}>{name}</label>
            <input
              id={`saved-${par}`}
              className="curve-editor-input"
              type={par === "start_date" ? "text" : "number"}
              disabled={true}
              value={savedCurve[par] || ""}
              readOnly
            />
          </div>
        ))}
      </div>
      {savedCurve.comment && (
        <div className="comment-section">
          <label>Comentario</label>
          <div className="comment-display">{savedCurve.comment}</div>
        </div>
      )}
      {(savedCurve.username || savedCurve.created_at) && (
        <div className="curve-signature">
          {savedCurve.username && <span>{savedCurve.username}</span>}
          {savedCurve.created_at && (
            <span>
              {new Date(savedCurve.created_at).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

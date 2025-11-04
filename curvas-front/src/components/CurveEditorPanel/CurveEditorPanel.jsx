import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { API_BASE, curveParams } from "../../helpers/constants";
import { useAuth } from "../../hooks/useAuth";
import "./CurveEditorPanel.css";

export default function CurveEditorPanel({
  wellProdSeries,
  editableParams,
  updateEditableParam,
  removeEditableParam,
  activeWell,
  onResetToSaved,
  savedCurve,
  activeSegment,
  setActiveSegment,
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [comment, setComment] = useState("");

  // Sync activeSegment when editableParams keys change
  useEffect(() => {
    const currentFirstSegment = Object.keys(editableParams)[0];
    if (currentFirstSegment && currentFirstSegment !== activeSegment) {
      console.log('🔄 Syncing activeSegment to:', currentFirstSegment);
      setActiveSegment(currentFirstSegment);
    }
  }, [editableParams, activeSegment, setActiveSegment]);

  // Log current values for debugging
  console.log('📊 CurveEditorPanel - activeSegment:', activeSegment);
  console.log('📊 CurveEditorPanel - editableParams:', editableParams);

  const saveCurveMutation = useMutation({
    mutationFn: async ({ name, qo, dea, start_date, well, user_id, comment }) => {
      const response = await fetch(`${API_BASE}/curves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, qo, dea, start_date, well, user_id, comment }),
      });
      if (!response.ok) throw new Error("Failed to save curve");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["well", activeWell.name, "curves"],
      });
      setComment(""); // Clear comment after successful save
    },
  });

  const deleteCurveMutation = useMutation({
    mutationFn: async ({ name, well }) => {
      const response = await fetch(`${API_BASE}/curves`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, well }),
      });
      if (!response.ok) throw new Error("Failed to delete curve");
    },
    onSuccess: () => {
      removeEditableParam(toSaveCurve);
      const nextActiveSegmentName = Object.keys(editableParams).find(
        (name) => name !== toSaveCurve
      );
      setActiveSegment(nextActiveSegmentName);
      queryClient.invalidateQueries({
        queryKey: ["well", activeWell.name, "curves"],
      });
    },
  });

  async function handleCurveSaving() {
    if (user?.role === "admin" || user?.id === activeWell.owner) {
      const { qo, dea, start_date } = editableParams[activeSegment];
      saveCurveMutation.mutate({
        name: activeSegment,
        qo,
        dea,
        start_date,
        well: activeWell.name,
        user_id: user.id,
        comment: comment.trim() || null,
      });
    }
  }

  async function handleCurveDeleting() {
    if (user?.role === "admin" || user?.id === activeWell.owner) {
      deleteCurveMutation.mutate({
        name: activeSegment,
        well: activeWell.name,
      });
    }
  }

  function handleReset() {
    if (onResetToSaved) {
      onResetToSaved();
      // Don't reset comment - it should always start empty
    }
  }

  return (
    <div id="curve-editor-params-panel" className="param-panel compact-panel">
      <h3>Curva Actual</h3>
      <div className="params-row">
        {Object.entries(curveParams).map(([par, name]) => (
          <div
            key={par}
            className="param-item"
            style={{
              backgroundColor: editableParams[activeSegment]?.color || "#bbb",
            }}
          >
            <label htmlFor={par}>{name}</label>
            <input
              id={par}
              className="curve-editor-input"
              type={par === "start_date" ? "text" : "number"}
              disabled={par === "start_date" || !editableParams[activeSegment]}
              readOnly={par === "start_date"}
              step={par === "dea" ? 0.001 : 0.01}
              value={editableParams[activeSegment]?.[par] || ""}
              onChange={(e) =>
                updateEditableParam(activeSegment, par, e.target.value)
              }
            />
          </div>
        ))}
      </div>
      <div className="params-row">
        <div
          className="param-item"
          style={{
            backgroundColor: editableParams[activeSegment]?.color || "#bbb",
          }}
        >
          <label htmlFor="meses">Meses extrapolación</label>
          <input
            id="meses"
            className="curve-editor-input"
            type="number"
            disabled={editableParams[activeSegment] ? false : true}
            step={1}
            min={0}
            value={editableParams[activeSegment]?.t || ""}
            onChange={(e) =>
              updateEditableParam(activeSegment, "t", e.target.value)
            }
          />
        </div>
      </div>
      <div className="comment-input-section">
        <label htmlFor="curve-comment">Comentario</label>
        <textarea
          id="curve-comment"
          className="curve-comment-textarea"
          rows="2"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Agregar comentario..."
          disabled={
            !(user?.role === "admin" || user?.id === activeWell.owner)
          }
        />
      </div>
      <div className="button-group">
        <button
          className="reset-button"
          disabled={
            !(user?.role === "admin" || user?.id === activeWell.owner) ||
            !savedCurve
          }
          onClick={handleReset}
          title="Restablecer a curva guardada"
        >
          🔄 Restablecer
        </button>
        <button
          className="save-button"
          disabled={
            !(user?.role === "admin" || user?.id === activeWell.owner)
          }
          onClick={handleCurveSaving}
          title="Guardar curva"
        >
          💾 Guardar
        </button>
      </div>
    </div>
  );
}

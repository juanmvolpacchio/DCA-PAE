import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import CurveEditor from "./CurveEditor/CurveEditor";

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
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const firstSegmentName = Object.keys(editableParams)[0];

  const [activeSegment, setActiveSegment] = useState(firstSegmentName);

  const [comment, setComment] = useState("");

  // Sync activeSegment when editableParams keys change
  useEffect(() => {
    const currentFirstSegment = Object.keys(editableParams)[0];
    if (currentFirstSegment && currentFirstSegment !== activeSegment) {
      console.log('🔄 Syncing activeSegment to:', currentFirstSegment);
      setActiveSegment(currentFirstSegment);
    }
  }, [editableParams]);

  // Log current values for debugging
  console.log('📊 CurveEditorPanel - activeSegment:', activeSegment);
  console.log('📊 CurveEditorPanel - editableParams:', editableParams);

  const saveCurveMutation = useMutation({
    mutationFn: async ({ name, qo, dea, t, well, user_id, comment }) => {
      const response = await fetch(`${API_BASE}/curves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, qo, dea, t, well, user_id, comment }),
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
      const { qo, dea, t } = editableParams[activeSegment];
      saveCurveMutation.mutate({
        name: activeSegment,
        qo,
        dea,
        t,
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
    <div id="curve-editor-container" className="chart-panel">
      <div className="param-panel">
        <h3>Curva Actual</h3>
        <div className="filter-container">
          {Object.entries(curveParams).map(([par, name]) => (
            <div
              key={par}
              className="filter-viewer"
              style={{
                backgroundColor: editableParams[activeSegment]?.color || "#bbb",
              }}
            >
              <label htmlFor={par}>{name}</label>
              <input
                id={par}
                className="curve-editor-input"
                type="number"
                disabled={editableParams[activeSegment] ? false : true}
                step={par === "dea" ? 0.001 : par === "t" ? 1 : 0.01}
                value={editableParams[activeSegment]?.[par] || ""}
                onChange={(e) =>
                  updateEditableParam(activeSegment, par, e.target.value)
                }
              />
            </div>
          ))}
          <div className="filter-viewer comment-input-viewer">
            <label htmlFor="curve-comment">Comentario</label>
            <textarea
              id="curve-comment"
              className="curve-comment-textarea"
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Agregar comentario (opcional)..."
              disabled={
                !(user?.role === "admin" || user?.id === activeWell.owner)
              }
            />
          </div>
          <div className="filter-viewer button-group">
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
      </div>
      <CurveEditor
        editableParams={editableParams}
        setActiveSegment={setActiveSegment}
        wellProdSeries={wellProdSeries}
        savedCurve={savedCurve}
      />
    </div>
  );
}

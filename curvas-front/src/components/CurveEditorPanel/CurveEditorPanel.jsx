import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import CurveEditor from "./CurveEditor/CurveEditor";

import { API_BASE, curveParams, savedCurveTags } from "../../helpers/constants";
import { useAuth } from "../../hooks/useAuth";
import "./CurveEditorPanel.css";

export default function CurveEditorPanel({
  wellProdSeries,
  editableParams,
  updateEditableParam,
  removeEditableParam,
  activeWell,
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const firstSegmentName = Object.keys(editableParams)[0];

  const [activeSegment, setActiveSegment] = useState(firstSegmentName);

  const [toSaveCurve, setToSaveCurve] = useState("reservas");

  const saveCurveMutation = useMutation({
    mutationFn: async ({ name, qo, dea, t, well, user_id }) => {
      const response = await fetch(`${API_BASE}/curves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, qo, dea, t, well, user_id }),
      });
      if (!response.ok) throw new Error("Failed to save curve");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["well", activeWell.name, "curves"],
      });
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
        name: toSaveCurve,
        qo,
        dea,
        t,
        well: activeWell.name,
        user_id: user.id,
      });
    }
  }

  async function handleCurveDeleting() {
    if (user?.role === "admin" || user?.id === activeWell.owner) {
      deleteCurveMutation.mutate({
        name: toSaveCurve,
        well: activeWell.name,
      });
    }
  }

  return (
    <div id="curve-editor-container" className="chart-panel">
      <div className="param-panel">
        <h3>Parámetros curvas</h3>
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
          <div className="filter-viewer" id="save_curve_viewer">
            <select
              disabled={user?.role !== "admin" && user?.id !== activeWell.owner}
              value={toSaveCurve}
              onChange={(e) => setToSaveCurve(e.target.value)}
            >
              {Object.entries(savedCurveTags).map(([tag, name]) => (
                <option key={tag} value={tag}>
                  {name}
                </option>
              ))}
            </select>
            <button
              disabled={
                !(user?.role === "admin" || user?.id === activeWell.owner)
              }
              onClick={handleCurveSaving}
            >
              💾
            </button>
            <button
              disabled={
                !(user?.role === "admin" || user?.id === activeWell.owner)
              }
              onClick={handleCurveDeleting}
            >
              ❌
            </button>
          </div>
        </div>
      </div>
      <CurveEditor
        editableParams={editableParams}
        setActiveSegment={setActiveSegment}
        wellProdSeries={wellProdSeries}
      />
    </div>
  );
}

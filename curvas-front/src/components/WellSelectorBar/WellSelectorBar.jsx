import { useState } from "react";
import { NavLink } from "react-router-dom";

import "./WellSelectorBar.css";

export default function WellSelectorBar({ wells, user }) {
  const [wellSearch, setWellSearch] = useState("");
  const [project, setProject] = useState("");
  const initWellShownAmount = 300;
  const [wellShownAmount, setWellShownAmount] = useState(initWellShownAmount);

  const [filterOwned, setFilterOwned] = useState(false);

  const [managUnit, setManagUnit] = useState("");

  return (
    <aside id="side-bar">
      <div id="well-link-container">
        <input
          type="text"
          placeholder="Buscar pozo..."
          value={wellSearch}
          onChange={(e) => {
            setWellSearch(e.target.value);
            setWellShownAmount(initWellShownAmount);
          }}
        />
        <div
          id="well-link-list"
          onScroll={(e) =>
            e.target.scrollTop > e.target.scrollHeight * 0.8 &&
            setWellShownAmount(wellShownAmount + initWellShownAmount)
          }
        >
          {wells
            // 1. ADD A CHECK to ensure 'w' is a valid object and has a 'name' property
            .filter((w) => w && w.name)
            .filter(
              (w) =>
                (wellSearch === "" ||
                  w.name.toLowerCase().startsWith(wellSearch.toLowerCase())) &&
                (!filterOwned || w.owner === user?.id) &&
                (managUnit === "" || w.manag_unit === managUnit) &&
                (project === "" || w.proyecto === project)
            )
            .filter((w, i) => i < wellShownAmount)
            .map((w) => (
              <NavLink
                key={w.name}
                className={
                  (w.owner === user?.id || user?.role === "admin") && "owned"
                }
                to={w.name}
              >
                {w.name}
              </NavLink>
            ))}
        </div>
      </div>
      <label htmlFor="show-owned-check">
        <input
          id="show-owned-check"
          type="checkbox"
          checked={filterOwned}
          onChange={(e) => setFilterOwned(e.target.checked)}
        />
        Sólo pozos propios
      </label>
      <div id="unit-filter">
        <h3>Unidad gestión</h3>
        <select
          value={managUnit}
          onChange={(e) => {
            setWellSearch("");
            setManagUnit(e.target.value);
          }}
        >
          <option value={""}>Todas las UG</option>

          {Array.from(new Set(wells.map((w) => w.manag_unit))).map((unit) => (
            <option key={unit} value={unit}>
              {unit}
            </option>
          ))}
        </select>
      </div>
      <div id="unit-filter">
        <h3>Proyecto</h3>
        <select
          value={project}
          onChange={(e) => {
            setProject(e.target.value);
          }}
        >
          <option value={""}>Todos</option>
          {Array.from(new Set(wells.map((w) => w.proyecto))).map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}

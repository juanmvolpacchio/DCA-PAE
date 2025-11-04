import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../helpers/constants";
import { useAuth } from "../../hooks/useAuth";
import { useWell } from "../../hooks/useWell";

// import logo from '/src/assets/icon.png';
import LoginButton from "../../components/LoginButton/LoginButton";
import "./root.css";

export default function MainScreen() {
  const { user } = useAuth();
  const { well } = useParams();
  const { well: activeWell } = useWell();
  const navigate = useNavigate();

  const [managUnit, setManagUnit] = useState("");
  const [project, setProject] = useState("");
  const [selectedWell, setSelectedWell] = useState(well || "");

  const { data: wellsData } = useQuery({
    queryKey: ["wells"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/wells`);
      if (!response.ok) throw new Error("Failed to load wells");
      const json = await response.json();
      return json.wells;
    },
    staleTime: 60_000,
  });

  const wells = (wellsData || []).toSorted((w1, w2) => {
    // Check if the 'name' property exists on both objects
    const name1 = w1?.name?.toLowerCase() || "";
    const name2 = w2?.name?.toLowerCase() || "";

    if (name1 < name2) {
      return -1;
    }
    if (name1 > name2) {
      return 1;
    }
    return 0; // names are equal
  });

  // Filter wells based on selected filters
  const filteredWells = wells
    .filter((w) => w && w.name)
    .filter(
      (w) =>
        (managUnit === "" || w.manag_unit === managUnit) &&
        (project === "" || w.proyecto === project)
    );

  // Handle well selection
  const handleWellChange = (e) => {
    const wellName = e.target.value;
    setSelectedWell(wellName);
    if (wellName) {
      navigate(`/${wellName}`);
    }
  };

  // Get unique management units
  const managUnits = Array.from(new Set(wells.map((w) => w.manag_unit))).filter(Boolean);

  // Get unique projects based on selected management unit
  const projects = Array.from(
    new Set(
      wells
        .filter((w) => managUnit === "" || w.manag_unit === managUnit)
        .map((w) => w.proyecto)
    )
  ).filter(Boolean);

  return (
    <>
      <header>
        {/* <img src={ logo } alt="logo"/> */}
        <div className="header-selectors">
          <select
            value={managUnit}
            onChange={(e) => {
              setManagUnit(e.target.value);
              setProject("");
              setSelectedWell("");
            }}
          >
            <option value="">Todas las unidades</option>
            {managUnits.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>

          <select
            value={project}
            onChange={(e) => {
              setProject(e.target.value);
              setSelectedWell("");
            }}
          >
            <option value="">Todos los proyectos</option>
            {projects.map((proj) => (
              <option key={proj} value={proj}>
                {proj}
              </option>
            ))}
          </select>

          <select value={selectedWell} onChange={handleWellChange}>
            <option value="">Seleccione un pozo</option>
            {filteredWells.map((w) => (
              <option key={w.name} value={w.name}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <LoginButton />
        {/* <span
                    className="material-symbols-rounded"
                    onClick={ window.winHandlers.exit }
                >close_small</span> */}
      </header>
      <div id="main-container">
        <div id="main-panel-container">
          <Outlet context={{ user, activeWell }} />
        </div>
      </div>
    </>
  );
}

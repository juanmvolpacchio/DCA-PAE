import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { Container, Navbar, Form } from "react-bootstrap";
import { API_BASE } from "../../helpers/constants";
import { useAuth } from "../../hooks/useAuth";
import { useWell } from "../../hooks/useWell";

// import logo from '/src/assets/icon.png';
import LoginButton from "../../components/LoginButton/LoginButton";
import "./root.css";

export default function MainScreen() {
  const { user } = useAuth();
  const { projectName, wellNames } = useParams();
  const { well: activeWell } = useWell();
  const navigate = useNavigate();

  const [managUnit, setManagUnit] = useState("");
  const [project, setProject] = useState(projectName || "");
  const [selectedWell, setSelectedWell] = useState(wellNames || "");

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

  // Sync project and well state with URL
  useEffect(() => {
    if (projectName && projectName !== project) {
      setProject(projectName);
    }
    if (wellNames && wellNames !== selectedWell) {
      setSelectedWell(wellNames);
    }
  }, [projectName, wellNames]);

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
    if (wellName && project) {
      navigate(`/project/${project}/wells/${wellName}`);
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
      <Navbar bg="light" className="border-bottom px-3 py-2">
        <Container fluid>
          {/* <Navbar.Brand><img src={ logo } alt="logo"/></Navbar.Brand> */}
          <div className="d-flex gap-3 flex-grow-1 align-items-center">
            <Form.Select
              value={managUnit}
              onChange={(e) => {
                setManagUnit(e.target.value);
                setProject("");
                setSelectedWell("");
              }}
              style={{ maxWidth: '250px' }}
            >
              <option value="">Todas las UG</option>
              {managUnits.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </Form.Select>

            <Form.Select
              value={project}
              onChange={(e) => {
                const selectedProject = e.target.value;
                setProject(selectedProject);
                setSelectedWell("");
                if (selectedProject) {
                  navigate(`/project/${selectedProject}`);
                }
              }}
              style={{ maxWidth: '250px' }}
            >
              <option value="">Todos los proyectos</option>
              {projects.map((proj) => (
                <option key={proj} value={proj}>
                  {proj}
                </option>
              ))}
            </Form.Select>

            <Form.Select
              value={selectedWell}
              onChange={handleWellChange}
              style={{ maxWidth: '250px' }}
            >
              <option value="">Seleccione un pozo</option>
              {filteredWells.map((w) => (
                <option key={w.name} value={w.name}>
                  {w.name}
                </option>
              ))}
            </Form.Select>
          </div>
          <LoginButton />
        </Container>
      </Navbar>
      <Container fluid className="h-100 p-0">
        <Outlet context={{ user, activeWell }} />
      </Container>
    </>
  );
}

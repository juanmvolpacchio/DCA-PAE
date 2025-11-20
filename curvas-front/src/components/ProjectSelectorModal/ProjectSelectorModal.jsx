import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import "./ProjectSelectorModal.css";

export default function ProjectSelectorModal({ show, onHide, projects, onConfirm, initialSelected = [] }) {
  const [selectedProjects, setSelectedProjects] = useState(initialSelected);
  const [searchText, setSearchText] = useState("");

  // Update selected projects when initialSelected changes or modal opens
  useEffect(() => {
    if (show) {
      setSelectedProjects(initialSelected);
      setSearchText("");
    }
  }, [initialSelected, show]);

  // Filter projects based on search text
  const filteredProjects = projects.filter(project =>
    project.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleToggleProject = (projectName) => {
    if (selectedProjects.includes(projectName)) {
      setSelectedProjects(selectedProjects.filter((p) => p !== projectName));
    } else {
      setSelectedProjects([...selectedProjects, projectName]);
    }
  };

  const handleSelectAll = () => {
    setSelectedProjects(filteredProjects);
  };

  const handleDeselectAll = () => {
    setSelectedProjects([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedProjects);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" className="project-selector-modal">
      <Modal.Header closeButton>
        <Modal.Title>Seleccionar proyectos</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex flex-column">
        <Form.Control
          type="text"
          placeholder="Buscar proyecto..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="mb-3"
        />
        <div className="d-flex justify-content-between mb-3">
          <Button variant="outline-primary" size="sm" onClick={handleSelectAll}>
            Seleccionar todos
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={handleDeselectAll}>
            Deseleccionar todos
          </Button>
        </div>
        <div className="projects-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filteredProjects.map((project) => (
            <Form.Check
              key={project}
              type="checkbox"
              id={`project-${project}`}
              label={project}
              checked={selectedProjects.includes(project)}
              onChange={() => handleToggleProject(project)}
            />
          ))}
        </div>
        <div className="mt-3 text-muted">
          {selectedProjects.length} proyecto{selectedProjects.length !== 1 ? "s" : ""} seleccionado{selectedProjects.length !== 1 ? "s" : ""}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={selectedProjects.length === 0}
        >
          Ver
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

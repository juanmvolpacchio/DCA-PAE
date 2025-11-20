import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import "./WellSelectorModal.css";

export default function WellSelectorModal({ show, onHide, wells, onConfirm, initialSelected = [] }) {
  const [selectedWells, setSelectedWells] = useState(initialSelected);
  const [searchText, setSearchText] = useState("");

  // Update selected wells when initialSelected changes or modal opens
  useEffect(() => {
    if (show) {
      setSelectedWells(initialSelected);
      setSearchText("");
    }
  }, [initialSelected, show]);

  // Filter wells based on search text
  const filteredWells = wells.filter(well =>
    well.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleToggleWell = (wellName) => {
    if (selectedWells.includes(wellName)) {
      setSelectedWells(selectedWells.filter((w) => w !== wellName));
    } else {
      setSelectedWells([...selectedWells, wellName]);
    }
  };

  const handleSelectAll = () => {
    setSelectedWells(filteredWells.map((w) => w.name));
  };

  const handleDeselectAll = () => {
    setSelectedWells([]);
  };

  const handleConfirm = () => {
    onConfirm(selectedWells);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" className="well-selector-modal">
      <Modal.Header closeButton>
        <Modal.Title>Seleccionar pozos</Modal.Title>
      </Modal.Header>
      <Modal.Body className="d-flex flex-column">
        <Form.Control
          type="text"
          placeholder="Buscar pozo..."
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
        <div className="wells-list">
          {filteredWells.map((well) => (
            <Form.Check
              key={well.name}
              type="checkbox"
              id={`well-${well.name}`}
              label={well.name}
              checked={selectedWells.includes(well.name)}
              onChange={() => handleToggleWell(well.name)}
            />
          ))}
        </div>
        <div className="mt-3 text-muted">
          {selectedWells.length} pozo{selectedWells.length !== 1 ? "s" : ""} seleccionado{selectedWells.length !== 1 ? "s" : ""}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={selectedWells.length === 0}
        >
          Ver
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Container, Table, Form, Button, Row, Col, Card } from "react-bootstrap";
import { API_BASE } from "../../helpers/constants";
import * as XLSX from "xlsx";

export default function ProjectAnalysis() {
  const { projectName } = useParams();

  const [fluidType, setFluidType] = useState("oil");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [mesesExtrapolacion, setMesesExtrapolacion] = useState(1);
  const [sortBy, setSortBy] = useState("deltaPercent");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch project analysis data
  const { data, isLoading, error } = useQuery({
    queryKey: ["projectAnalysis", projectName, fechaDesde, fechaHasta, fluidType],
    queryFn: async () => {
      const params = new URLSearchParams({
        fechaDesde,
        fechaHasta,
        fluidType,
      });
      const response = await fetch(
        `${API_BASE}/projects/${encodeURIComponent(projectName)}/analysis?${params}`
      );
      if (!response.ok) throw new Error("Failed to load project analysis");
      return response.json();
    },
    enabled: !!fechaDesde && !!fechaHasta,
  });

  // Initialize dates with current month
  useEffect(() => {
    if (!fechaDesde && !fechaHasta) {
      const today = new Date();
      const formattedDate = formatDateToMonthYear(today);
      setFechaDesde(formattedDate);
      setFechaHasta(formattedDate);
    }
  }, [fechaDesde, fechaHasta]);

  // Helper function to format date as YYYY-MM
  const formatDateToMonthYear = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  };

  // Helper function to parse YYYY-MM to Date
  const parseMonthYear = (dateStr) => {
    const [year, month] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, 1);
  };

  // Calculate months between two dates
  const calculateMonthsDiff = (from, to) => {
    const fromDate = parseMonthYear(from);
    const toDate = parseMonthYear(to);
    return (
      (toDate.getFullYear() - fromDate.getFullYear()) * 12 +
      (toDate.getMonth() - fromDate.getMonth()) +
      1
    );
  };

  // Add months to a date
  const addMonths = (dateStr, months) => {
    const date = parseMonthYear(dateStr);
    date.setMonth(date.getMonth() + months - 1);
    return formatDateToMonthYear(date);
  };

  // Handle fechaHasta change
  const handleFechaHastaChange = (newFechaHasta) => {
    setFechaHasta(newFechaHasta);
    if (fechaDesde && newFechaHasta >= fechaDesde) {
      const months = calculateMonthsDiff(fechaDesde, newFechaHasta);
      setMesesExtrapolacion(months);
    }
  };

  // Handle meses extrapolacion change
  const handleMesesExtrapolacionChange = (newMeses) => {
    const months = parseInt(newMeses, 10);
    if (isNaN(months) || months < 1) return;

    setMesesExtrapolacion(months);
    if (fechaDesde) {
      const newFechaHasta = addMonths(fechaDesde, months);
      setFechaHasta(newFechaHasta);
    }
  };

  // Handle fechaDesde change
  const handleFechaDesdeChange = (newFechaDesde) => {
    setFechaDesde(newFechaDesde);
    // Mantener los meses de extrapolación y ajustar fechaHasta
    const newFechaHasta = addMonths(newFechaDesde, mesesExtrapolacion);
    setFechaHasta(newFechaHasta);
  };

  // Calculate delta percent for each well and add to data
  const wellsWithDeltaPercent = data?.wells?.map(well => {
    const deltaPercent = well.volumeProduced !== 0
      ? Math.abs((well.volumeExtrapolated - well.volumeProduced) / well.volumeProduced * 100)
      : 0;
    return { ...well, deltaPercent };
  }) || [];

  // Sort wells
  const sortedWells = [...wellsWithDeltaPercent].sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case "well":
        aValue = a.well;
        bValue = b.well;
        break;
      case "volumeProduced":
        aValue = a.volumeProduced;
        bValue = b.volumeProduced;
        break;
      case "volumeExtrapolated":
        aValue = a.volumeExtrapolated;
        bValue = b.volumeExtrapolated;
        break;
      case "delta":
        aValue = a.delta;
        bValue = b.delta;
        break;
      case "deltaPercent":
        aValue = a.deltaPercent;
        bValue = b.deltaPercent;
        break;
      default:
        return 0;
    }

    if (sortBy === "well") {
      // String comparison
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      // Numeric comparison
      return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
    }
  });

  // Calculate totals
  const totals = wellsWithDeltaPercent.reduce(
    (acc, well) => ({
      volumeProduced: acc.volumeProduced + well.volumeProduced,
      volumeExtrapolated: acc.volumeExtrapolated + well.volumeExtrapolated,
      delta: acc.delta + well.delta,
    }),
    { volumeProduced: 0, volumeExtrapolated: 0, delta: 0 }
  );

  // Calculate total delta percent
  const totalDeltaPercent = totals.volumeProduced !== 0
    ? Math.abs((totals.volumeExtrapolated - totals.volumeProduced) / totals.volumeProduced * 100)
    : 0;

  // Handle column sort
  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order if clicking the same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to descending
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Get sort icon
  const getSortIcon = (column) => {
    if (sortBy !== column) return "⇅";
    return sortOrder === "asc" ? "↑" : "↓";
  };

  // Export to Excel
  const handleExportToExcel = () => {
    if (!data?.wells) return;

    const fluidLabels = {
      oil: "Petróleo",
      gas: "Gas",
      water: "Agua",
    };

    const worksheetData = [
      [`Análisis de Proyecto: ${projectName}`],
      [`Recurso: ${fluidLabels[fluidType]}`],
      [`Período: ${fechaDesde} a ${fechaHasta}`],
      [],
      ["Pozo", "Volumen Producido", "Volumen Potencial", "Delta", "Delta %"],
      ...sortedWells.map((well) => [
        well.well,
        well.volumeProduced,
        well.volumeExtrapolated,
        well.delta,
        well.deltaPercent.toFixed(2),
      ]),
      [],
      ["TOTAL", totals.volumeProduced, totals.volumeExtrapolated, totals.delta, totalDeltaPercent.toFixed(2)],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Análisis");

    XLSX.writeFile(workbook, `${projectName}_analisis_${fluidType}.xlsx`);
  };

  const fluidLabels = {
    oil: "Petróleo",
    gas: "Gas",
    water: "Agua",
  };

  if (error) {
    return (
      <Container className="mt-4">
        <div className="alert alert-danger">Error: {error.message}</div>
      </Container>
    );
  }

  return (
    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <h2>Análisis de Proyecto: {projectName}</h2>
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Label>Recurso</Form.Label>
              <Form.Select
                value={fluidType}
                onChange={(e) => setFluidType(e.target.value)}
              >
                <option value="oil">Petróleo</option>
                <option value="gas">Gas</option>
                <option value="water">Agua</option>
              </Form.Select>
            </Col>

            <Col md={3}>
              <Form.Label>Fecha Desde</Form.Label>
              <Form.Control
                type="month"
                value={fechaDesde}
                onChange={(e) => handleFechaDesdeChange(e.target.value)}
              />
            </Col>

            <Col md={3}>
              <Form.Label>Fecha Hasta</Form.Label>
              <Form.Control
                type="month"
                value={fechaHasta}
                onChange={(e) => handleFechaHastaChange(e.target.value)}
              />
            </Col>

            <Col md={3}>
              <Form.Label>Meses Potencial</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={mesesExtrapolacion}
                onChange={(e) => handleMesesExtrapolacionChange(e.target.value)}
              />
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {isLoading && (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      )}

      {data?.wells && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>
              Resultados ({data.wells.length} pozos) - {fluidLabels[fluidType]}
            </h5>
            <Button variant="success" onClick={handleExportToExcel}>
              Descargar como Excel
            </Button>
          </div>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>
                  <div className="d-flex align-items-center justify-content-between">
                    <span>Pozo</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 ms-2"
                      onClick={() => handleSort("well")}
                      title="Ordenar por Pozo"
                    >
                      {getSortIcon("well")}
                    </Button>
                  </div>
                </th>
                <th className="text-end">
                  <div className="d-flex align-items-center justify-content-end">
                    <span>Volumen Producido</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 ms-2"
                      onClick={() => handleSort("volumeProduced")}
                      title="Ordenar por Volumen Producido"
                    >
                      {getSortIcon("volumeProduced")}
                    </Button>
                  </div>
                </th>
                <th className="text-end">
                  <div className="d-flex align-items-center justify-content-end">
                    <span>Volumen Potencial</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 ms-2"
                      onClick={() => handleSort("volumeExtrapolated")}
                      title="Ordenar por Volumen Potencial"
                    >
                      {getSortIcon("volumeExtrapolated")}
                    </Button>
                  </div>
                </th>
                <th className="text-end">
                  <div className="d-flex align-items-center justify-content-end">
                    <span>Delta</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 ms-2"
                      onClick={() => handleSort("delta")}
                      title="Ordenar por Delta"
                    >
                      {getSortIcon("delta")}
                    </Button>
                  </div>
                </th>
                <th className="text-end">
                  <div className="d-flex align-items-center justify-content-end">
                    <span>Delta %</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 ms-2"
                      onClick={() => handleSort("deltaPercent")}
                      title="Ordenar por Delta %"
                    >
                      {getSortIcon("deltaPercent")}
                    </Button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="table-secondary fw-bold">
                <td>TOTAL</td>
                <td className="text-end">
                  {totals.volumeProduced.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="text-end">
                  {totals.volumeExtrapolated.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td
                  className={`text-end ${
                    totals.delta > 0 ? "text-danger" : totals.delta < 0 ? "text-success" : ""
                  }`}
                >
                  {totals.delta.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="text-end">
                  {totalDeltaPercent.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}%
                </td>
              </tr>
              {sortedWells.map((well) => (
                <tr key={well.well}>
                  <td>
                    <div className="d-flex align-items-center gap-2">
                      <span>{well.well}</span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => window.open(`#/project/${projectName}/wells/${well.well}`, '_blank')}
                        title="Ver detalles del pozo"
                      >
                        👁️
                      </Button>
                    </div>
                  </td>
                  <td className="text-end">
                    {well.volumeProduced.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="text-end">
                    {well.volumeExtrapolated.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    className={`text-end ${
                      well.delta > 0 ? "text-danger" : well.delta < 0 ? "text-success" : ""
                    }`}
                  >
                    {well.delta.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="text-end">
                    {well.deltaPercent.toLocaleString("es-AR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}%
                  </td>
                </tr>
              ))}
              <tr className="table-secondary fw-bold">
                <td>TOTAL</td>
                <td className="text-end">
                  {totals.volumeProduced.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="text-end">
                  {totals.volumeExtrapolated.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td
                  className={`text-end ${
                    totals.delta > 0 ? "text-danger" : totals.delta < 0 ? "text-success" : ""
                  }`}
                >
                  {totals.delta.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="text-end">
                  {totalDeltaPercent.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}%
                </td>
              </tr>
            </tbody>
          </Table>
        </>
      )}

      {!isLoading && data?.wells?.length === 0 && (
        <div className="alert alert-info">
          No se encontraron pozos con curvas guardadas para este proyecto.
        </div>
      )}
    </Container>
  );
}

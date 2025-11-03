import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { API_BASE } from "../helpers/constants";

export function useWell() {
  const { well } = useParams();

  const {
    data: wellData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["well", well],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/wells/${encodeURIComponent(well)}`
      );
      if (!response.ok) throw new Error("Failed to load well data");
      const json = await response.json();
      return json.well;
    },
    enabled: Boolean(well),
    staleTime: 60_000,
  });

  return {
    well: wellData,
    isLoading,
    error,
    wellName: well,
  };
}

import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { API_BASE } from "../helpers/constants";

export function useWell() {
  const { wellNames } = useParams();

  // Only fetch well data if it's a single well (not multiple)
  const isSingleWell = wellNames && !wellNames.includes(',');
  const wellName = isSingleWell ? wellNames : null;

  const {
    data: wellData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["well", wellName],
    queryFn: async () => {
      const response = await fetch(
        `${API_BASE}/wells/${encodeURIComponent(wellName)}`
      );
      if (!response.ok) throw new Error("Failed to load well data");
      const json = await response.json();
      return json.well;
    },
    enabled: Boolean(wellName),
    staleTime: 60_000,
  });

  return {
    well: wellData,
    isLoading,
    error,
    wellName: wellName,
  };
}

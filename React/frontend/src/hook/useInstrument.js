import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as service from "../services/scanInstrumentServices";

// Consistent query keys
const QUERY_KEYS = {
  all: ["instruments"],
  session: (session_id) => ["sessionInstrument", session_id],
};

// ----------------------
// QUERIES
// ----------------------

// Get all instruments
export const useAllInstruments = () => {
  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: service.getAllInstrument,
  });
};

// Get session instrument (requires session_id)
export const useSessionInstrument = (session_id) => {
  return useQuery({
    queryKey: QUERY_KEYS.session(session_id),
    queryFn: () => service.getSessionInstrument(session_id),
    enabled: !!session_id, // prevent running if session_id is null/undefined
  });
};

// ----------------------
// MUTATIONS
// ----------------------

// Scan instruments
export const useScanInstrument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: service.scanInstrument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};

// Select instrument
export const useSelectInstrument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ instrument_id, session_id }) =>
      service.selectInstrument(instrument_id, session_id),
    onSuccess: (_, variables) => {
      // invalidate only the relevant session cache
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.session(variables.session_id),
      });
    },
  });
};

// Update selected instrument
export const useUpdateSelectedInstrument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, message_id }) =>
      service.updateSelectedInstrument(id, message_id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.session(variables.id),
      });
    },
  });
};

// Delete single instrument
export const useDeleteInstrument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ instrument_id }) =>
      service.deleteInstrument(instrument_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
    },
  });
};

// Delete all instruments
export const useDeleteAllInstrument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: service.deleteAllInstrument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.removeQueries(); // clear session cache completely
    },
  });
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as sequenceService from "../services/sequenceServices";

export const useOptimizedSequence = (messageId, options = {}) => {
  return useQuery({
    queryKey: ['optimizedSequence', messageId],
    queryFn: () => sequenceService.getSequence(messageId),
    enabled: !!messageId && options.enabled !== false,
    ...options,
  });
};

export const useCreateOptimizedSequence = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => sequenceService.addSequence(data),
    onSuccess: (data, variables) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries(['optimizedSequence', variables.message_id]);
      queryClient.invalidateQueries(['checkOptimizedSequence', variables.message_id]);
    },
  });
};

export const useDeleteOptimizedSequence = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageId) => sequenceService.deleteSequence(messageId),
    onSuccess: (data, messageId) => {
      // Invalidate queries
      queryClient.invalidateQueries(['optimizedSequence', messageId]);
      queryClient.invalidateQueries(['checkOptimizedSequence', messageId]);
    },
  });
};
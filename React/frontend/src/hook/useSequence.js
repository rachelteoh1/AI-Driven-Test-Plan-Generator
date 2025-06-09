import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import * as service from '../services/sequenceServices';


export const useSequence = () => {
  return useQuery({queryKey:['sequence'],queryFn: service.getSequence});
};

export const useAddSequence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.addSequence, 
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['sequence', variables.sequenceId]);
    },
  });
};


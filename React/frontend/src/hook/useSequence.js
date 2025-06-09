import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import * as service from '../services/sequenceServices';


export const useSequence = () => {
  return useQuery(['sequence'], service.getSequence);
};

export const useAddSequence = () => {
  const queryClient = useQueryClient();
  return useMutation(service.addSequence, {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['sequence', variables.sequenceId]);
    },
  });
};


import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import * as service from '../services/pdfServices';


export const useUploadPdf = () => {
  return useMutation({
    mutationFn: (file) => service.uploadPdf(file),
  });
};
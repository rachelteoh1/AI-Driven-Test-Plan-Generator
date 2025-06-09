import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import * as service from '../services/chatServices';

//chat session
export const useChats = (userId) => {
  return useQuery({
    queryKey: ['chats', userId],
    queryFn: ({ queryKey }) => service.getChats(queryKey[1]),
    enabled: !!userId,
  });
};

export const useNewChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.newChat,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['chats', variables.session_id]);
    },
  });
};

export const useRenameChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.renameChat,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['chats', variables.session_id]);
    },
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.deleteChat,
    onSuccess: (_, variables) => {
      // Invalidate logs for the session
      //After it succeeds, it tells React Query to refetch chat logs for that session (invalidateQueries) 
      queryClient.invalidateQueries(['chats', variables.session_id]);
    },
  });
};

//chat log
export const useChatLogs = (sessionId) => {
  return useQuery({
    queryKey: ['chatLogs', sessionId],
    queryFn: () => service.getChatLogs(sessionId), //  pass a function
    enabled: !!sessionId, //  only fetch if sessionId is not null
  });
};
export const useAddChatLog = () => {
  const queryClient = useQueryClient();
  return useMutation( {
    mutationFn: service.addChatLog,
    onSuccess: (_, variables) => {
      // Invalidate logs for the session
      //After it succeeds, it tells React Query to refetch chat logs for that session (invalidateQueries) so the UI gets updated automatically with the new message.
      queryClient.invalidateQueries(['chatLogs', variables.session_id]);
    },
  });
};

export const useDeleteChatLog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: service.deleteChatLog, 
    onSuccess: (_, variables) => {
      // Invalidate logs for the session
      //After it succeeds, it tells React Query to refetch chat logs for that session (invalidateQueries) 
      queryClient.invalidateQueries(['chatLogs', variables.session_id]);
    },
  });
};
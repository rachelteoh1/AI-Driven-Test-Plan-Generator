import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import * as service from '../services/chatServices';

//chat session
export const useChats = () => {
  return useQuery(['chats'], service.getChats);
};

export const useNewChat = () => {
  const queryClient = useQueryClient();
  return useMutation(service.newChat, {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['chats', variables.session_id]);
    },
  });
};

export const useRenameChat = () => {
  const queryClient = useQueryClient();
  return useMutation(service.renameChat, {
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['chats', variables.session_id]);
    },
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  return useMutation(service.deleteChat, {
    onSuccess: (_, variables) => {
      // Invalidate logs for the session
      //After it succeeds, it tells React Query to refetch chat logs for that session (invalidateQueries) 
      queryClient.invalidateQueries(['chats', variables.session_id]);
    },
  });
};

//chat log
export const useChatLogs = (sessionId) => {
  return useQuery(['chatLogs', sessionId], () => service.getChatLogs(sessionId), { // makes sure each session has its own cached logs.
    enabled: !!sessionId, // avoid fetching when sessionId is null
  });
};

export const useAddChatLog = () => {
  const queryClient = useQueryClient();
  return useMutation(service.addChatLog, {
    onSuccess: (_, variables) => {
      // Invalidate logs for the session
      //After it succeeds, it tells React Query to refetch chat logs for that session (invalidateQueries) so the UI gets updated automatically with the new message.
      queryClient.invalidateQueries(['chatLogs', variables.session_id]);
    },
  });
};

export const useDeleteChatLog = () => {
  const queryClient = useQueryClient();
  return useMutation(service.deleteChatLog, {
    onSuccess: (_, variables) => {
      // Invalidate logs for the session
      //After it succeeds, it tells React Query to refetch chat logs for that session (invalidateQueries) 
      queryClient.invalidateQueries(['chatLogs', variables.session_id]);
    },
  });
};
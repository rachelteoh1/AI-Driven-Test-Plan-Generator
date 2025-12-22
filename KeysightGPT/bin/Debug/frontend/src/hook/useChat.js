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
      queryClient.invalidateQueries(['chats', variables.id]);
    },
  });
};

export const useRenameChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.renameChat,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['chats', data.id]);
    },
  });
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.deleteChat,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['chats']);
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

  return useMutation({
    mutationFn: service.addChatLog,
    onMutate: async (newMessage) => {
      await queryClient.cancelQueries(['chatLogs', newMessage.session_id]);

      const previousMessages = queryClient.getQueryData(['chatLogs', newMessage.session_id]);

      queryClient.setQueryData(['chatLogs', newMessage.session_id], (old) => [
        ...(old || []),
        { ...newMessage, message_id: Date.now() }, // fake id for optimistic update
      ]);

      return { previousMessages };
    },
    onError: (_err, newMessage, context) => {
      queryClient.setQueryData(['chatLogs', newMessage.session_id], context.previousMessages);
    },
    onSettled: (_data, _err, variables) => {
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

export const useDetectIntent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: service.detectChatIntent,
    onMutate: async (userInput) => {
      await queryClient.cancelQueries(['chatLogs', userInput.session_id]);

      const previousMessages = queryClient.getQueryData(['chatLogs', userInput.session_id]);

      return { previousMessages };
    },
    onSuccess: (botResponse, userInput) => {
      queryClient.setQueryData(['chatLogs', userInput.session_id], (old = []) => [
        ...old,
        botResponse, // bot message returned from backend
      ]);
    },
    onError: (_err, userInput, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['chatLogs', userInput.session_id], context.previousMessages);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries(['chatLogs', variables.session_id]);
    },
  });
};
// export const useModifyChatLog = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: service.modifyChatLog,
//     onSuccess: (response, variables) => {
//       // Invalidate and refetch the chat logs for this session
//       queryClient.invalidateQueries({
//         queryKey: ['chatLogs', variables.session_id],
//       });
//     },
//     onError: (error) => {
//       console.error("Modify chat log error:", error);
//     },
//   });
// };

export const useModifyChatLog = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: service.modifyChatLog,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches for this session's chat logs
      await queryClient.cancelQueries({
        queryKey: ['chatLogs', variables.session_id],
      });

      // Get the previous data
      const previousMessages = queryClient.getQueryData([
        'chatLogs',
        variables.session_id,
      ]);

      // Optimistically update the cache with the edited message
      queryClient.setQueryData(['chatLogs', variables.session_id], (old) => {
        if (!old) return old;
        
        return old.map((msg) =>
          msg.message_id === variables.message_id
            ? { 
                ...msg, 
                content: variables.content,
                has_been_modified: true 
              }
            : msg
        );
      });

      // Return context for rollback if needed
      return { previousMessages };
    },
    onSuccess: (response, variables) => {
      // Invalidate to force refetch from backend
      // This will get the new bot response and remove the old one
      queryClient.invalidateQueries({
        queryKey: ['chatLogs', variables.session_id],
        exact: true,  // ADD THIS to ensure exact match
      });
    },
    onError: (_err, variables, context) => {
      // Rollback to previous state on error
      if (context?.previousMessages) {
        queryClient.setQueryData(
          ['chatLogs', variables.session_id],
          context.previousMessages
        );
      }
    },
  });
};

export const useDeleteChatsForLoginSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, loginSessionId }) =>
      service.deleteChatsForLoginSession(userId, loginSessionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['chats']);
      queryClient.invalidateQueries(['chatLogs']);
    },
  });
};

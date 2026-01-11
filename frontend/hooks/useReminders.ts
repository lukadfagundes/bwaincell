import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Reminder {
  id: number;
  user_id: string;
  guild_id: string;
  message: string;
  frequency: "once" | "daily" | "weekly";
  time: string;
  day_of_week?: number;
  next_trigger: string;
  created_at?: string;
  updated_at?: string;
}

export function useReminders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const remindersQuery = useQuery({
    queryKey: ["reminders"],
    queryFn: async () => {
      const response = await api.get<Reminder[]>("/reminders");
      return response.data || [];
    },
    refetchInterval: 15000, // Poll every 15 seconds
  });

  const createReminderMutation = useMutation({
    mutationFn: (newReminder: {
      message: string;
      frequency: "once" | "daily" | "weekly";
      time: string;
      day_of_week?: number;
    }) => api.post("/reminders", newReminder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({
        title: "Reminder created",
        description: "Your reminder has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create reminder",
        variant: "destructive",
      });
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/reminders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      toast({
        title: "Reminder deleted",
        description: "Your reminder has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete reminder",
        variant: "destructive",
      });
    },
  });

  return {
    reminders: remindersQuery.data || [],
    isLoading: remindersQuery.isLoading,
    error: remindersQuery.error,
    createReminder: createReminderMutation.mutate,
    deleteReminder: deleteReminderMutation.mutate,
    isCreating: createReminderMutation.isPending,
    isDeleting: deleteReminderMutation.isPending,
  };
}

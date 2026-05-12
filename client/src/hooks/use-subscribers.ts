import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertSubscriber } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCreateSubscriber() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: InsertSubscriber) => {
      // Validate with schema first
      const validated = api.subscribers.create.input.parse(data);
      
      const res = await fetch(api.subscribers.create.path, {
        method: api.subscribers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.subscribers.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        if (res.status === 409) {
          const error = api.subscribers.create.responses[409].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Something went wrong. Please try again.");
      }

      return api.subscribers.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      toast({
        title: "Welcome aboard! 🚀",
        description: "You've been added to our early access list.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

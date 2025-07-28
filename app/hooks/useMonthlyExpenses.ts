import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GastosMensais } from "../types/types";

const API_URL = "/api/monthly-expenses";

const getMonthlyExpenses = async (): Promise<GastosMensais[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Erro ao buscar despesas mensais");
  }
  return response.json();
};

const addMonthlyExpense = async (expense: Omit<GastosMensais, 'id'>): Promise<GastosMensais> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expense),
  });
  if (!response.ok) {
    throw new Error("Erro ao adicionar despesa mensal");
  }
  return response.json();
};

const updateMonthlyExpense = async (expense: GastosMensais): Promise<GastosMensais> => {
  const response = await fetch(`${API_URL}/${expense.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(expense),
  });
  if (!response.ok) {
    throw new Error("Erro ao atualizar despesa mensal");
  }
  return response.json();
};

const deleteMonthlyExpense = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Erro ao deletar despesa mensal");
  }
};

export const useMonthlyExpenses = () => {
  const queryClient = useQueryClient();

  const { data: monthlyExpenses, isLoading, error } = useQuery({
    queryKey: ["monthlyExpenses"],
    queryFn: getMonthlyExpenses,
  });

  const createMutation = useMutation({
    mutationFn: addMonthlyExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyExpenses"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMonthlyExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyExpenses"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMonthlyExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monthlyExpenses"] });
    },
  });

  return {
    monthlyExpenses,
    isLoading,
    error,
    createMonthlyExpense: createMutation.mutate,
    updateMonthlyExpense: updateMutation.mutate,
    deleteMonthlyExpense: deleteMutation.mutate,
  };
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Transacao } from "../types/types";

const API_URL = "/api/transactions";

const getTransactions = async (): Promise<Transacao[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Erro ao buscar transações");
  }
  return response.json();
};

const addTransaction = async (transaction: Omit<Transacao, 'id'>): Promise<Transacao> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transaction),
  });
  if (!response.ok) {
    throw new Error("Erro ao adicionar transação");
  }
  return response.json();
};

const updateTransaction = async (transaction: Transacao): Promise<Transacao> => {
  const response = await fetch(`${API_URL}/${transaction.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transaction),
  });
  if (!response.ok) {
    throw new Error("Erro ao atualizar transação");
  }
  return response.json();
};

const deleteTransaction = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Erro ao deletar transação");
  }
};

const importMany = async (
  transactions: Omit<Transacao, "id">[]
): Promise<Transacao[]> => {
  const response = await fetch(`${API_URL}/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transactions),
  });
  if (!response.ok) {
    throw new Error("Erro ao importar transações");
  }
  return response.json();
};

export const useTransactions = () => {
  const queryClient = useQueryClient();

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ["transactions"],
    queryFn: getTransactions,
  });

  const createMutation = useMutation({
    mutationFn: addTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const importMutation = useMutation({
    mutationFn: importMany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  return {
    transactions,
    isLoading,
    error,
    createTransaction: createMutation.mutate,
    updateTransaction: updateMutation.mutate,
    deleteTransaction: deleteMutation.mutate,
    importTransactions: importMutation.mutate,
  };
};

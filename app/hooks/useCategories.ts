import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Categoria } from "../types/types";

const API_URL = "/api/categories";

const getCategories = async (): Promise<Categoria[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Erro ao buscar categorias");
  }
  return response.json();
};

const addCategory = async (category: Omit<Categoria, 'id'>): Promise<Categoria> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });
  if (!response.ok) {
    throw new Error("Erro ao adicionar categoria");
  }
  return response.json();
};

const updateCategory = async (category: Categoria): Promise<Categoria> => {
  const response = await fetch(`${API_URL}/${category.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(category),
  });
  if (!response.ok) {
    throw new Error("Erro ao atualizar categoria");
  }
  return response.json();
};

const deleteCategory = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Erro ao deletar categoria");
  }
};

export const useCategories = () => {
  const queryClient = useQueryClient();

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const createMutation = useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  return {
    categories,
    isLoading,
    error,
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
  };
};

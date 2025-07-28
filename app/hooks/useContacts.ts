import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Contato } from "../types/types";

const API_URL = "/api/contacts";

const getContacts = async (): Promise<Contato[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Erro ao buscar contatos");
  }
  return response.json();
};

const addContact = async (contact: Omit<Contato, 'id'>): Promise<Contato> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contact),
  });
  if (!response.ok) {
    throw new Error("Erro ao adicionar contato");
  }
  return response.json();
};

const updateContact = async (contact: Contato): Promise<Contato> => {
  const response = await fetch(`${API_URL}/${contact.id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contact),
  });
  if (!response.ok) {
    throw new Error("Erro ao atualizar contato");
  }
  return response.json();
};

const deleteContact = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Erro ao deletar contato");
  }
};

export const useContacts = () => {
  const queryClient = useQueryClient();

  const { data: contacts, isLoading, error } = useQuery({
    queryKey: ["contacts"],
    queryFn: getContacts,
  });

  const createMutation = useMutation({
    mutationFn: addContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });

  return {
    contacts,
    isLoading,
    error,
    createContact: createMutation.mutate,
    updateContact: updateMutation.mutate,
    deleteContact: deleteMutation.mutate,
  };
};

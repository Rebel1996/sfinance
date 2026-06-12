import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/api/phpClient';

export function useCustomCategories() {
  const queryClient = useQueryClient();

  const { data: customCategories = [], isLoading } = useQuery({
    queryKey: ['user-categories'],
    queryFn: () => categoriesApi.list(),
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: ({ label, type }) => categoriesApi.create({ label, type }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-categories'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-categories'] }),
  });

  const customRevenu  = customCategories.filter(c => c.type === 'revenu');
  const customDepense = customCategories.filter(c => c.type === 'depense');

  return {
    customCategories,
    customRevenu,
    customDepense,
    isLoading,
    createCategory: createMutation.mutateAsync,
    deleteCategory: deleteMutation.mutate,
    isCreating: createMutation.isPending,
  };
}

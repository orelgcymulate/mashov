'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Kid, KidCreate, KidUpdate,
  Homework, HomeworkCreate, HomeworkUpdate,
  ScheduleSlot, ScheduleSlotCreate, ScheduleSlotUpdate,
  Grade, GradeCreate, GradeUpdate,
  Behavior, BehaviorCreate, BehaviorUpdate,
  Message, MessageCreate, MessageUpdate,
  Notification, NotificationCreate, NotificationUpdate,
  DashboardSummary,
} from '@mashov/shared';
import { api } from '../api-client';

// Generic factory --------------------------------------------------------------

function entityHooks<E, C, U>(name: string) {
  return {
    useList(kidId?: string) {
      const key: (string | undefined)[] = [name, kidId];
      const path = `/api/${name}${kidId ? `?kidId=${encodeURIComponent(kidId)}` : ''}`;
      return useQuery({ queryKey: key, queryFn: () => api.get<E[]>(path) });
    },
    useCreate() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (input: C) => api.post<E>(`/api/${name}`, input),
        onSuccess: () => qc.invalidateQueries({ queryKey: [name] }),
      });
    },
    useUpdate() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: ({ id, patch }: { id: string; patch: U }) =>
          api.patch<E>(`/api/${name}/${id}`, patch),
        onSuccess: () => qc.invalidateQueries({ queryKey: [name] }),
      });
    },
    useDelete() {
      const qc = useQueryClient();
      return useMutation({
        mutationFn: (id: string) => api.del(`/api/${name}/${id}`),
        onSuccess: () => qc.invalidateQueries({ queryKey: [name] }),
      });
    },
  };
}

export const kids = entityHooks<Kid, KidCreate, KidUpdate>('kids');
export const homework = entityHooks<Homework, HomeworkCreate, HomeworkUpdate>('homework');
export const schedule = entityHooks<ScheduleSlot, ScheduleSlotCreate, ScheduleSlotUpdate>('schedule');
export const grades = entityHooks<Grade, GradeCreate, GradeUpdate>('grades');
export const behavior = entityHooks<Behavior, BehaviorCreate, BehaviorUpdate>('behavior');
export const messages = entityHooks<Message, MessageCreate, MessageUpdate>('messages');
export const notifications = entityHooks<Notification, NotificationCreate, NotificationUpdate>('notifications');

// Dashboard summary ------------------------------------------------------------

export function useDashboardSummary(kidIds?: string[]) {
  const qs = kidIds && kidIds.length > 0 ? `?${kidIds.map((id) => `kidId=${encodeURIComponent(id)}`).join('&')}` : '';
  return useQuery({
    queryKey: ['dashboard', 'summary', kidIds],
    queryFn: () => api.get<DashboardSummary>(`/api/dashboard/summary${qs}`),
  });
}

// Homework done toggle with optimistic update ----------------------------------

export function useToggleHomeworkDone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      api.patch<Homework>(`/api/homework/${id}`, { done }),
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: ['homework'] });
      const previous = qc.getQueriesData<Homework[]>({ queryKey: ['homework'] });
      for (const [key, list] of previous) {
        if (!list) continue;
        qc.setQueryData(
          key,
          list.map((h) => (h._id === id ? { ...h, done } : h)),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      for (const [key, value] of ctx.previous) qc.setQueryData(key, value);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['homework'] }),
  });
}

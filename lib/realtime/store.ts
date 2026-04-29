'use client';
import { create } from 'zustand';
import { initialState, reducer, type RoomEvent, type RoomState } from './reducer';

type StoreApi = RoomState & {
  dispatch: (e: RoomEvent) => void;
  reset: () => void;
};

export const useRoomStore = create<StoreApi>((set) => ({
  ...initialState,
  dispatch: (e) => set((prev) => reducer(prev, e)),
  reset: () => set({ ...initialState }),
}));

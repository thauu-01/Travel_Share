import { create } from 'zustand';

export const useTripStore = create((set, get) => ({
  currentTrip: null,
  activeDayIndex: 0,
  isLoading: false,

  setTrip: (trip) => set({ currentTrip: trip }),
  setActiveDayIndex: (index) => set({ activeDayIndex: index }),
  setLoading: (isLoading) => set({ isLoading }),

  addPlaceToActiveDay: (place) => {
    const { currentTrip, activeDayIndex } = get();
    if (!currentTrip || !currentTrip.days) return;
    const days = [...currentTrip.days];
    if (!days[activeDayIndex]) return;
    days[activeDayIndex] = {
      ...days[activeDayIndex],
      places: [...(days[activeDayIndex].places || []), place]
    };
    set({ currentTrip: { ...currentTrip, days } });
  },

  removePlaceFromActiveDay: (placeId) => {
    const { currentTrip, activeDayIndex } = get();
    if (!currentTrip || !currentTrip.days) return;
    const days = [...currentTrip.days];
    if (!days[activeDayIndex]) return;
    days[activeDayIndex] = {
      ...days[activeDayIndex],
      places: (days[activeDayIndex].places || []).filter(p => (p.id || p._id) !== placeId)
    };
    set({ currentTrip: { ...currentTrip, days } });
  },

  resetTrip: () => set({ currentTrip: null, activeDayIndex: 0, isLoading: false })
}));

export default useTripStore;

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (course) => {
        const { items } = get();
        const courseExists = items.some(item => item._id === course._id);
        
        if (!courseExists) {
          set({ items: [...items, course] });
        }
      },
      
      removeItem: (courseId) => {
        const { items } = get();
        set({ items: items.filter(item => item._id !== courseId) });
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price, 0);
      },
      
      getItemCount: () => {
        return get().items.length;
      },
      
      isInCart: (courseId) => {
        return get().items.some(item => item._id === courseId);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
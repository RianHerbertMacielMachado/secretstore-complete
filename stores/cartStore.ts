import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  coupon: { code: string; discount: number; type: 'PERCENTAGE' | 'FIXED' } | null
  
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  applyCoupon: (coupon: { code: string; discount: number; type: 'PERCENTAGE' | 'FIXED' }) => void
  removeCoupon: () => void
  
  getSubtotal: () => number
  getDiscount: () => number
  getTotal: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      coupon: null,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            }
          }
          return { items: [...state.items, item] }
        })
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }))
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }))
      },

      clearCart: () => set({ items: [], coupon: null }),

      applyCoupon: (coupon) => set({ coupon }),
      removeCoupon: () => set({ coupon: null }),

      getSubtotal: () => {
        return get().items.reduce((acc, i) => acc + i.price * i.quantity, 0)
      },

      getDiscount: () => {
        const { coupon, getSubtotal } = get()
        if (!coupon) return 0
        const subtotal = getSubtotal()
        if (coupon.type === 'PERCENTAGE') {
          return subtotal * (coupon.discount / 100)
        }
        return Math.min(coupon.discount, subtotal)
      },

      getTotal: () => {
        const { getSubtotal, getDiscount } = get()
        return Math.max(0, getSubtotal() - getDiscount())
      },
    }),
    {
      name: 'darkshop-cart',
    }
  )
)

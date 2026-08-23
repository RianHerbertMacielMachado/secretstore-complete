import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  image: string
  quantity: number
  /** ID da subcategoria à qual o produto pertence (usado para escopo de cupom) */
  subCategoryId: string
  /** ID da categoria pai (usado para escopo de cupom) */
  categoryId: string
}

export interface CouponState {
  code: string
  discount: number
  type: 'PERCENTAGE' | 'FIXED'
  /** 'ALL' = loja inteira, 'SPECIFIC' = restrito por ids abaixo */
  scope: 'ALL' | 'SPECIFIC'
  categoryIds: string[]
  subCategoryIds: string[]
  productIds: string[]
}

interface CartStore {
  items: CartItem[]
  coupon: CouponState | null

  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  applyCoupon: (coupon: CouponState) => void
  removeCoupon: () => void

  getSubtotal: () => number
  /** Retorna o total elegível do cupom (somente produtos válidos para o escopo) */
  getEligibleTotal: () => number
  /** Retorna o valor do desconto calculado APENAS sobre os itens elegíveis */
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
                i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
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

      getEligibleTotal: () => {
        const { coupon, items } = get()
        if (!coupon) return get().getSubtotal()
        if (coupon.scope === 'ALL') return get().getSubtotal()

        // Scope SPECIFIC — soma apenas os itens elegíveis
        return items.reduce((acc, item) => {
          const matchesProduct =
            coupon.productIds.length > 0 && coupon.productIds.includes(item.id)
          const matchesSubCategory =
            coupon.subCategoryIds.length > 0 && coupon.subCategoryIds.includes(item.subCategoryId)
          const matchesCategory =
            coupon.categoryIds.length > 0 && coupon.categoryIds.includes(item.categoryId)

          if (matchesProduct || matchesSubCategory || matchesCategory) {
            return acc + item.price * item.quantity
          }
          return acc
        }, 0)
      },

      getDiscount: () => {
        const { coupon, getEligibleTotal } = get()
        if (!coupon) return 0
        const eligible = getEligibleTotal()
        if (eligible <= 0) return 0
        if (coupon.type === 'PERCENTAGE') {
          return eligible * (coupon.discount / 100)
        }
        return Math.min(coupon.discount, eligible)
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

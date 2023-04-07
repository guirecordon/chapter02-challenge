import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { ProductTable } from '../pages/Cart/styles';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const stockAmount = await api.get(`/stock/${productId}`).then(response => response.data);
      const product = await api.get(`/products/${productId}`).then(response => response.data);
      const productExists = updatedCart.find(product => product.id === productId);
      const newAmount = productExists ? (productExists.amount + 1) : 1;

      if(newAmount > stockAmount.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if(productExists) {
        productExists.amount = newAmount;
      } else {
        const newProduct = {
            ...product,
            amount: newAmount,
        }
        
        updatedCart.push(newProduct)
      }

      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const removedCart = [...cart];
      const itemToBeRemoved = removedCart.findIndex(product => product.id === productId)

      if(itemToBeRemoved >= 0) {
        removedCart.splice(itemToBeRemoved, 1);
        setCart(removedCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(removedCart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
      if(amount <= 0) {
        return;
      }

      const stockAmount = await api.get(`/stock/${productId}`).then(response => response.data.amount)
      if(amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedAmountCart = [...cart]
      const updatedProduct = updatedAmountCart.find(product => product.id === productId);
      
      if(updatedProduct) {
        updatedProduct.amount = amount;
      }

      setCart(updatedAmountCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedAmountCart))
      
    } catch {
      // TODO
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}

import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const findCustomer = await this.customersRepository.findById(customer_id);

    if (!findCustomer) {
      throw new AppError('Customer not found');
    }

    const allProducts = await this.productsRepository.findAllById(products);

    const orderProducts = products.map(product => {
      const findProduct = allProducts.find(find => find.id === product.id);

      if (!findProduct) {
        throw new AppError('Product not found');
      }

      if (findProduct.quantity < product.quantity) {
        throw new AppError('Not enough product quantity.');
      } else {
        findProduct.quantity -= product.quantity;
      }

      return {
        quantity: product.quantity,
        product_id: product.id,
        price: findProduct.price,
      };
    });

    await this.productsRepository.updateQuantity(allProducts);

    const order = await this.ordersRepository.create({
      customer: findCustomer,
      products: orderProducts,
    });

    return order;
  }
}

export default CreateOrderService;

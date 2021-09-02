import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    return this.ormRepository.findOne({
      where: { name },
    });
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    return this.ormRepository.find({
      where: { id: In(products.map(product => product.id)) },
    });
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const allProducts = await this.findAllById(products);

    products.forEach(async product => {
      const findProduct = allProducts.find(find => find.id === product.id);

      if (!findProduct) return;

      findProduct.quantity = product.quantity;

      await this.ormRepository.save(findProduct);
    });

    return allProducts;
  }
}

export default ProductsRepository;

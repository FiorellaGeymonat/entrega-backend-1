export class ProductRepository {
  constructor(productDAO) {
    this.productDAO = productDAO;
  }

  getAll(params) {
    return this.productDAO.getAllProducts(params);
  }

  getById(pid) {
    return this.productDAO.getProductByID(pid);
  }

  create(data) {
    return this.productDAO.createProduct(data);
  }

  update(pid, data) {
    return this.productDAO.updateProduct(pid, data);
  }

  delete(pid) {
    return this.productDAO.deleteProduct(pid);
  }
}
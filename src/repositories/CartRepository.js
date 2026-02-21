export class CartRepository {
  constructor(cartDAO) {
    this.cartDAO = cartDAO;
  }

  getById(cid) {
    return this.cartDAO.getProductsFromCartByID(cid);
  }

  create() {
    return this.cartDAO.createCart();
  }

  addProduct(cid, pid) {
    return this.cartDAO.addProductByID(cid, pid);
  }

  deleteProduct(cid, pid) {
    return this.cartDAO.deleteProductByID(cid, pid);
  }

  updateAll(cid, products) {
    return this.cartDAO.updateAllProducts(cid, products);
  }

  updateQuantity(cid, pid, quantity) {
    return this.cartDAO.updateProductByID(cid, pid, quantity);
  }

  clear(cid) {
    return this.cartDAO.deleteAllProducts(cid);
  }
}
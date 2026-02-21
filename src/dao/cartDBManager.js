import { cartModel } from "./models/cartModel.js";
import productModel from "./models/productModel.js";
import { TicketModel } from "./models/ticket.model.js";

class cartDBManager {
  constructor(productDBManager) {
    this.productDBManager = productDBManager;
  }

  async getAllCarts() {
    return cartModel.find();
  }

  async getProductsFromCartByID(cid) {
    const cart = await cartModel.findOne({ _id: cid }).populate("products.product");

    if (!cart) throw new Error(`El carrito ${cid} no existe!`);

    return cart;
  }

  async createCart(ownerId) {
    if (!ownerId) throw new Error("OwnerId is required to create a cart");

    return await cartModel.create({ owner: ownerId, products: [] });
  }

  async addProductByID(cid, pid) {
    await this.productDBManager.getProductByID(pid);

    const cart = await cartModel.findOne({ _id: cid });

    if (!cart) throw new Error(`El carrito ${cid} no existe!`);

    let i = null;
    const result = cart.products.filter((item, index) => {
      if (item.product.toString() === pid) i = index;
      return item.product.toString() === pid;
    });

    if (result.length > 0) {
      cart.products[i].quantity += 1;
    } else {
      cart.products.push({
        product: pid,
        quantity: 1,
      });
    }
    await cartModel.updateOne({ _id: cid }, { products: cart.products });

    return await this.getProductsFromCartByID(cid);
  }

  async deleteProductByID(cid, pid) {
    await this.productDBManager.getProductByID(pid);

    const cart = await cartModel.findOne({ _id: cid });

    if (!cart) throw new Error(`El carrito ${cid} no existe!`);

    const newProducts = cart.products.filter((item) => item.product.toString() !== pid);

    await cartModel.updateOne({ _id: cid }, { products: newProducts });

    return await this.getProductsFromCartByID(cid);
  }

  async updateAllProducts(cid, products) {
    //Validate if exist products
    for (let key in products) {
      await this.productDBManager.getProductByID(products[key].product);
    }

    await cartModel.updateOne({ _id: cid }, { products: products });

    return await this.getProductsFromCartByID(cid);
  }

  async updateProductByID(cid, pid, quantity) {
    if (!quantity || isNaN(parseInt(quantity))) throw new Error(`La cantidad ingresada no es válida!`);

    await this.productDBManager.getProductByID(pid);

    const cart = await cartModel.findOne({ _id: cid });

    if (!cart) throw new Error(`El carrito ${cid} no existe!`);

    let i = null;
    const result = cart.products.filter((item, index) => {
      if (item.product.toString() === pid) i = index;
      return item.product.toString() === pid;
    });

    if (result.length === 0) throw new Error(`El producto ${pid} no existe en el carrito ${cid}!`);

    cart.products[i].quantity = parseInt(quantity);

    await cartModel.updateOne({ _id: cid }, { products: cart.products });

    return await this.getProductsFromCartByID(cid);
  }

  async deleteAllProducts(cid) {
    await cartModel.updateOne({ _id: cid }, { products: [] });

    return await this.getProductsFromCartByID(cid);
  }

  // Purchase dentro del manager
  async purchaseCart(cid, purchaserEmail) {
    const cart = await cartModel.findById(cid).populate("products.product");
    if (!cart) {
      const err = new Error("Cart not found");
      err.code = "CART_NOT_FOUND";
      throw err;
    }

    const purchasable = [];
    const notPurchasable = [];

    for (const item of cart.products) {
      const prod = item.product;
      const qty = item.quantity;

      if (!prod) {
        notPurchasable.push(item);
        continue;
      }

      if (prod.stock >= qty) purchasable.push(item);
      else notPurchasable.push(item);
    }

    if (purchasable.length === 0) {
      const err = new Error("No products available for purchase (insufficient stock)");
      err.code = "INSUFFICIENT_STOCK";
      err.payload = notPurchasable;
      throw err;
    }

    let amount = 0;

    for (const item of purchasable) {
      const prod = item.product;
      const qty = item.quantity;

      await productModel.updateOne({ _id: prod._id }, { $inc: { stock: -qty } });
      amount += prod.price * qty;
    }

    const code = `T-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const ticket = await TicketModel.create({
      code,
      amount,
      purchaser: purchaserEmail,
    });

    cart.products = notPurchasable.map((i) => ({
      product: i.product?._id ?? i.product,
      quantity: i.quantity,
    }));

    await cart.save();

    return {
      ticket,
      purchased: purchasable,
      notPurchased: notPurchasable,
    };
  }
}

export { cartDBManager };
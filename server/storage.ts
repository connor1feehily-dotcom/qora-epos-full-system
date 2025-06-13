import {
  users, products, customers, suppliers, transactions, transactionItems, promotions,
  type User, type Product, type Customer, type Supplier, type Transaction, type TransactionItem, type Promotion,
  type InsertUser, type InsertProduct, type InsertCustomer, type InsertSupplier, 
  type InsertTransaction, type InsertTransactionItem, type InsertPromotion
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: number): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: number, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: number): Promise<boolean>;
  
  // Transactions
  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionItems(transactionId: number): Promise<TransactionItem[]>;
  addTransactionItem(item: InsertTransactionItem): Promise<TransactionItem>;
  
  // Promotions
  getPromotions(): Promise<Promotion[]>;
  getPromotion(id: number): Promise<Promotion | undefined>;
  createPromotion(promotion: InsertPromotion): Promise<Promotion>;
  updatePromotion(id: number, promotion: Partial<InsertPromotion>): Promise<Promotion | undefined>;
  deletePromotion(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private customers: Map<number, Customer>;
  private suppliers: Map<number, Supplier>;
  private transactions: Map<number, Transaction>;
  private transactionItems: Map<number, TransactionItem>;
  private promotions: Map<number, Promotion>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.customers = new Map();
    this.suppliers = new Map();
    this.transactions = new Map();
    this.transactionItems = new Map();
    this.promotions = new Map();
    this.currentId = 1;
    
    this.seedData();
  }

  private seedData() {
    // Create default admin user
    this.createUser({
      username: 'admin',
      password: 'admin123',
      role: 'manager',
      isActive: true
    });

    // Create sample products
    const sampleProducts = [
      { name: 'Coca Cola 500ml', barcode: '5449000214911', price: '1.50', cost: '0.80', category: 'Drinks', stock: 24, minStock: 5, vatRate: '23.00', isActive: true },
      { name: 'Diesel', barcode: '', price: '1.42', cost: '1.20', category: 'Fuel', stock: 1000, minStock: 100, vatRate: '23.00', isActive: true },
      { name: 'White Bread', barcode: '5099821001236', price: '2.20', cost: '1.50', category: 'Food', stock: 12, minStock: 3, vatRate: '0.00', isActive: true },
      { name: 'Coffee Large', barcode: '', price: '2.80', cost: '1.00', category: 'Hot Drinks', stock: 50, minStock: 10, vatRate: '13.50', isActive: true },
      { name: 'Irish Times', barcode: '', price: '2.50', cost: '1.80', category: 'News', stock: 15, minStock: 5, vatRate: '0.00', isActive: true },
      { name: 'Marlboro Gold', barcode: '', price: '14.50', cost: '12.00', category: 'Tobacco', stock: 8, minStock: 2, vatRate: '23.00', isActive: true }
    ];

    sampleProducts.forEach(product => this.createProduct(product));

    // Create sample customer
    this.createCustomer({
      name: 'Walk-in Customer',
      email: '',
      phone: '',
      address: '',
      loyaltyPoints: 0,
      isActive: true
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || 'staff',
      isActive: insertUser.isActive ?? true
    };
    this.users.set(id, user);
    return user;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(p => p.isActive);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(p => p.barcode === barcode && p.isActive);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.currentId++;
    const product: Product = { 
      ...insertProduct, 
      id,
      barcode: insertProduct.barcode || null,
      cost: insertProduct.cost || null,
      stock: insertProduct.stock || 0,
      minStock: insertProduct.minStock || 0,
      isActive: insertProduct.isActive ?? true,
      vatRate: insertProduct.vatRate || "0.00"
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated: Product = { ...existing, ...productUpdate };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    
    const updated = { ...product, isActive: false };
    this.products.set(id, updated);
    return true;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values()).filter(c => c.isActive);
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.currentId++;
    const customer: Customer = { 
      ...insertCustomer, 
      id,
      email: insertCustomer.email || null,
      phone: insertCustomer.phone || null,
      address: insertCustomer.address || null,
      loyaltyPoints: insertCustomer.loyaltyPoints || 0,
      isActive: insertCustomer.isActive ?? true
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, customerUpdate: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existing = this.customers.get(id);
    if (!existing) return undefined;
    
    const updated: Customer = { ...existing, ...customerUpdate };
    this.customers.set(id, updated);
    return updated;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    const customer = this.customers.get(id);
    if (!customer) return false;
    
    const updated = { ...customer, isActive: false };
    this.customers.set(id, updated);
    return true;
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values()).filter(s => s.isActive);
  }

  async getSupplier(id: number): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = this.currentId++;
    const supplier: Supplier = { 
      ...insertSupplier, 
      id,
      email: insertSupplier.email || null,
      phone: insertSupplier.phone || null,
      address: insertSupplier.address || null,
      contactPerson: insertSupplier.contactPerson || null,
      isActive: insertSupplier.isActive ?? true
    };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: number, supplierUpdate: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const existing = this.suppliers.get(id);
    if (!existing) return undefined;
    
    const updated: Supplier = { ...existing, ...supplierUpdate };
    this.suppliers.set(id, updated);
    return updated;
  }

  async deleteSupplier(id: number): Promise<boolean> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return false;
    
    const updated = { ...supplier, isActive: false };
    this.suppliers.set(id, updated);
    return true;
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentId++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      customerId: insertTransaction.customerId || null,
      status: insertTransaction.status || 'completed',
      tillId: insertTransaction.tillId || 'till1',
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  async getTransactionItems(transactionId: number): Promise<TransactionItem[]> {
    return Array.from(this.transactionItems.values()).filter(item => item.transactionId === transactionId);
  }

  async addTransactionItem(insertItem: InsertTransactionItem): Promise<TransactionItem> {
    const id = this.currentId++;
    const item: TransactionItem = { ...insertItem, id };
    this.transactionItems.set(id, item);
    return item;
  }

  // Promotions
  async getPromotions(): Promise<Promotion[]> {
    return Array.from(this.promotions.values()).filter(p => p.isActive);
  }

  async getPromotion(id: number): Promise<Promotion | undefined> {
    return this.promotions.get(id);
  }

  async createPromotion(insertPromotion: InsertPromotion): Promise<Promotion> {
    const id = this.currentId++;
    const promotion: Promotion = { 
      ...insertPromotion, 
      id,
      description: insertPromotion.description || null,
      isActive: insertPromotion.isActive ?? true
    };
    this.promotions.set(id, promotion);
    return promotion;
  }

  async updatePromotion(id: number, promotionUpdate: Partial<InsertPromotion>): Promise<Promotion | undefined> {
    const existing = this.promotions.get(id);
    if (!existing) return undefined;
    
    const updated: Promotion = { ...existing, ...promotionUpdate };
    this.promotions.set(id, updated);
    return updated;
  }

  async deletePromotion(id: number): Promise<boolean> {
    const promotion = this.promotions.get(id);
    if (!promotion) return false;
    
    const updated = { ...promotion, isActive: false };
    this.promotions.set(id, updated);
    return true;
  }
}

export const storage = new MemStorage();

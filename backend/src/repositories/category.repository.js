import BaseRepository from './base.repository.js';
import { Category } from '../models/index.js';

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  async getAllCategories() {
    return await this.model.find().sort({ name: 1 });
  }

  async findBySlug(slug) {
    return await this.model.findOne({ slug });
  }
}

const repoInstance = new CategoryRepository();
export { repoInstance as CategoryRepository };
export default repoInstance;

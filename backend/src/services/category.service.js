import categoryRepository from '../repositories/category.repository.js';
import { slugify } from '../utils/slug.util.js';
import ApiError from '../utils/apiError.js';

class CategoryService {
  async getAllCategories() {
    return await categoryRepository.getAllCategories();
  }

  async createCategory({ name, icon, description }) {
    const slug = slugify(name);
    const existing = await categoryRepository.findBySlug(slug);
    if (existing) throw ApiError.conflict('Danh mục này đã tồn tại');

    return await categoryRepository.create({
      name: name.trim(),
      slug,
      icon: icon ? icon.trim() : null,
      description: description ? description.trim() : null
    });
  }

  async updateCategory(id, { name, icon, description }) {
    const category = await categoryRepository.findById(id);
    if (!category) throw ApiError.notFound('Không tìm thấy danh mục');

    if (name) {
      category.name = name.trim();
      category.slug = slugify(name);
    }
    if (icon !== undefined) category.icon = icon;
    if (description !== undefined) category.description = description;

    await category.save();
    return category;
  }

  async deleteCategory(id) {
    const category = await categoryRepository.findById(id);
    if (!category) throw ApiError.notFound('Không tìm thấy danh mục');

    await category.deleteOne();
    return { message: 'Đã xóa danh mục' };
  }
}

const serviceInstance = new CategoryService();
export { serviceInstance as CategoryService };
export default serviceInstance;

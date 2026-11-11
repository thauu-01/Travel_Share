import categoryService from '../services/category.service.js';
import ApiResponse from '../utils/apiResponse.js';

class CategoryController {
  async getAll(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      return ApiResponse.success(res, categories);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);
      return ApiResponse.created(res, category, 'Tạo danh mục thành công');
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      return ApiResponse.success(res, category, 'Cập nhật danh mục thành công');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await categoryService.deleteCategory(req.params.id);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new CategoryController();
export { controllerInstance as CategoryController };
export default controllerInstance;

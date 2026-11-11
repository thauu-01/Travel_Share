import placeRepository from '../repositories/place.repository.js';
import { slugify } from '../utils/slug.util.js';
import ApiError from '../utils/apiError.js';

class PlaceService {
  async getAllPlaces(queryParams) {
    return await placeRepository.getPlacesWithFilter(queryParams);
  }

  async getAllProvinces() {
    return await placeRepository.getAllProvinces();
  }

  async getPlaceById(placeId) {
    const place = await placeRepository.getPlaceByIdWithDetails(placeId);
    if (!place) throw ApiError.notFound('Không tìm thấy địa điểm');
    return place;
  }

  async createPlace(userId, { name, description, province, address, latitude, longitude, category_id }, file = null) {
    const slug = slugify(name);

    const place = await placeRepository.create({
      name: name.trim(),
      slug,
      description: description ? description.trim() : '',
      province: province.trim(),
      address: address ? address.trim() : '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      category_id: category_id ? parseInt(category_id) : null,
      user_id: userId,
      cover_image: file ? file.path : null
    });

    return place;
  }
}

const serviceInstance = new PlaceService();
export { serviceInstance as PlaceService };
export default serviceInstance;

export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async insertMany(data) {
    return await this.model.insertMany(data);
  }

  async findById(id, populate = []) {
    let query = this.model.findById(id);
    if (populate && populate.length > 0) {
      populate.forEach(p => {
        query = query.populate(p);
      });
    }
    return await query.exec();
  }

  async findOne(filter = {}, populate = []) {
    let query = this.model.findOne(filter);
    if (populate && populate.length > 0) {
      populate.forEach(p => {
        query = query.populate(p);
      });
    }
    return await query.exec();
  }

  async find(filter = {}, sort = { created_at: -1 }, limit = null, skip = 0, populate = []) {
    let query = this.model.find(filter).sort(sort);
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);
    if (populate && populate.length > 0) {
      populate.forEach(p => {
        query = query.populate(p);
      });
    }
    return await query.exec();
  }

  async count(filter = {}) {
    return await this.model.countDocuments(filter);
  }

  async updateById(id, updateData, options = { new: true }) {
    return await this.model.findByIdAndUpdate(id, updateData, options);
  }

  async updateOne(filter, updateData, options = { new: true }) {
    return await this.model.findOneAndUpdate(filter, updateData, options);
  }

  async updateMany(filter, updateData) {
    return await this.model.updateMany(filter, updateData);
  }

  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async deleteMany(filter) {
    return await this.model.deleteMany(filter);
  }

  async exists(filter) {
    return await this.model.exists(filter);
  }
}

export default BaseRepository;

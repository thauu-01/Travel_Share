import { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX } from 'react-icons/fi';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newCat, setNewCat] = useState({ name: '', icon: '', slug: '' });
  const [editCat, setEditCat] = useState({ name: '', icon: '', slug: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCategories();
      setCategories(res.data.data);
    } catch (err) {
      toast.error('Lỗi tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCat.name || !newCat.icon) return toast.error('Vui lòng nhập tên và icon danh mục');

    try {
      await adminAPI.createCategory(newCat);
      toast.success('Thêm danh mục mới thành công');
      setNewCat({ name: '', icon: '', slug: '' });
      setShowAdd(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    }
  };

  const handleStartEdit = (cat) => {
    setEditingId(cat.id);
    setEditCat({ name: cat.name, icon: cat.icon, slug: cat.slug });
  };

  const handleEditSubmit = async (id) => {
    if (!editCat.name || !editCat.icon) return toast.error('Vui lòng điền đủ thông tin');
    try {
      await adminAPI.updateCategory(id, editCat);
      toast.success('Cập nhật danh mục thành công');
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      const res = await adminAPI.deleteCategory(id);
      toast.success(res.data.message);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa danh mục này');
    }
  };

  return (
    <div className="animate-in" style={{ width: '100%' }}>
      <div className="mb-6 flex justify-between items-center">
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-sm shadow-blue-600/20 text-sm"
          onClick={() => setShowAdd(!showAdd)}
        >
          {showAdd ? 'Hủy' : 'Thêm danh mục'}
        </button>
      </div>

      {/* Add New Category form */}
      {showAdd && (
        <form onSubmit={handleAddSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-indigo-100 mb-6">
          <h3 className="m-0 mb-4 text-base font-bold text-slate-800">🏷️ Thêm danh mục mới</h3>
          <div className="grid grid-cols-[80px_1fr_1fr] gap-3 items-end">
            <div className="mb-0">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Icon</label>
              <input
                type="text"
                placeholder="🏖️"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={newCat.icon}
                onChange={e => setNewCat({ ...newCat, icon: e.target.value })}
                required
              />
            </div>
            <div className="mb-0">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tên danh mục</label>
              <input
                type="text"
                placeholder="VD: Bãi biển"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={newCat.name}
                onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-0">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Đường dẫn slug (Tùy chọn)</label>
              <input
                type="text"
                placeholder="bai-bien"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={newCat.slug}
                onChange={e => setNewCat({ ...newCat, slug: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Tạo mới</button>
          </div>
        </form>
      )}

      {/* Categories table */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-indigo-50">
            <tr>
              <th className="px-4 py-3 font-semibold w-20">Icon</th>
              <th className="px-4 py-3 font-semibold">Tên danh mục</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500 font-medium">Đang tải...</td>
              </tr>
            ) : categories.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                {/* Icon */}
                <td className="px-4 py-3 text-xl">
                  {editingId === c.id ? (
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-center text-sm border border-slate-300 rounded-md"
                      value={editCat.icon}
                      onChange={e => setEditCat({ ...editCat, icon: e.target.value })}
                    />
                  ) : c.icon}
                </td>

                {/* Name */}
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {editingId === c.id ? (
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md"
                      value={editCat.name}
                      onChange={e => setEditCat({ ...editCat, name: e.target.value })}
                    />
                  ) : c.name}
                </td>

                {/* Slug */}
                <td className="px-4 py-3 text-slate-600">
                  {editingId === c.id ? (
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md"
                      value={editCat.slug}
                      onChange={e => setEditCat({ ...editCat, slug: e.target.value })}
                    />
                  ) : c.slug}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  {editingId === c.id ? (
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => handleEditSubmit(c.id)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                        <FiSave size={14} /> Lưu
                      </button>
                      <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                        <FiX size={14} /> Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => handleStartEdit(c)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                        <FiEdit2 size={14} /> Sửa
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-colors shadow-sm">
                        <FiTrash2 size={14} /> Xóa
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

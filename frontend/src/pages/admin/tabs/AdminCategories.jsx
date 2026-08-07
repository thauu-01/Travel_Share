import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  // Delete modal state
  const [deleteTargetCat, setDeleteTargetCat] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getCategories();
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCat.name || !newCat.icon) return toast.error('Vui lòng điền đủ thông tin');
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

  const handleConfirmDelete = async () => {
    if (!deleteTargetCat) return;
    try {
      const res = await adminAPI.deleteCategory(deleteTargetCat.id);
      toast.success(res.data.message || 'Xóa danh mục thành công');
      setDeleteTargetCat(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa danh mục này');
    }
  };

  return (
    <div className="animate-in" style={{ width: '100%' }}>
      <div className="mb-6 flex justify-between items-center">
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-sm shadow-blue-600/20 text-sm cursor-pointer border-none"
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
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Icon Emoji</label>
              <input
                type="text"
                placeholder="🏖️"
                className="w-full px-3 py-2 text-sm font-medium text-slate-900 border border-slate-300 rounded-xl outline-none"
                value={newCat.icon}
                onChange={e => setNewCat({ ...newCat, icon: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tên danh mục</label>
              <input
                type="text"
                placeholder="Du lịch biển"
                className="w-full px-3 py-2 text-sm font-medium text-slate-900 border border-slate-300 rounded-xl outline-none"
                value={newCat.name}
                onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Slug (Tùy chọn)</label>
              <input
                type="text"
                placeholder="du-lich-bien"
                className="w-full px-3 py-2 text-sm font-medium text-slate-900 border border-slate-300 rounded-xl outline-none"
                value={newCat.slug}
                onChange={e => setNewCat({ ...newCat, slug: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold text-xs shadow-sm border-none cursor-pointer">
              Lưu danh mục
            </button>
          </div>
        </form>
      )}

      {/* Categories Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-indigo-50">
            <tr>
              <th className="px-4 py-3 font-semibold text-center w-16">Icon</th>
              <th className="px-4 py-3 font-semibold">Tên danh mục</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500 font-medium">Đang tải danh mục...</td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-500 font-medium">Chưa có danh mục nào</td>
              </tr>
            ) : categories.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                {/* Icon */}
                <td className="px-4 py-3 text-center text-lg">
                  {editingId === c.id ? (
                    <input
                      type="text"
                      className="w-12 text-center px-1 py-1 text-sm border rounded"
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
                      className="w-full px-2 py-1 text-sm border rounded"
                      value={editCat.name}
                      onChange={e => setEditCat({ ...editCat, name: e.target.value })}
                    />
                  ) : c.name}
                </td>

                {/* Slug */}
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                  {editingId === c.id ? (
                    <input
                      type="text"
                      className="w-full px-2 py-1 text-sm border rounded font-mono"
                      value={editCat.slug}
                      onChange={e => setEditCat({ ...editCat, slug: e.target.value })}
                    />
                  ) : c.slug}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  {editingId === c.id ? (
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => handleEditSubmit(c.id)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer">
                        <FiSave size={14} /> Lưu
                      </button>
                      <button onClick={() => setEditingId(null)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm cursor-pointer">
                        <FiX size={14} /> Hủy
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 justify-end">
                      <button onClick={() => handleStartEdit(c)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm cursor-pointer">
                        <FiEdit2 size={14} /> Sửa
                      </button>
                      <button onClick={() => setDeleteTargetCat(c)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-colors shadow-sm cursor-pointer">
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

      {/* Custom Modern Confirm Modal */}
      {deleteTargetCat && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-lg font-bold">
                🏷️
              </div>
              <button
                onClick={() => setDeleteTargetCat(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              Xác nhận xóa danh mục
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa danh mục <strong>"{deleteTargetCat.icon} {deleteTargetCat.name}"</strong>? Thao tác này không thể hoàn tác.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetCat(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md shadow-red-600/20 border-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FiTrash2 size={15} /> Xóa danh mục
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

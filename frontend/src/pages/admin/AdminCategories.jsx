import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
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
    <div className="animate-in" style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>🏷️ Quản lý danh mục</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>Thêm, sửa, hoặc xóa các loại danh mục phân loại du lịch</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Hủy' : 'Thêm danh mục'}
        </button>
      </div>

      {/* Add New Category form */}
      {showAdd && (
        <form onSubmit={handleAddSubmit} style={{
          background: 'white',
          borderRadius: 12,
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>🏷️ Thêm danh mục mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: '12px', alignItems: 'end' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Icon</label>
              <input
                type="text"
                placeholder="🏖️"
                className="form-input"
                value={newCat.icon}
                onChange={e => setNewCat({ ...newCat, icon: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Tên danh mục</label>
              <input
                type="text"
                placeholder="VD: Bãi biển"
                className="form-input"
                value={newCat.name}
                onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Đường dẫn slug (Tùy chọn)</label>
              <input
                type="text"
                placeholder="bai-bien"
                className="form-input"
                value={newCat.slug}
                onChange={e => setNewCat({ ...newCat, slug: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary btn-sm">Tạo mới</button>
          </div>
        </form>
      )}

      {/* Categories table */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '14px 16px', width: '80px' }}>Icon</th>
              <th style={{ padding: '14px 16px' }}>Tên danh mục</th>
              <th style={{ padding: '14px 16px' }}>Slug</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Đang tải...</td>
              </tr>
            ) : categories.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {/* Icon */}
                <td style={{ padding: '14px 16px', fontSize: '1.25rem' }}>
                  {editingId === c.id ? (
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '4px 8px', textAlign: 'center' }}
                      value={editCat.icon}
                      onChange={e => setEditCat({ ...editCat, icon: e.target.value })}
                    />
                  ) : c.icon}
                </td>

                {/* Name */}
                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>
                  {editingId === c.id ? (
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '4px 8px' }}
                      value={editCat.name}
                      onChange={e => setEditCat({ ...editCat, name: e.target.value })}
                    />
                  ) : c.name}
                </td>

                {/* Slug */}
                <td style={{ padding: '14px 16px', color: '#64748b' }}>
                  {editingId === c.id ? (
                    <input
                      type="text"
                      className="form-input"
                      style={{ padding: '4px 8px' }}
                      value={editCat.slug}
                      onChange={e => setEditCat({ ...editCat, slug: e.target.value })}
                    />
                  ) : c.slug}
                </td>

                {/* Actions */}
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  {editingId === c.id ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleEditSubmit(c.id)} className="btn btn-primary btn-sm" style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <FiSave /> Lưu
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <FiX /> Hủy
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleStartEdit(c)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <FiEdit2 /> Sửa
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="btn btn-sm" style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
                        <FiTrash2 /> Xóa
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

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { postAPI, placeAPI, categoryAPI, tripAPI } from '../services/api';
import toast from 'react-hot-toast';
import { PostForm } from '../components/post/PostForm';

export default function EditPostPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    Promise.all([
      placeAPI.getAll({ limit: 100 }),
      categoryAPI.getAll(),
      tripAPI.getMyTrips(),
      postAPI.getById(id)
    ])
      .then(([placesRes, catRes, tripsRes, postRes]) => {
        let fetchedPlaces = placesRes.data.data.places || [];
        setCategories(catRes.data.data || []);
        setMyTrips(tripsRes.data.data || []);

        const post = postRes.data.data;
        if (post.place && !fetchedPlaces.find(p => String(p.id) === String(post.place.id))) {
          fetchedPlaces = [post.place, ...fetchedPlaces];
        }
        setPlaces(fetchedPlaces);

        const postOwnerId = post.user_id || post.user?.id || post.user?._id;
        const currentUserId = user?.id || user?._id;
        if (String(postOwnerId) !== String(currentUserId) && user?.role !== 'admin') {
          toast.error('Bạn không có quyền sửa bài viết này');
          navigate('/profile');
          return;
        }

        setInitialValues({
          title: post.title || '',
          content: post.content || '',
          place_id: post.place?.id || post.place_id || '',
          trip_id: post.trip_id || post.trip?.id || '',
          rating: post.rating || 5,
          status: post.status || (post.is_hidden ? 'hidden' : 'published')
        });

        setExistingImages(post.images || []);
      })
      .catch(err => {
        toast.error('Lỗi tải dữ liệu bài viết');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, isAuthenticated, user, navigate]);

  const handleSubmit = async (formData) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('content', formData.content);
      if (formData.place_id) fd.append('place_id', formData.place_id);
      fd.append('trip_id', formData.trip_id || '');
      fd.append('rating', formData.rating);
      fd.append('status', formData.status);

      if (formData.imagesToRemove && formData.imagesToRemove.length > 0) {
        formData.imagesToRemove.forEach(img => fd.append('images_to_remove', img));
      }
      if (formData.newImages && formData.newImages.length > 0) {
        formData.newImages.forEach(img => fd.append('images', img));
      }

      await postAPI.update(id, fd);
      toast.success('Cập nhật bài viết thành công!');
      navigate(`/posts/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật bài viết');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-28 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <span>✏️</span> Chỉnh sửa bài viết
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Cập nhật nội dung, địa điểm, hình ảnh hoặc trạng thái bài viết của bạn.
          </p>
        </div>

        {initialValues && (
          <PostForm
            initialValues={initialValues}
            existingImages={existingImages}
            places={places}
            categories={categories}
            trips={myTrips}
            onSubmit={handleSubmit}
            isEdit={true}
            submitting={saving}
            onCancel={() => navigate(`/posts/${id}`)}
          />
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { postAPI, placeAPI, categoryAPI, tripAPI } from '../services/api';
import toast from 'react-hot-toast';
import { PostForm } from '../components/post/PostForm';

export default function CreatePostPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myTrips, setMyTrips] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    placeAPI.getAll({ limit: 100 }).then(r => setPlaces(r.data.data.places || [])).catch(() => {});
    categoryAPI.getAll().then(r => setCategories(r.data.data || [])).catch(() => {});
    tripAPI.getMyTrips().then(r => setMyTrips(r.data.data || [])).catch(() => {});
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (formData) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', formData.title);
      fd.append('content', formData.content);
      if (formData.place_id) fd.append('place_id', formData.place_id);
      if (formData.trip_id) fd.append('trip_id', formData.trip_id);
      fd.append('rating', formData.rating);

      if (formData.newImages && formData.newImages.length > 0) {
        formData.newImages.forEach(img => fd.append('images', img));
      }

      const res = await postAPI.create(fd);
      toast.success('Đăng bài viết thành công!');
      const createdPost = res.data.data;
      navigate(`/posts/${createdPost.id || createdPost._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi đăng bài viết');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-12">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <span>✍️</span> Viết bài chia sẻ
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Chia sẻ câu chuyện, cảm xúc và kinh nghiệm các chuyến đi của bạn cùng cộng đồng TravelShare.
          </p>
        </div>

        <PostForm
          places={places}
          categories={categories}
          trips={myTrips}
          onSubmit={handleSubmit}
          submitting={submitting}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}

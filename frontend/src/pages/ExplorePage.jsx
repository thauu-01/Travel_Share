import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { placeAPI, categoryAPI } from '../services/api';
import { FiMapPin, FiStar, FiEye } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function ExplorePage() {
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data.data || []));
    fetchPlaces();
  }, []);

  const fetchPlaces = async (catId = '') => {
    setLoading(true);
    try {
      const params = catId ? { category: catId } : {};
      const res = await placeAPI.getAll(params);
      setPlaces(res.data.data.places || []);
    } catch (err) { /* */ }
    setLoading(false);
  };

  const handleFilter = (catId) => {
    const val = selectedCategory === catId ? '' : catId;
    setSelectedCategory(val);
    fetchPlaces(val);
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1 className="page-title">🗺️ Khám phá địa điểm</h1>
          <p className="page-subtitle">Tương tác trên bản đồ hoặc lọc theo danh mục</p>
        </div>

        <div className="filter-chips animate-in delay-1">
          {categories.map(c => (
            <button key={c.id} className={`chip ${selectedCategory === String(c.id) ? 'active' : ''}`}
              onClick={() => handleFilter(String(c.id))}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* MAP */}
        <div className="map-container animate-in delay-2" style={{ marginBottom: '2rem' }}>
          <MapContainer center={[16.0, 106.0]} zoom={6} style={{ height: 500 }} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {places.map(place => (
              <Marker key={place.id} position={[parseFloat(place.latitude), parseFloat(place.longitude)]}>
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <strong style={{ fontSize: '0.9rem' }}>{place.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#666', margin: '0.25rem 0' }}>
                      {place.category?.icon} {place.category?.name} • {place.province}
                    </div>
                    <div style={{ fontSize: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <span>⭐ {place.avg_rating}</span>
                      <span>👁 {place.view_count}</span>
                    </div>
                    <Link to={`/search?province=${place.province}`}
                      style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>
                      Xem bài viết →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* PLACE LIST */}
        <div className="grid grid-4">
          {places.map(place => (
            <div key={place.id} className="card animate-in">
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>{place.category?.icon || '📍'}</span>
                  <h3 className="card-title" style={{ marginBottom: 0 }}>{place.name}</h3>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  <FiMapPin size={12} /> {place.province}
                </div>
                <p className="card-text" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {place.description}
                </p>
                <div className="card-meta">
                  <span><FiStar size={12} /> {place.avg_rating}</span>
                  <span><FiEye size={12} /> {place.view_count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {places.length === 0 && !loading && (
          <div className="empty-state"><div className="icon">🔍</div>Không tìm thấy địa điểm nào</div>
        )}
      </div>
    </div>
  );
}

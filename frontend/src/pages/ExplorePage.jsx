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
    <div className="pt-24 min-h-screen bg-[#f0f7ff]">
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="text-center mb-10 animate-in">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">🗺️ Khám phá địa điểm</h1>
          <p className="text-slate-500">Tương tác trên bản đồ hoặc lọc theo danh mục</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10 animate-in delay-1">
          {categories.map(c => (
            <button 
              key={c.id} 
              className={`px-4 py-2 rounded-full border transition-all font-medium flex items-center gap-2 cursor-pointer ${
                selectedCategory === String(c.id) 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20' 
                  : 'bg-white text-slate-600 border-indigo-100 hover:bg-blue-50 hover:text-blue-600'
              }`}
              onClick={() => handleFilter(String(c.id))}
            >
              <span className="text-lg">{c.icon}</span> {c.name}
            </button>
          ))}
        </div>

        {/* MAP */}
        <div className="rounded-3xl overflow-hidden border border-indigo-100 shadow-xl shadow-blue-900/5 mb-12 relative z-0 animate-in delay-2">
          <MapContainer center={[16.0, 106.0]} zoom={6} style={{ height: 500 }} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {places.map(place => (
              <Marker key={place.id} position={[parseFloat(place.latitude), parseFloat(place.longitude)]}>
                <Popup>
                  <div className="min-w-[180px] p-1 font-sans">
                    <strong className="text-sm font-bold text-slate-900 block mb-1">{place.name}</strong>
                    <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                      {place.category?.icon} {place.category?.name} • {place.province}
                    </div>
                    <div className="text-xs font-semibold text-slate-700 flex gap-3 bg-slate-50 p-1.5 rounded-lg mb-2">
                      <span className="flex items-center gap-1"><FiStar className="text-amber-500"/> {place.avg_rating}/5</span>
                      <span className="flex items-center gap-1"><FiEye className="text-blue-500"/> {place.view_count}</span>
                    </div>
                    <Link to={`/search?province=${place.province}`}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                      Xem bài viết <span className="text-lg leading-none">→</span>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* PLACE LIST */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-indigo-100 text-slate-500 animate-in delay-3">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-medium text-lg">Không tìm thấy địa điểm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in delay-3">
            {places.map(place => (
              <Link to={`/search?province=${place.province}&search=${encodeURIComponent(place.name)}`} key={place.id} className="block bg-white rounded-2xl border border-indigo-100 p-5 hover:-translate-y-1 hover:shadow-xl hover:border-blue-300/50 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl group-hover:bg-blue-100 transition-colors">
                    {place.category?.icon || '📍'}
                  </div>
                  <h3 className="font-bold text-slate-900 leading-tight">{place.name}</h3>
                </div>
                
                <div className="text-sm font-medium text-blue-600 flex items-center gap-1.5 mb-3 bg-blue-50 inline-flex px-2.5 py-1 rounded-lg">
                  <FiMapPin size={14} /> {place.province}
                </div>
                
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                  {place.description}
                </p>
                
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 border-t border-indigo-50 pt-3">
                  <span className="flex items-center gap-1.5"><FiStar size={14} className="text-amber-400"/> {place.avg_rating}/5</span>
                  <span className="flex items-center gap-1.5"><FiEye size={14} /> {place.view_count}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

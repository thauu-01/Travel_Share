const mongoose = require('mongoose');
const database = require('./config/database');
const {
  User,
  Category,
  Place,
  Post,
  PostImage,
  Comment,
  Like,
  ViewHistory,
  Trip,
  TripDay,
  TripPlace,
  Notification
} = require('./models');
const { Counter } = require('./models/counter');

const categoriesData = [
  { _id: 1, name: 'Biển', slug: 'bien', icon: '🏖️' },
  { _id: 2, name: 'Núi', slug: 'nui', icon: '⛰️' },
  { _id: 3, name: 'Ẩm thực', slug: 'am-thuc', icon: '🍜' },
  { _id: 4, name: 'Văn hóa', slug: 'van-hoa', icon: '🏛️' },
  { _id: 5, name: 'Thành phố', slug: 'thanh-pho', icon: '🏙️' },
  { _id: 6, name: 'Làng quê', slug: 'lang-que', icon: '🌾' },
  { _id: 7, name: 'Mạo hiểm', slug: 'mao-hiem', icon: '🧗' },
  { _id: 8, name: 'Nghỉ dưỡng', slug: 'nghi-duong', icon: '🏨' }
];

const usersData = [
  { _id: 1, email: 'admin@travelshare.vn', password: '$2a$10$p6ky.ragtX6IxCZZVDsBLuK7EBAoRjuw.k/WwBP0MoYHEtz8r3Uea', full_name: 'Admin TravelShare', role: 'admin', bio: 'Quản trị viên hệ thống TravelShare' },
  { _id: 2, email: 'nguyenvana@gmail.com', password: '$2a$10$p6ky.ragtX6IxCZZVDsBLuK7EBAoRjuw.k/WwBP0MoYHEtz8r3Uea', full_name: 'Nguyễn Văn A', role: 'user', bio: 'Travel blogger | Yêu biển và ẩm thực miền Trung' },
  { _id: 3, email: 'tranthib@gmail.com', password: '$2a$10$p6ky.ragtX6IxCZZVDsBLuK7EBAoRjuw.k/WwBP0MoYHEtz8r3Uea', full_name: 'Trần Thị B', role: 'user', bio: 'Photographer | Khám phá vùng cao Tây Bắc' },
  { _id: 4, email: 'levanc@gmail.com', password: '$2a$10$p6ky.ragtX6IxCZZVDsBLuK7EBAoRjuw.k/WwBP0MoYHEtz8r3Uea', full_name: 'Lê Văn C', role: 'user', bio: 'Backpacker | 30 tỉnh thành đã ghé qua' }
];

const placesData = [
  { _id: 1, name: 'Bãi biển Mỹ Khê', slug: 'bai-bien-my-khe', description: 'Bãi biển đẹp nhất hành tinh theo Forbes bình chọn. Cát trắng mịn, nước biển trong xanh, sóng vừa phải phù hợp tắm biển và lướt ván.', province: 'Đà Nẵng', address: 'Phường Phước Mỹ, Quận Sơn Trà, Đà Nẵng', latitude: 16.0544, longitude: 108.2472, category_id: 1, user_id: 2, avg_rating: 4.50, view_count: 1250 },
  { _id: 2, name: 'Đỉnh Fansipan', slug: 'dinh-fansipan', description: 'Nóc nhà Đông Dương với độ cao 3.143m. Hành trình chinh phục đầy thách thức nhưng vô cùng xứng đáng với cảnh sắc thiên nhiên hùng vĩ.', province: 'Lào Cai', address: 'Thị xã Sa Pa, Lào Cai', latitude: 22.3033, longitude: 103.7750, category_id: 2, user_id: 3, avg_rating: 4.80, view_count: 2100 },
  { _id: 3, name: 'Phố cổ Hội An', slug: 'pho-co-hoi-an', description: 'Di sản văn hóa thế giới UNESCO. Phố cổ lung linh ánh đèn lồng về đêm, ẩm thực phong phú và con người thân thiện.', province: 'Quảng Nam', address: 'Phường Minh An, TP Hội An, Quảng Nam', latitude: 15.8801, longitude: 108.3380, category_id: 4, user_id: 2, avg_rating: 4.70, view_count: 3200 },
  { _id: 4, name: 'Vịnh Hạ Long', slug: 'vinh-ha-long', description: 'Kỳ quan thiên nhiên thế giới với hàng nghìn hòn đảo đá vôi. Trải nghiệm du thuyền, chèo kayak và khám phá hang động.', province: 'Quảng Ninh', address: 'TP Hạ Long, Quảng Ninh', latitude: 20.9101, longitude: 107.1839, category_id: 1, user_id: 4, avg_rating: 4.60, view_count: 4500 },
  { _id: 5, name: 'Bún bò Huế O Phượng', slug: 'bun-bo-hue-o-phuong', description: 'Quán bún bò nổi tiếng nhất Huế. Nước dùng đậm đà, thịt bò mềm, giò heo béo ngậy. Phải thử khi đến Huế!', province: 'Thừa Thiên Huế', address: '17 Lý Thường Kiệt, TP Huế', latitude: 16.4637, longitude: 107.5909, category_id: 3, user_id: 2, avg_rating: 4.30, view_count: 890 },
  { _id: 6, name: 'Đà Lạt', slug: 'da-lat', description: 'Thành phố ngàn hoa với khí hậu mát mẻ quanh năm. Đồi chè, thác nước, vườn hoa và kiến trúc Pháp cổ kính.', province: 'Lâm Đồng', address: 'TP Đà Lạt, Lâm Đồng', latitude: 11.9404, longitude: 108.4583, category_id: 5, user_id: 3, avg_rating: 4.50, view_count: 5600 },
  { _id: 7, name: 'Sapa', slug: 'sapa', description: 'Ruộng bậc thang tuyệt đẹp, văn hóa đặc sắc của các dân tộc thiểu số và khí hậu se lạnh quanh năm.', province: 'Lào Cai', address: 'Thị xã Sa Pa, Lào Cai', latitude: 22.3364, longitude: 103.8438, category_id: 6, user_id: 3, avg_rating: 4.40, view_count: 3800 },
  { _id: 8, name: 'Động Phong Nha', slug: 'dong-phong-nha', description: 'Hệ thống hang động kỳ vĩ nhất Việt Nam, di sản thiên nhiên thế giới UNESCO.', province: 'Quảng Bình', address: 'Bố Trạch, Quảng Bình', latitude: 17.5899, longitude: 106.2831, category_id: 7, user_id: 4, avg_rating: 4.70, view_count: 2900 },
  { _id: 9, name: 'Côn Đảo', slug: 'con-dao', description: 'Hòn đảo hoang sơ với bãi biển nguyên sơ, rặng san hô đa dạng. Nơi lý tưởng cho nghỉ dưỡng và lặn biển.', province: 'Bà Rịa - Vũng Tàu', address: 'Huyện Côn Đảo', latitude: 8.6930, longitude: 106.6093, category_id: 8, user_id: 4, avg_rating: 4.60, view_count: 1800 },
  { _id: 10, name: 'Chùa Bái Đính', slug: 'chua-bai-dinh', description: 'Quần thể chùa lớn nhất Đông Nam Á, kiến trúc Phật giáo hoành tráng giữa thiên nhiên.', province: 'Ninh Bình', address: 'Gia Viễn, Ninh Bình', latitude: 20.2706, longitude: 105.8478, category_id: 4, user_id: 2, avg_rating: 4.20, view_count: 1500 }
];

const postsData = [
  { _id: 1, title: 'Review Bãi biển Mỹ Khê - Thiên đường biển Đà Nẵng', content: 'Mình vừa có chuyến du lịch 3 ngày ở Đà Nẵng và Mỹ Khê thực sự là highlight của chuyến đi! Bãi biển dài, cát trắng mịn, nước trong veo. Buổi sáng ra tắm biển sớm, buổi chiều ngồi cafe ven biển ngắm hoàng hôn. Ăn hải sản tươi ngon ngay bên bờ biển. Highly recommend cho ai muốn nghỉ dưỡng!', user_id: 2, place_id: 1, rating: 5, status: 'published', view_count: 450 },
  { _id: 2, title: 'Chinh phục Fansipan - Nóc nhà Đông Dương', content: 'Hành trình 2 ngày 1 đêm chinh phục đỉnh Fansipan. Đường đi khá vất vả nhưng phong cảnh hai bên đường tuyệt đẹp. Rừng già, mây mù, và cảm giác đứng trên đỉnh nhìn xuống thật khó tả. Tips: chuẩn bị áo ấm, giày leo núi và đồ ăn nhẹ. Thuê guide địa phương để an toàn hơn.', user_id: 3, place_id: 2, rating: 5, status: 'published', view_count: 780 },
  { _id: 3, title: 'Đêm Hội An - Lung linh ánh đèn lồng', content: 'Hội An về đêm đẹp mê hồn! Đèn lồng đủ màu sắc chiếu sáng khắp phố cổ. Mình thả hoa đăng trên sông Hoài, ăn cao lầu và bánh mì Phượng. Nhớ đi vào ngày 14 âm lịch để trải nghiệm đêm phố cổ không ánh điện, chỉ có đèn lồng và nến.', user_id: 2, place_id: 3, rating: 5, status: 'published', view_count: 1200 },
  { _id: 4, title: 'Vịnh Hạ Long 2 ngày 1 đêm bằng du thuyền', content: 'Review chi tiết chuyến du thuyền 2 ngày 1 đêm trên Vịnh Hạ Long. Từ bến cảng ra vịnh khoảng 30 phút. Cảnh đẹp không thể tin được - hàng nghìn hòn đảo đá vôi nhấp nhô. Chiều đi kayak, tối party trên thuyền, sáng sớm tập tai chi trên boong. Giá tour khoảng 3-5 triệu/người.', user_id: 4, place_id: 4, rating: 4, status: 'published', view_count: 2300 },
  { _id: 5, title: 'Bún bò Huế chuẩn vị - Review O Phượng', content: 'Đến Huế mà chưa ăn bún bò O Phượng thì coi như chưa đến! Nước dùng ninh xương hầm nhiều giờ, cay nồng sả ớt đặc trưng. Một tô 35k nhưng đầy ắp thịt bò, giò heo, chả cua. Quán đông lắm nên đi sớm nhé. Mở cửa từ 6h sáng.', user_id: 2, place_id: 5, rating: 4, status: 'published', view_count: 560 },
  { _id: 6, title: 'Đà Lạt mùa hoa dã quỳ', content: 'Tháng 10-11 là mùa hoa dã quỳ nở rộ ở Đà Lạt. Những con đường vàng rực hoa dã quỳ, không khí se lạnh, sương mù buổi sáng. Mình check-in ở đồi chè Cầu Đất, thác Datanla và chợ đêm. Homestay mình ở view cực đẹp, giá chỉ 300k/đêm.', user_id: 3, place_id: 6, rating: 5, status: 'published', view_count: 1800 },
  { _id: 7, title: 'Trekking Sapa - Trải nghiệm bản làng', content: 'Trekking 2 ngày qua các bản Cát Cát, Tả Van. Ruộng bậc thang mùa lúa chín vàng óng. Homestay ngay trong bản, ăn cơm với gia đình người HMông. Trải nghiệm văn hóa authentic không đâu bằng!', user_id: 3, place_id: 7, rating: 4, status: 'published', view_count: 920 },
  { _id: 8, title: 'Khám phá Phong Nha - Kẻ Bàng', content: 'Hệ thống hang động Phong Nha - Kẻ Bàng thực sự là kỳ quan. Mình đã tham quan động Phong Nha và động Thiên Đường. Thạch nhũ hàng triệu năm, sông ngầm chảy trong lòng núi. Nên đặt tour Oxalis để khám phá sâu hơn.', user_id: 4, place_id: 8, rating: 5, status: 'published', view_count: 670 },
  { _id: 9, title: 'Kinh nghiệm lặn biển ngắm san hô tại Côn Đảo', content: 'Côn Đảo là thiên đường lặn biển số 1 Việt Nam. Nước biển trong nhìn thấy tận đáy, rặng san hô nguyên sơ và nhiều loài cá đẹp. Mình đã lặn ở hòn Bảy Cạnh, cảm giác lướt giữa rặng san hô thật tuyệt vời!', user_id: 4, place_id: 9, rating: 5, status: 'published', view_count: 1450 },
  { _id: 10, title: 'Hành hương Bái Đính - Trải nghiệm tâm linh Ninh Bình', content: 'Khu du lịch tâm linh Bái Đính ấn tượng bởi kiến trúc đồ sộ và không gian tĩnh lặng. Đi xe điện từ ngoài vào, chiêm bái tượng Phật dát vàng lớn nhất châu Á và tháp Chuông 36 tấn.', user_id: 2, place_id: 10, rating: 4, status: 'published', view_count: 820 },
  { _id: 11, title: 'Trải nghiệm ẩm thực đêm Đà Nẵng - Chợ đêm Sơn Trà', content: 'Đà Nẵng về đêm không chỉ có cầu Rồng mà còn có chợ đêm Sơn Trà siêu vui! Đủ các món hải sản nướng, mì Quảng, chè Chè Liên béo ngậy. Giá cả bình dân, mua sắm đồ lưu niệm vô cùng thoải mái.', user_id: 3, place_id: 1, rating: 5, status: 'published', view_count: 990 },
  { _id: 12, title: 'Sapa mùa lúa chín - Sắc vàng rực rỡ mây trời', content: 'Mùa thu Sapa khoác lên mình màu áo vàng rực rỡ của những thung lũng ruộng bậc thang. Đứng từ đèo Ô Quy Hồ ngắm hoàng hôn đỏ rực xuống dãy Hoàng Liên Sơn, khung cảnh như bức họa đồ!', user_id: 2, place_id: 7, rating: 5, status: 'published', view_count: 2100 },
  { _id: 13, title: 'Check-in đồi chè Cầu Đất Đà Lạt sớm mai', content: 'Dậy từ 5h sáng săn mây ở đồi chè Cầu Đất Đà Lạt. Sương mù huyền ảo phủ tràn qua những luống chè xanh mướt. Đừng quên thử tách cafe nóng tại quán cafe container giữa đồi chè nhé!', user_id: 4, place_id: 6, rating: 4, status: 'published', view_count: 1340 },
  { _id: 14, title: 'Hội An mùa mưa - Nét trầm mặc yên bình', content: 'Nhiều người sợ đi Hội An mùa mưa nhưng với mình đó lại là trải nghiệm đặc biệt. Phố cổ lấp lánh nước mưa chiếu bóng đèn lồng, ngồi góc cafe yên tĩnh nghe nhạc Trịnh và ngắm dòng sông Hoài phẳng lặng.', user_id: 2, place_id: 3, rating: 5, status: 'published', view_count: 1120 },
  { _id: 15, title: 'Chèo thuyền Kayak khám phá Hang Luồn Hạ Long', content: 'Một trong những hoạt động thích nhất khi đi Hạ Long là chèo kayak qua Hang Luồn. Hang ngắn nhưng dẫn vào một hồ nước mặn xanh biếc khép kín giữa các vách đá đứng, nơi có đàn khỉ sinh sống.', user_id: 3, place_id: 4, rating: 5, status: 'published', view_count: 1670 },
  { _id: 16, title: 'Thưởng thức cơm hến và chè nòng nặc đất Cố Đô Huế', content: 'Cơm hến Huế mang vị cay xé lưỡi đặc trưng của ớt tươi và mắm rốc, ăn kèm da heo chiên giòn sần sật. Ăn xong làm thêm ly chè hẻm thanh ngọt dịu mát đúng chuẩn phong vị Huế.', user_id: 4, place_id: 5, rating: 4, status: 'published', view_count: 730 },
  { _id: 17, title: 'Lặn ngắm san hô Bãi Trặt Côn Đảo', content: 'Thiên nhiên Côn Đảo giữ nguyên nét hoang sơ kỳ vĩ. Biển lặng sóng, nước xanh màu ngọc bích. Dịch vụ du lịch ở đây rất có ý thức bảo vệ môi trường, không xả rác và bảo tồn san hô.', user_id: 2, place_id: 9, rating: 5, status: 'published', view_count: 890 },
  { _id: 18, title: 'Ngắm toàn cảnh Đà Nẵng từ Đỉnh Bàn Cờ Sơn Trà', content: 'Đường lên Đỉnh Bàn Cờ uốn lượn qua những cánh rừng nguyên sinh rợp bóng mát. Lên đến đỉnh được ngắm tượng Đế Thích đánh cờ và thu trọn toàn cảnh thành phố Đà Nẵng cùng biển xanh trong tầm mắt.', user_id: 3, place_id: 1, rating: 5, status: 'published', view_count: 1560 }
];

const commentsData = [
  { _id: 1, content: 'Bãi biển đẹp quá! Mình cũng muốn đi Đà Nẵng', user_id: 3, post_id: 1, parent_id: null },
  { _id: 2, content: 'Bạn ở khách sạn nào vậy? Share info đi!', user_id: 4, post_id: 1, parent_id: null },
  { _id: 3, content: 'Mình ở Fusion Suites, view biển rất đẹp bạn ơi', user_id: 2, post_id: 1, parent_id: 2 },
  { _id: 4, content: 'Fansipan đúng là phải đi một lần trong đời!', user_id: 2, post_id: 2, parent_id: null },
  { _id: 5, content: 'Hội An luôn đẹp, mình đã đi 3 lần rồi', user_id: 4, post_id: 3, parent_id: null },
  { _id: 6, content: 'Cao lầu Hội An ngon lắm, mình nhớ mãi', user_id: 3, post_id: 3, parent_id: null },
  { _id: 7, content: 'View du thuyền đẹp quá trời! Save lại đi sau này', user_id: 2, post_id: 4, parent_id: null },
  { _id: 8, content: 'Bún bò O Phượng đúng là huyền thoại!', user_id: 3, post_id: 5, parent_id: null }
];

const likesData = [
  { _id: 1, user_id: 2, post_id: 2 },
  { _id: 2, user_id: 2, post_id: 4 },
  { _id: 3, user_id: 2, post_id: 6 },
  { _id: 4, user_id: 2, post_id: 7 },
  { _id: 5, user_id: 3, post_id: 1 },
  { _id: 6, user_id: 3, post_id: 3 },
  { _id: 7, user_id: 3, post_id: 4 },
  { _id: 8, user_id: 3, post_id: 5 },
  { _id: 9, user_id: 3, post_id: 8 },
  { _id: 10, user_id: 4, post_id: 1 },
  { _id: 11, user_id: 4, post_id: 2 },
  { _id: 12, user_id: 4, post_id: 3 },
  { _id: 13, user_id: 4, post_id: 5 },
  { _id: 14, user_id: 4, post_id: 6 }
];

const viewHistoryData = [
  { _id: 1, user_id: 2, post_id: 1 },
  { _id: 2, user_id: 2, post_id: 2 },
  { _id: 3, user_id: 2, post_id: 3 },
  { _id: 4, user_id: 2, post_id: 4 },
  { _id: 5, user_id: 2, post_id: 5 },
  { _id: 6, user_id: 2, post_id: 6 },
  { _id: 7, user_id: 3, post_id: 1 },
  { _id: 8, user_id: 3, post_id: 2 },
  { _id: 9, user_id: 3, post_id: 3 },
  { _id: 10, user_id: 3, post_id: 4 },
  { _id: 11, user_id: 3, post_id: 7 },
  { _id: 12, user_id: 3, post_id: 8 },
  { _id: 13, user_id: 4, post_id: 1 },
  { _id: 14, user_id: 4, post_id: 2 },
  { _id: 15, user_id: 4, post_id: 3 },
  { _id: 16, user_id: 4, post_id: 4 },
  { _id: 17, user_id: 4, post_id: 5 },
  { _id: 18, user_id: 4, post_id: 6 },
  { _id: 19, user_id: 4, post_id: 7 },
  { _id: 20, user_id: 4, post_id: 8 }
];

const tripsData = [
  { _id: 1, title: 'Du lịch miền Trung 5 ngày', description: 'Hành trình khám phá Đà Nẵng - Hội An - Huế', user_id: 2, start_date: new Date('2026-06-01'), end_date: new Date('2026-06-05'), is_public: true }
];

const tripDaysData = [
  { _id: 1, trip_id: 1, day_number: 1, date: new Date('2026-06-01'), note: 'Đà Nẵng - Bãi biển Mỹ Khê' },
  { _id: 2, trip_id: 1, day_number: 2, date: new Date('2026-06-02'), note: 'Hội An - Phố cổ' },
  { _id: 3, trip_id: 1, day_number: 3, date: new Date('2026-06-03'), note: 'Huế - Ẩm thực' }
];

const tripPlacesData = [
  { _id: 1, trip_day_id: 1, place_id: 1, order_index: 1, note: 'Tắm biển buổi sáng' },
  { _id: 2, trip_day_id: 2, place_id: 3, order_index: 1, note: 'Tham quan phố cổ buổi chiều và tối' },
  { _id: 3, trip_day_id: 3, place_id: 5, order_index: 1, note: 'Ăn bún bò Huế' }
];

async function reset() {
  try {
    // Wait for connection to open
    if (mongoose.connection.readyState === 0) {
      await new Promise(resolve => mongoose.connection.once('open', resolve));
    }

    console.log('✓ Kết nối MongoDB thành công');

    // Clear all collections
    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      await mongoose.connection.collections[collectionName].deleteMany({});
      console.log(`✓ Đã xóa collection: ${collectionName}`);
    }

    // Seed Categories
    await Category.insertMany(categoriesData);
    console.log('✓ Seed Categories thành công');
    await Counter.findOneAndUpdate({ _id: 'categories' }, { seq: categoriesData.length }, { upsert: true });

    // Seed Users
    await User.insertMany(usersData);
    console.log('✓ Seed Users thành công');
    await Counter.findOneAndUpdate({ _id: 'users' }, { seq: usersData.length }, { upsert: true });

    // Seed Places
    await Place.insertMany(placesData);
    console.log('✓ Seed Places thành công');
    await Counter.findOneAndUpdate({ _id: 'places' }, { seq: placesData.length }, { upsert: true });

    // Seed Posts
    await Post.insertMany(postsData);
    console.log('✓ Seed Posts thành công');
    await Counter.findOneAndUpdate({ _id: 'posts' }, { seq: postsData.length }, { upsert: true });

    // Seed Comments
    await Comment.insertMany(commentsData);
    console.log('✓ Seed Comments thành công');
    await Counter.findOneAndUpdate({ _id: 'comments' }, { seq: commentsData.length }, { upsert: true });

    // Seed Likes
    await Like.insertMany(likesData);
    console.log('✓ Seed Likes thành công');
    await Counter.findOneAndUpdate({ _id: 'likes' }, { seq: likesData.length }, { upsert: true });

    // Seed View History
    await ViewHistory.insertMany(viewHistoryData);
    console.log('✓ Seed ViewHistory thành công');
    await Counter.findOneAndUpdate({ _id: 'view_history' }, { seq: viewHistoryData.length }, { upsert: true });

    // Seed Trips
    await Trip.insertMany(tripsData);
    console.log('✓ Seed Trips thành công');
    await Counter.findOneAndUpdate({ _id: 'trips' }, { seq: tripsData.length }, { upsert: true });

    // Seed TripDays
    await TripDay.insertMany(tripDaysData);
    console.log('✓ Seed TripDays thành công');
    await Counter.findOneAndUpdate({ _id: 'trip_days' }, { seq: tripDaysData.length }, { upsert: true });

    // Seed TripPlaces
    await TripPlace.insertMany(tripPlacesData);
    console.log('✓ Seed TripPlaces thành công');
    await Counter.findOneAndUpdate({ _id: 'trip_places' }, { seq: tripPlacesData.length }, { upsert: true });

    // Initialize remaining counters
    await Counter.findOneAndUpdate({ _id: 'post_images' }, { seq: 0 }, { upsert: true });
    await Counter.findOneAndUpdate({ _id: 'notifications' }, { seq: 0 }, { upsert: true });

    console.log('✓ Reset & Seed database thành công!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Lỗi:', error);
    process.exit(1);
  }
}

reset();

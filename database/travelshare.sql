-- ============================================
-- TravelShare Database Schema
-- Nền tảng chia sẻ địa điểm du lịch C2C
-- ============================================

CREATE DATABASE IF NOT EXISTS travelshare
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE travelshare;

-- ========== USERS ==========
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB;

-- ========== CATEGORIES ==========
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT '📍',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========== PLACES ==========
CREATE TABLE IF NOT EXISTS places (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  province VARCHAR(100) NOT NULL,
  address TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  cover_image VARCHAR(500) DEFAULT NULL,
  category_id INT,
  user_id INT NOT NULL,
  avg_rating DECIMAL(3, 2) DEFAULT 0.00,
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_province (province),
  INDEX idx_category (category_id),
  INDEX idx_slug (slug),
  FULLTEXT INDEX idx_fulltext_place (name, description)
) ENGINE=InnoDB;

-- ========== POSTS ==========
CREATE TABLE IF NOT EXISTS posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  user_id INT NOT NULL,
  place_id INT,
  rating TINYINT DEFAULT NULL CHECK (rating >= 1 AND rating <= 5),
  status ENUM('draft', 'published') DEFAULT 'published',
  view_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_place (place_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  FULLTEXT INDEX idx_fulltext_post (title, content)
) ENGINE=InnoDB;

-- ========== POST IMAGES ==========
CREATE TABLE IF NOT EXISTS post_images (
  id INT PRIMARY KEY AUTO_INCREMENT,
  post_id INT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_post (post_id)
) ENGINE=InnoDB;

-- ========== COMMENTS ==========
CREATE TABLE IF NOT EXISTS comments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  content TEXT NOT NULL,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  parent_id INT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  INDEX idx_post (post_id),
  INDEX idx_parent (parent_id)
) ENGINE=InnoDB;

-- ========== LIKES ==========
CREATE TABLE IF NOT EXISTS likes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (user_id, post_id),
  INDEX idx_post (post_id)
) ENGINE=InnoDB;

-- ========== VIEW HISTORY ==========
CREATE TABLE IF NOT EXISTS view_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  post_id INT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_post (post_id),
  INDEX idx_viewed (viewed_at)
) ENGINE=InnoDB;

-- ========== TRIPS ==========
CREATE TABLE IF NOT EXISTS trips (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  user_id INT NOT NULL,
  start_date DATE,
  end_date DATE,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB;

-- ========== TRIP DAYS ==========
CREATE TABLE IF NOT EXISTS trip_days (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trip_id INT NOT NULL,
  day_number INT NOT NULL,
  date DATE DEFAULT NULL,
  note TEXT,
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  INDEX idx_trip (trip_id)
) ENGINE=InnoDB;

-- ========== TRIP PLACES ==========
CREATE TABLE IF NOT EXISTS trip_places (
  id INT PRIMARY KEY AUTO_INCREMENT,
  trip_day_id INT NOT NULL,
  place_id INT NOT NULL,
  order_index INT DEFAULT 0,
  note TEXT,
  FOREIGN KEY (trip_day_id) REFERENCES trip_days(id) ON DELETE CASCADE,
  FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
  INDEX idx_day (trip_day_id)
) ENGINE=InnoDB;

-- ========== NOTIFICATIONS ==========
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  from_user_id INT,
  type ENUM('like', 'comment', 'reply') NOT NULL,
  post_id INT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read),
  INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- ============================================
-- SEED DATA
-- ============================================

-- Categories
INSERT INTO categories (name, slug, icon) VALUES
  ('Biển', 'bien', '🏖️'),
  ('Núi', 'nui', '⛰️'),
  ('Ẩm thực', 'am-thuc', '🍜'),
  ('Văn hóa', 'van-hoa', '🏛️'),
  ('Thành phố', 'thanh-pho', '🏙️'),
  ('Làng quê', 'lang-que', '🌾'),
  ('Mạo hiểm', 'mao-hiem', '🧗'),
  ('Nghỉ dưỡng', 'nghi-duong', '🏨');

-- Users (password: Test@123)
INSERT INTO users (email, password, full_name, avatar_url, bio, role) VALUES
  ('admin@travelshare.vn', '$2a$10$p6ky.ragtX6IxCZZVDsBLuK7EBAoRjuw.k/WwBP0MoYHEtz8r3Uea', 'Admin TravelShare', NULL, 'Quản trị viên hệ thống TravelShare', 'admin'),
  ('nguyenvana@gmail.com', '$2a$10$p6ky.ragtX6IxCZZVDsBLuK7EBAoRjuw.k/WwBP0MoYHEtz8r3Uea', 'Nguyễn Văn A', NULL, 'Travel blogger | Yêu biển và ẩm thực miền Trung', 'user'),
  ('tranthib@gmail.com', '$2a$10$p6ky.ragtX6IxCZZVDsBLuK7EBAoRjuw.k/WwBP0MoYHEtz8r3Uea', 'Trần Thị B', NULL, 'Photographer | Khám phá vùng cao Tây Bắc', 'user'),
  ('levanc@gmail.com', '$2a$10$p6ky.ragtX6IxCZZVDsBLuK7EBAoRjuw.k/WwBP0MoYHEtz8r3Uea', 'Lê Văn C', NULL, 'Backpacker | 30 tỉnh thành đã ghé qua', 'user');

-- Places
INSERT INTO places (name, slug, description, province, address, latitude, longitude, category_id, user_id, avg_rating, view_count) VALUES
  ('Bãi biển Mỹ Khê', 'bai-bien-my-khe', 'Bãi biển đẹp nhất hành tinh theo Forbes bình chọn. Cát trắng mịn, nước biển trong xanh, sóng vừa phải phù hợp tắm biển và lướt ván.', 'Đà Nẵng', 'Phường Phước Mỹ, Quận Sơn Trà, Đà Nẵng', 16.0544, 108.2472, 1, 2, 4.50, 1250),
  ('Đỉnh Fansipan', 'dinh-fansipan', 'Nóc nhà Đông Dương với độ cao 3.143m. Hành trình chinh phục đầy thách thức nhưng vô cùng xứng đáng với cảnh sắc thiên nhiên hùng vĩ.', 'Lào Cai', 'Thị xã Sa Pa, Lào Cai', 22.3033, 103.7750, 2, 3, 4.80, 2100),
  ('Phố cổ Hội An', 'pho-co-hoi-an', 'Di sản văn hóa thế giới UNESCO. Phố cổ lung linh ánh đèn lồng về đêm, ẩm thực phong phú và con người thân thiện.', 'Quảng Nam', 'Phường Minh An, TP Hội An, Quảng Nam', 15.8801, 108.3380, 4, 2, 4.70, 3200),
  ('Vịnh Hạ Long', 'vinh-ha-long', 'Kỳ quan thiên nhiên thế giới với hàng nghìn hòn đảo đá vôi. Trải nghiệm du thuyền, chèo kayak và khám phá hang động.', 'Quảng Ninh', 'TP Hạ Long, Quảng Ninh', 20.9101, 107.1839, 1, 4, 4.60, 4500),
  ('Bún bò Huế O Phượng', 'bun-bo-hue-o-phuong', 'Quán bún bò nổi tiếng nhất Huế. Nước dùng đậm đà, thịt bò mềm, giò heo béo ngậy. Phải thử khi đến Huế!', 'Thừa Thiên Huế', '17 Lý Thường Kiệt, TP Huế', 16.4637, 107.5909, 3, 2, 4.30, 890),
  ('Đà Lạt', 'da-lat', 'Thành phố ngàn hoa với khí hậu mát mẻ quanh năm. Đồi chè, thác nước, vườn hoa và kiến trúc Pháp cổ kính.', 'Lâm Đồng', 'TP Đà Lạt, Lâm Đồng', 11.9404, 108.4583, 5, 3, 4.50, 5600),
  ('Sapa', 'sapa', 'Ruộng bậc thang tuyệt đẹp, văn hóa đặc sắc của các dân tộc thiểu số và khí hậu se lạnh quanh năm.', 'Lào Cai', 'Thị xã Sa Pa, Lào Cai', 22.3364, 103.8438, 6, 3, 4.40, 3800),
  ('Động Phong Nha', 'dong-phong-nha', 'Hệ thống hang động kỳ vĩ nhất Việt Nam, di sản thiên nhiên thế giới UNESCO.', 'Quảng Bình', 'Bố Trạch, Quảng Bình', 17.5899, 106.2831, 7, 4, 4.70, 2900),
  ('Côn Đảo', 'con-dao', 'Hòn đảo hoang sơ với bãi biển nguyên sơ, rặng san hô đa dạng. Nơi lý tưởng cho nghỉ dưỡng và lặn biển.', 'Bà Rịa - Vũng Tàu', 'Huyện Côn Đảo', 8.6930, 106.6093, 8, 4, 4.60, 1800),
  ('Chùa Bái Đính', 'chua-bai-dinh', 'Quần thể chùa lớn nhất Đông Nam Á, kiến trúc Phật giáo hoành tráng giữa thiên nhiên.', 'Ninh Bình', 'Gia Viễn, Ninh Bình', 20.2706, 105.8478, 4, 2, 4.20, 1500);

-- Posts
INSERT INTO posts (title, content, user_id, place_id, rating, status, view_count) VALUES
  ('Review Bãi biển Mỹ Khê - Thiên đường biển Đà Nẵng', 'Mình vừa có chuyến du lịch 3 ngày ở Đà Nẵng và Mỹ Khê thực sự là highlight của chuyến đi! Bãi biển dài, cát trắng mịn, nước trong veo. Buổi sáng ra tắm biển sớm, buổi chiều ngồi cafe ven biển ngắm hoàng hôn. Ăn hải sản tươi ngon ngay bên bờ biển. Highly recommend cho ai muốn nghỉ dưỡng!', 2, 1, 5, 'published', 450),
  ('Chinh phục Fansipan - Nóc nhà Đông Dương', 'Hành trình 2 ngày 1 đêm chinh phục đỉnh Fansipan. Đường đi khá vất vả nhưng phong cảnh hai bên đường tuyệt đẹp. Rừng già, mây mù, và cảm giác đứng trên đỉnh nhìn xuống thật khó tả. Tips: chuẩn bị áo ấm, giày leo núi và đồ ăn nhẹ. Thuê guide địa phương để an toàn hơn.', 3, 2, 5, 'published', 780),
  ('Đêm Hội An - Lung linh ánh đèn lồng', 'Hội An về đêm đẹp mê hồn! Đèn lồng đủ màu sắc chiếu sáng khắp phố cổ. Mình thả hoa đăng trên sông Hoài, ăn cao lầu và bánh mì Phượng. Nhớ đi vào ngày 14 âm lịch để trải nghiệm đêm phố cổ không ánh điện, chỉ có đèn lồng và nến.', 2, 3, 5, 'published', 1200),
  ('Vịnh Hạ Long 2 ngày 1 đêm bằng du thuyền', 'Review chi tiết chuyến du thuyền 2 ngày 1 đêm trên Vịnh Hạ Long. Từ bến cảng ra vịnh khoảng 30 phút. Cảnh đẹp không thể tin được - hàng nghìn hòn đảo đá vôi nhấp nhô. Chiều đi kayak, tối party trên thuyền, sáng sớm tập tai chi trên boong. Giá tour khoảng 3-5 triệu/người.', 4, 4, 4, 'published', 2300),
  ('Bún bò Huế chuẩn vị - Review O Phượng', 'Đến Huế mà chưa ăn bún bò O Phượng thì coi như chưa đến! Nước dùng ninh xương hầm nhiều giờ, cay nồng sả ớt đặc trưng. Một tô 35k nhưng đầy ắp thịt bò, giò heo, chả cua. Quán đông lắm nên đi sớm nhé. Mở cửa từ 6h sáng.', 2, 5, 4, 'published', 560),
  ('Đà Lạt mùa hoa dã quỳ', 'Tháng 10-11 là mùa hoa dã quỳ nở rộ ở Đà Lạt. Những con đường vàng rực hoa dã quỳ, không khí se lạnh, sương mù buổi sáng. Mình check-in ở đồi chè Cầu Đất, thác Datanla và chợ đêm. Homestay mình ở view cực đẹp, giá chỉ 300k/đêm.', 3, 6, 5, 'published', 1800),
  ('Trekking Sapa - Trải nghiệm bản làng', 'Trekking 2 ngày qua các bản Cát Cát, Tả Van. Ruộng bậc thang mùa lúa chín vàng óng. Homestay ngay trong bản, ăn cơm với gia đình người HMông. Trải nghiệm văn hóa authentic không đâu bằng!', 3, 7, 4, 'published', 920),
  ('Khám phá Phong Nha - Kẻ Bàng', 'Hệ thống hang động Phong Nha - Kẻ Bàng thực sự là kỳ quan. Mình đã tham quan động Phong Nha và động Thiên Đường. Thạch nhũ hàng triệu năm, sông ngầm chảy trong lòng núi. Nên đặt tour Oxalis để khám phá sâu hơn.', 4, 8, 5, 'published', 670);

-- Comments
INSERT INTO comments (content, user_id, post_id, parent_id) VALUES
  ('Bãi biển đẹp quá! Mình cũng muốn đi Đà Nẵng', 3, 1, NULL),
  ('Bạn ở khách sạn nào vậy? Share info đi!', 4, 1, NULL),
  ('Mình ở Fusion Suites, view biển rất đẹp bạn ơi', 2, 1, 2),
  ('Fansipan đúng là phải đi một lần trong đời!', 2, 2, NULL),
  ('Hội An luôn đẹp, mình đã đi 3 lần rồi', 4, 3, NULL),
  ('Cao lầu Hội An ngon lắm, mình nhớ mãi', 3, 3, NULL),
  ('View du thuyền đẹp quá trời! Save lại đi sau này', 2, 4, NULL),
  ('Bún bò O Phượng đúng là huyền thoại!', 3, 5, NULL);

-- Likes
INSERT INTO likes (user_id, post_id) VALUES
  (2, 2), (2, 4), (2, 6), (2, 7),
  (3, 1), (3, 3), (3, 4), (3, 5), (3, 8),
  (4, 1), (4, 2), (4, 3), (4, 5), (4, 6);

-- View History
INSERT INTO view_history (user_id, post_id) VALUES
  (2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6),
  (3, 1), (3, 2), (3, 3), (3, 4), (3, 7), (3, 8),
  (4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 8);

-- Sample Trip
INSERT INTO trips (title, description, user_id, start_date, end_date, is_public) VALUES
  ('Du lịch miền Trung 5 ngày', 'Hành trình khám phá Đà Nẵng - Hội An - Huế', 2, '2026-06-01', '2026-06-05', TRUE);

INSERT INTO trip_days (trip_id, day_number, date, note) VALUES
  (1, 1, '2026-06-01', 'Đà Nẵng - Bãi biển Mỹ Khê'),
  (1, 2, '2026-06-02', 'Hội An - Phố cổ'),
  (1, 3, '2026-06-03', 'Huế - Ẩm thực');

INSERT INTO trip_places (trip_day_id, place_id, order_index, note) VALUES
  (1, 1, 1, 'Tắm biển buổi sáng'),
  (2, 3, 1, 'Tham quan phố cổ buổi chiều và tối'),
  (3, 5, 1, 'Ăn bún bò Huế');

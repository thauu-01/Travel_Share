# ⚙️ Hướng dẫn Setup VNPay Sandbox

## 1. Lấy TMN Code & Hash Secret từ VNPay Sandbox

1. Truy cập: https://sandbox.vnpayment.vn/merchantv2/
2. Đăng nhập tài khoản sandbox (đăng ký miễn phí)
3. Vào **Thông tin tài khoản** → copy:
   - `vnp_TmnCode` → đặt vào `VNPAY_TMN_CODE`
   - `Secret Key` → đặt vào `VNPAY_HASH_SECRET`

## 2. Expose Backend ra Internet bằng ngrok

VNPay cần gọi vào `vnpay-ipn` qua internet công khai. Dùng ngrok:

```powershell
# Cài ngrok (1 lần, dùng winget)
winget install ngrok

# Expose backend cổng 5000
ngrok http 5000
```

Output sẽ hiện URL dạng:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
```

## 3. Cập nhật .env

Mở `backend/.env` và điền:

```env
VNPAY_TMN_CODE=<TMN_CODE_từ_sandbox>
VNPAY_HASH_SECRET=<SECRET_KEY_từ_sandbox>
VNPAY_IPN_URL=https://abc123.ngrok-free.app/api/payment/vnpay-ipn
```

> ⚠️ **Lưu ý**: Mỗi lần ngrok khởi động lại (free tier) URL sẽ đổi — phải cập nhật `VNPAY_IPN_URL` và rebuild backend.

## 4. Rebuild Docker

```powershell
docker compose up --build -d
```

## 5. Test với thẻ NCB Sandbox

| Trường | Giá trị |
|--------|---------|
| Ngân hàng | NCB |
| Số thẻ | `9704198526191432198` |
| Tên chủ thẻ | `NGUYEN VAN A` |
| Ngày phát hành | `07/15` |
| OTP | `123456` |

## 6. Luồng Test Đầy đủ

1. Đăng nhập → Vào `/trips` → Nhấn **✨ AI Tạo Lịch Trình VIP**
2. Modal hiện số lượt còn lại (mặc định 1 lượt miễn phí)
3. Nếu hết lượt → Nhấn **💳 Mở khóa 5 lượt VIP — 50.000 VNĐ**
4. Redirect sang VNPay sandbox → Điền thông tin thẻ NCB
5. Sau khi thanh toán → Quay về `/payment/return` → Polling tự động
6. Kết quả: Cộng 5 credits → Tạo lịch trình AI

## 7. Kiểm tra Admin Panel

Vào `/admin/transactions` → Xem lịch sử toàn bộ giao dịch với:
- Badge trạng thái màu (✅ Thành công / ❌ Thất bại / ⏱️ Hết hạn)
- Thống kê tổng doanh thu & lượt AI đã bán

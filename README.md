# Thiệp cưới frontend + backend

Chạy bằng Node.js 20 trở lên, không cần cài thư viện:

```sh
npm start
```

Mở http://localhost:3000. Frontend nằm trong `frontend/`; backend Node.js trong `backend/server.js` phục vụ trang và API. Không mở trực tiếp HTML bằng file:// vì phiên bản này cần backend.

Sửa ngày cưới, địa chỉ và ngân hàng trong `backend/config.json`. Ngày mẫu 29/12/2025 đã qua, vì vậy countdown hiện 0. Điền bankCode, bankName, accountNo và accountName hoặc qrImage là đường dẫn ảnh QR của bạn. QR tự tạo qua VietQR cần internet.

RSVP được lưu tại `backend/data/rsvps.json`, gồm tên, tình trạng tham dự, số người và lời chúc. API `/api/wishes` chỉ công khai tên và lời chúc; danh sách RSVP đầy đủ không được phục vụ qua HTTP. Sao lưu thư mục data khi chuyển máy. Backend hiện dành cho chạy local; muốn nhận khách trên internet cần triển khai máy chủ.

## Đối chiếu file ZenLove

Nguồn: file HTML ZenLove trong thư mục dự án gốc.

| Điểm | Mẫu ZenLove | Bản mới |
|---|---|---|
| Khung thiệp | 451 px | Tối đa 451 px, thu nhỏ theo màn hình |
| Nền kem | rgb(249,245,240) | #f9f5f0 |
| Đỏ chủ đạo | rgb(165,0,16) | #a50010 |
| Font tên | VlFlashBack | Georgia, chưa khớp font mẫu |
| Ảnh | Các ảnh trong template | 8 ảnh đã lưu local |
| Bố cục | Canvas có vị trí cố định | Các section responsive, chưa giống từng chi tiết |
| Countdown/Maps/QR | Không có trong nội dung kiểm tra | Đã bổ sung |
| RSVP | Phụ thuộc runtime ZenLove | Backend riêng lưu file JSON |

Đây là bản viết lại theo màu sắc và nội dung mẫu, chưa phải bản sao giao diện chính xác. So sánh trên đây dựa vào mã HTML; chưa xác minh trực quan hai trang do quyền công cụ trình duyệt chặn truy cập local.

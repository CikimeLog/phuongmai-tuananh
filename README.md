# Thiệp cưới Tuấn Anh & Phương Mai

Web công khai: https://cikimelog.github.io/weding/

GitHub Pages phục vụ thư mục `frontend`. Workflow `.github/workflows/pages.yml` tự xuất bản khi đẩy thay đổi lên nhánh `main`.

Khách gửi xác nhận trực tiếp tới Google Apps Script. Script ghi vào tab RSVP trong Google Sheet và gửi thông báo tới nhóm Telegram. Trigger `retryTelegramRsvps` chạy mỗi phút để gửi lại thông báo còn chờ. Không cần bật máy cá nhân.

Cấu hình bản công khai nằm trong `frontend/config.json`. Cấu hình bản chạy local nằm trong `backend/config.json`. Sau khi sửa thông tin thiệp, cập nhật cả hai nếu vẫn sử dụng bản local.

Mã Apps Script nằm trong `integrations/google-sheets.gs`. Khi sửa mã, cập nhật dự án Apps Script và triển khai phiên bản mới của deployment hiện có để giữ nguyên URL. Script properties cần `SPREADSHEET_ID`, `RSVP_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Các token và secret chỉ đặt trong Script properties hoặc file local bị Git bỏ qua; không đưa vào frontend.

Chạy local với Node.js 20 trở lên:

```sh
node backend/server.js
```

Mở http://localhost:3000. Bản local lưu dữ liệu dự phòng trong `backend/data/` và dùng API Node.js. Bản GitHub Pages dùng Apps Script trực tiếp.

Kiểm tra:

```sh
node --test backend/sheets-sync.test.js integrations/google-sheets.test.js
```

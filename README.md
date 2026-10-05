# Thiệp cưới Tuấn Anh & Phương Mai

- Chú rể: https://cikimelog.github.io/tuananh-phuongmai/
- Cô dâu: https://cikimelog.github.io/phuongmai-tuananh/

## Sửa cấu hình

Sửa `frontend/configs/groom.json` cho chú rể hoặc `frontend/configs/bride.json` cho cô dâu. Các trường không ghi đè dùng thông tin chung từ `frontend/config.json`. Commit vào `main` để GitHub Actions cập nhật web của repo đó.

- Ngày giờ: `weddingDateTime`, định dạng `DD/MM/YYYY hh:mm:ss AM/PM`.
- Ngày âm: cập nhật cả `lunarDate.solarDate` (`DD.MM.YYYY`) và `lunarDate.text` khi đổi ngày cưới.
- Địa điểm: `venueName`, `venueHall`, `venue`, `mapsUrl`; `venueNameFontSize` chỉnh cỡ chữ tên địa điểm.
- Mừng cưới: `bank.accountNo`, `bank.qrImage`; tải ảnh QR vào `frontend/assets`.
- Giữ `invitationSide` là `groom` hoặc `bride` để chọn đúng tab RSVP và nhãn Telegram.

## Kết nối và chạy local

Mã Apps Script: `integrations/google-sheets.gs`. Khi sửa, cập nhật deployment hiện có bằng phiên bản mới để giữ endpoint. Script properties: `SPREADSHEET_ID`, `RSVP_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`. Tab mặc định: `RSVP_ChuRe` và `RSVP_CoDau`. Chạy `setupTelegramRetry` một lần để tạo trigger gửi lại.

Token/secret chỉ đặt trong Script properties hoặc file `*.local.json` bị Git bỏ qua.

Local: `node backend/server.js`, mở http://localhost:3000; cấu hình trong `backend/config.json`. Kiểm tra: `npm test`.

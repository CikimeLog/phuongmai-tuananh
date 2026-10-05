# Thiệp cưới Tuấn Anh & Phương Mai

Hai repo dùng chung mã nguồn, khác cấu hình:

- Chú rể: https://cikimelog.github.io/tuananh-phuongmai/
- Cô dâu: https://cikimelog.github.io/phuongmai-tuananh/

## Cấu hình thiệp

Thông tin chung nằm trong `frontend/config.json`. Phần riêng nằm trong `frontend/configs/groom.json` và `frontend/configs/bride.json`; có thể ghi đè bất kỳ thông tin nào, kể cả `bank`, địa điểm, ngày giờ và `rsvpEndpoint`. Các object được gộp theo từng trường.

Workflow tự chọn phía theo tên repo `tuananh-phuongmai` hoặc `phuongmai-tuananh`, rồi tạo config và metadata chia sẻ tương ứng. Nếu tên repo khác, đặt GitHub Actions repository variable `INVITATION_SIDE` thành `groom` hoặc `bride`. Repo cũ `weding` mặc định là chú rể.

Đưa cùng mã nguồn vào hai repo và bật Settings > Pages > Source: GitHub Actions trên từng repo. Mỗi repo xuất bản thư mục `frontend` khi push lên `main`. Một project Pages chỉ phục vụ URL của chính repo đó; để có đúng hai URL trên cần hai repo.

Thông tin tài khoản/QR hiện có vẫn được giữ từ config chung. Điền `bank.accountNo` và `bank.qrImage` riêng trong từng config nếu hai phía nhận mừng cưới vào tài khoản khác nhau.

## Google Sheets và Telegram

Khách gửi xác nhận trực tiếp tới Apps Script, kèm `invitationSide`. Script chọn nơi ghi phía máy chủ; frontend không chứa ID sheet hoặc token Telegram.

Cập nhật mã `integrations/google-sheets.gs` vào dự án Apps Script hiện có, sau đó Manage deployments > Edit > New version > Deploy để giữ nguyên URL endpoint.

Script properties:

- `SPREADSHEET_ID_GROOM`: ID file Google Sheets của chú rể.
- `SPREADSHEET_ID_BRIDE`: ID file Google Sheets của cô dâu.
- Hoặc chỉ đặt `SPREADSHEET_ID` để dùng chung một file với hai tab riêng.
- `RSVP_TAB_GROOM`: mặc định `RSVP_ChuRe`.
- `RSVP_TAB_BRIDE`: mặc định `RSVP_CoDau`.
- `RSVP_SECRET`: xác thực bản local.
- `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`: bot và nhóm nhận thông báo.

Script tự tạo tab còn thiếu với đúng tiêu đề. Không chuyển dữ liệu cũ ở tab `RSVP`; xác nhận mới vào các tab đã chọn. Nếu muốn tiếp tục dùng tab cũ cho chú rể, đặt `RSVP_TAB_GROOM=RSVP`.

Telegram thêm dòng `Phía: Chú rể` hoặc `Phía: Cô dâu`. Trigger `retryTelegramRsvps` giữ nguyên phía khi gửi lại. Chạy `setupTelegramRetry` một lần nếu chưa có trigger. Bản gửi cũ chưa có phía được coi là chú rể.

## Chạy local

Node.js 20 trở lên:

```sh
node backend/server.js
```

Mở http://localhost:3000. Cấu hình local nằm trong `backend/config.json`; đặt `invitationSide` thành `groom` hoặc `bride`. Local lưu dữ liệu dự phòng trong `backend/data/` và gửi phía vào Google Sheets/Telegram.

Kiểm tra:

```sh
npm test
npm run check
```

Token và secret chỉ đặt trong Script properties hoặc file local bị Git bỏ qua.

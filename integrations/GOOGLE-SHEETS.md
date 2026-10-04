# Kết nối RSVP với Google Sheets

Sheet đã tạo: https://docs.google.com/spreadsheets/d/17oXyjTFCsDjRj3PgIwJVwcl8qZ5E4ugX7Ka6gR-gZb4/edit

Backend đã có hàng đợi đồng bộ, nhưng chưa có URL Apps Script nên hiện chỉ lưu trên máy. Kết nối dưới đây không cần cài thư viện hay cấp tài khoản Google cho khách.

## Kích hoạt một lần

1. Mở Sheet bằng tài khoản sở hữu, chọn **Extensions → Apps Script**.
2. Thay nội dung `Code.gs` bằng toàn bộ mã trong `integrations/google-sheets.gs`, rồi lưu.
3. Mở **Project Settings → Script properties**, thêm:
   - `SPREADSHEET_ID`: `17oXyjTFCsDjRj3PgIwJVwcl8qZ5E4ugX7Ka6gR-gZb4`
   - `RSVP_SECRET`: sao chép giá trị `secret` trong `backend/google-sheets.local.json`. Giữ giá trị này riêng tư.
4. Chọn **Deploy → New deployment → Web app**. Đặt **Execute as: Me**, **Who has access: Anyone**, cấp quyền ghi Sheet cho script, rồi Deploy. Sheet vẫn giữ quyền riêng tư; endpoint chỉ nhận dữ liệu khi secret đúng và không có API đọc danh sách khách.
5. Sao chép URL kết thúc bằng `/exec`, điền vào `webhookUrl` trong `backend/google-sheets.local.json`. Bạn cũng có thể gửi URL này cho Codex để nối và kiểm tra. Không gửi secret vào chat.

Không cần khởi động lại backend khi thay file cấu hình kết nối. Mỗi 30 giây backend đọc lại cấu hình và thử các bản ghi đang chờ. Lần triển khai đầu cần backend phiên bản mới chạy bằng `npm start`.

## Dữ liệu và kiểm tra

- Tab `RSVP` và sáu tiêu đề hàng đầu phải được giữ nguyên.
- Khi kết nối hoạt động, gửi một xác nhận trên thiệp và kiểm tra dòng tương ứng xuất hiện trong Sheet. Có = số người từ 1–10. Không = 0 người.
- Thời gian hiển thị theo giờ Việt Nam. Mã xác nhận giúp script tránh ghi trùng khi backend thử lại sau lỗi mạng.
- Xác nhận luôn được lưu trước trong `backend/data/rsvps.json`. Google lỗi thì dữ liệu chờ đồng bộ; khách vẫn nhận thông báo đã gửi.
- Sau khi bật kết nối, các xác nhận trước đó chưa có `sheetSyncedAt` cũng được đồng bộ.
- Chỉ một tiến trình backend được ghi vào file RSVP này. Khi chuyển máy, sao lưu cả dữ liệu và cấu hình riêng.
- Frontend không nhận URL kết nối hoặc secret. Không đưa chúng vào `backend/config.json` vì file đó được phục vụ công khai.
- Có thể thay cấu hình riêng bằng biến môi trường `GOOGLE_SHEETS_WEBHOOK_URL` và `GOOGLE_SHEETS_SECRET` khi triển khai server.

Kiểm thử: `node --test backend/sheets-sync.test.js integrations/google-sheets.test.js`.

Tài liệu triển khai chính thức: https://developers.google.com/apps-script/guides/web

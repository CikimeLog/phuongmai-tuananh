# Thông báo xác nhận qua Telegram

1. Tạo bot bằng @BotFather trên Telegram với lệnh /newbot, lấy bot token.
2. Nhắn /start cho bot từ tài khoản nhận thông báo. Nếu nhận ở nhóm, thêm bot vào nhóm và lấy chat ID của nhóm.
3. Điền `botToken` và `chatId` vào `backend/telegram.local.json`. Không điền vào config.json công khai. Có thể dùng biến môi trường TELEGRAM_BOT_TOKEN và TELEGRAM_CHAT_ID khi triển khai server.
4. Nhắn Codex khi đã điền token để kiểm tra kết nối và giúp lấy chat ID nếu cần.

Mỗi RSVP mới gửi thông báo gồm tên, Có/Không, số người, thời gian Việt Nam và mã xác nhận. Không gửi lại các RSVP cũ trước khi tính năng này được thêm. RSVP mới trong lúc chưa cấu hình sẽ chờ và gửi khi bật kết nối.

Lỗi mạng không ngăn khách gửi RSVP hoặc đồng bộ Google Sheets. Backend thử lại mỗi 30 giây; tôn trọng thời gian chờ của Telegram khi bị giới hạn gửi. Trường hợp Telegram nhận tin nhưng phản hồi bị mất có thể xuất hiện tin trùng khi thử lại; mã xác nhận trong tin giúp đối chiếu.

Cấu hình được đọc lại tự động. Phải giữ backend chạy để nhận RSVP và gửi thông báo.

API chính thức: https://core.telegram.org/bots/api#sendmessage

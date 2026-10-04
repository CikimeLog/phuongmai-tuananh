# Thông tin riêng của thiệp

Đã kiểm tra cấu hình hiện tại: ngày cưới 25/10/2026 lúc 11:00, giờ Việt Nam. Sáu trường ngân hàng đã điền mẫu: `bankCode`, `bankName`, `accountNo`, `accountName`, `transferNote`, `qrImage`. `SO_TAI_KHOAN_MAU` không phải số tài khoản; ảnh `bank-qr-sample.svg` chỉ là nhãn minh họa, không phải QR chuyển khoản. Thay các giá trị này bằng thông tin thật khi sử dụng.

Chỉ sửa `backend/config.json`, lưu file rồi tải lại trang. Không cần khởi động lại backend. File JSON phải dùng dấu ngoặc kép và không chứa comment.

| Trường | Nội dung |
|---|---|
| bride.name | Tên cô dâu, cập nhật tất cả vị trí tên trên thiệp |
| groom.name | Tên chú rể, cập nhật tất cả vị trí tên trên thiệp |
| weddingDateTime | Ngày giờ cưới, ví dụ `25/10/2026 11:00:00 AM`. Dùng DD/MM/YYYY hh:mm:ss AM hoặc PM; định dạng này được hiểu là giờ Việt Nam (UTC+07:00). ISO có múi giờ vẫn được hỗ trợ |
| lunarDate.solarDate | Ngày dương tương ứng, định dạng `DD.MM.YYYY`, hiện là `25.10.2026` |
| lunarDate.text | Dòng âm lịch đã đối chiếu: `Tức ngày 16 tháng 9 năm Bính Ngọ`. Khi đổi ngày cưới, cập nhật cả hai trường lunarDate; nếu ngày không khớp, dòng âm lịch sẽ ẩn để không hiển thị dữ liệu cũ. Chưa tự chuyển đổi âm lịch. |
| timeZone | Múi giờ hiển thị, mặc định `Asia/Ho_Chi_Minh` |
| venueName | Tên nhà hàng hoặc địa điểm |
| venue | Địa chỉ đầy đủ, cũng dùng cho nút chỉ đường |
| mapsUrl | Link Google Maps riêng; bỏ trống sẽ tạo link từ venue |
| story | Câu chuyện của hai bạn |
| music | Đường dẫn nhạc nền |
| photos.photo01 … photos.photo08 | File ảnh do backend phục vụ từ `frontend/assets`. Thay file đúng tên hoặc sửa đường dẫn tại đây rồi tải lại trang. Một ảnh có thể xuất hiện nhiều lần trong các khung của mẫu. |
| bank | Thông tin tài khoản/QR, đã dành cấu hình; giao diện hiện giữ nguyên mẫu ZenLove, chưa nối khu mừng cưới |
| bride.father, bride.mother, groom.father, groom.mother | Dành cho thông tin gia đình; mẫu hiện tại chưa có vị trí hiển thị các trường này |

Các thông tin cá nhân ban đầu đều để trống để không dùng tên, địa chỉ hay ngày cưới của mẫu ZenLove. Trường trống hiển thị nhãn chờ nhập. Countdown không chạy khi chưa có ngày hợp lệ; nút chỉ đường ẩn khi chưa có địa chỉ hoặc link.

Các khung ảnh cưới đã nối với file local và danh sách `photos`. Ảnh 01, 02 và 06 hiện dùng file JPG bạn đã thay. Các họa tiết trang trí SVG còn lấy từ mẫu ZenLove. Nhạc dùng file local `frontend/assets/background.mp3`.

Ảnh đã tối ưu trực tiếp trong `frontend/assets`, không dùng thư mục `optimized`. JPEG lớn được thu nhỏ tối đa 1080 × 1620 px và nén progressive; ảnh nhỏ sẵn được giữ để tránh nén lại. Khi thêm ảnh mới, chạy `python optimize-images.py` (cần Pillow); script ghi đè ảnh lớn tại chỗ, rồi tải lại trang.

# Kết nối form đăng ký với Excel (qua Google Sheets)

1. Vào https://sheets.new, tạo bảng tính mới (ví dụ "Khách đăng ký FPT").
2. Menu **Tiện ích mở rộng → Apps Script**, xoá code cũ, dán nội dung `Code.gs`, bấm Lưu.
3. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**
   - Thực thi dưới tên: **Tôi**
   - Ai có quyền truy cập: **Bất kỳ ai**
   - Bấm Triển khai, cấp quyền, rồi copy **URL ứng dụng web**.
4. Mở `index.html`, dán URL vào `var SHEET_URL='';`, commit và push.
5. Mở file bằng Excel: Google Sheets → **Tệp → Tải xuống → Microsoft Excel (.xlsx)**.

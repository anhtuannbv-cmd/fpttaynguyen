/**
 * NHẬN FORM ĐĂNG KÝ TỪ fpttaynguyen.com
 * → Ghi vào Google Sheet  +  Báo ngay về Telegram
 *
 * CÀI ĐẶT (làm 1 lần):
 * 1. Mở Google Sheet mới → Tiện ích mở rộng → Apps Script → xoá hết code cũ, dán toàn bộ file này vào → Lưu.
 * 2. Biểu tượng bánh răng (Cài đặt dự án) → Thuộc tính tập lệnh → Thêm:
 *      TELEGRAM_TOKEN   = token bot lấy từ @BotFather
 * 3. Mở Telegram, nhắn "hi" cho con bot đó.
 * 4. Quay lại Apps Script, chọn hàm  layChatId  → bấm Chạy (lần đầu Google sẽ hỏi cấp quyền → Cho phép).
 *    Hàm này tự lưu TELEGRAM_CHAT_ID. Sau đó chọn hàm  thuNghiem  → Chạy: Sheet có 1 dòng mẫu, Telegram nhận 1 tin.
 * 5. Triển khai → Tuỳ chọn triển khai mới → Loại: Ứng dụng web
 *      Thực thi với tư cách: Tôi      |      Người có quyền truy cập: Bất kỳ ai
 *    → Triển khai → copy đường link "Ứng dụng web" (đuôi /exec) gửi cho Claude để gắn vào trang.
 *
 * Token Telegram chỉ nằm trong Apps Script, KHÔNG nằm trên trang web, nên người ngoài không lấy được.
 */

const TEN_TRANG_TINH = 'Khách đăng ký';
const TIEU_DE = ['Thời gian', 'Họ tên', 'Số điện thoại', 'Địa chỉ lắp đặt', 'Gói quan tâm', 'Ghi chú', 'Trang gửi', 'Trạng thái'];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // Bẫy chống spam: ô "website" bị ẩn, người thật không điền.
  if (p.website) return traVe_({ ok: true });

  const khach = {
    ten: sach_(p.name, 80),
    sdt: String(p.phone || '').replace(/[^0-9+]/g, '').slice(0, 15),
    diaChi: sach_(p.address, 200),
    goi: sach_(p.plan, 80),
    ghiChu: sach_(p.note, 500),
    trang: sach_(p.page, 200),
  };
  if (!khach.ten || !/^\+?[0-9]{9,14}$/.test(khach.sdt)) {
    return traVe_({ ok: false, error: 'invalid' });
  }

  ghiVaoSheet_(khach);
  try { baoTelegram_(khach); } catch (err) { console.error('Telegram lỗi: ' + err); }
  return traVe_({ ok: true });
}

// Mở link /exec trên trình duyệt sẽ thấy dòng này = web app đang chạy.
function doGet() {
  return ContentService.createTextOutput('Form fpttaynguyen.com đang hoạt động.');
}

function ghiVaoSheet_(k) {
  const khoa = LockService.getScriptLock();
  khoa.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(TEN_TRANG_TINH);
    if (!sh) sh = ss.insertSheet(TEN_TRANG_TINH, 0);
    if (sh.getLastRow() === 0) {
      sh.appendRow(TIEU_DE);
      sh.getRange(1, 1, 1, TIEU_DE.length).setFontWeight('bold').setBackground('#0a3d91').setFontColor('#ffffff');
      sh.setFrozenRows(1);
      sh.getRange('C:C').setNumberFormat('@'); // giữ số 0 đầu số điện thoại
    }
    const gio = Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm');
    sh.appendRow([gio, k.ten, k.sdt, k.diaChi, k.goi, k.ghiChu, k.trang, 'Mới']);
  } finally {
    khoa.releaseLock();
  }
}

function baoTelegram_(k) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TELEGRAM_TOKEN');
  const chatId = props.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return;

  const dong = [
    '🔔 <b>KHÁCH ĐĂNG KÝ MỚI – fpttaynguyen.com</b>',
    '👤 ' + html_(k.ten),
    '📞 ' + html_(k.sdt),
    k.diaChi ? '📍 ' + html_(k.diaChi) : '',
    k.goi ? '📦 ' + html_(k.goi) : '',
    k.ghiChu ? '📝 ' + html_(k.ghiChu) : '',
    '🕒 ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HH:mm dd/MM/yyyy'),
  ].filter(String);

  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: dong.join('\n'), parse_mode: 'HTML' }),
    muteHttpExceptions: true,
  });
}

/** Chạy 1 lần sau khi đã nhắn "hi" cho bot: tự tìm và lưu TELEGRAM_CHAT_ID. */
function layChatId() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TELEGRAM_TOKEN');
  if (!token) throw new Error('Chưa có TELEGRAM_TOKEN trong Thuộc tính tập lệnh.');
  const res = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates').getContentText());
  const tin = (res.result || []).filter(function (u) { return u.message && u.message.chat; }).pop();
  if (!tin) throw new Error('Chưa thấy tin nhắn nào. Mở Telegram, nhắn "hi" cho bot rồi chạy lại.');
  props.setProperty('TELEGRAM_CHAT_ID', String(tin.message.chat.id));
  console.log('Đã lưu TELEGRAM_CHAT_ID = ' + tin.message.chat.id + ' (' + (tin.message.chat.first_name || tin.message.chat.title || '') + ')');
}

/** Chạy thử: thêm 1 dòng mẫu vào Sheet và gửi 1 tin Telegram. */
function thuNghiem() {
  const mau = { ten: 'Khách thử nghiệm', sdt: '0900000000', diaChi: 'Pleiku, Gia Lai', goi: 'SKY', ghiChu: 'Dòng thử – xoá được', trang: 'thu-nghiem' };
  ghiVaoSheet_(mau);
  baoTelegram_(mau);
  console.log('Xong. Kiểm tra Sheet và Telegram.');
}

function sach_(v, max) {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // chặn chèn công thức vào Sheet
  return s;
}

function html_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function traVe_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

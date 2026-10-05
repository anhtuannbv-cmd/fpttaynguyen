// Google Apps Script: nhận dữ liệu từ form đăng ký và ghi vào Google Sheet.
var HEADERS = ['Thời gian', 'Họ tên', 'Số điện thoại', 'Địa chỉ', 'Gói cước'];

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
  var p = e.parameter;
  // Thêm dấu ' để giữ số 0 đầu của số điện thoại
  sheet.appendRow([new Date(), p.name, "'" + p.phone, p.address, p.plan]);
  return ContentService.createTextOutput('ok');
}

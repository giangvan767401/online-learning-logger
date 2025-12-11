const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;
const LOG_FILE = 'logs/learning_log.xlsx';  // giữ nguyên đường dẫn cũ

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

if (!fs.existsSync('logs')) fs.mkdirSync('logs');

app.use((req, res, next) => {
  if (req.query.wake) return res.send('Server đã wake!');
  next();
});

// === DÁN HÀM appendLog MỚI VÀO ĐÂY (thay toàn bộ hàm cũ) ===
async function appendLog(data) {
  const workbook = new ExcelJS.Workbook();

  if (fs.existsSync(LOG_FILE)) {
    try {
      await workbook.xlsx.readFile(LOG_FILE);
      console.log('Đọc file log thành công');
    } catch (err) {
      console.warn('Không đọc được file log (có thể đang bị khóa hoặc lỗi), sẽ tạo/sửa lại:', err.message);
    }
  }

  const worksheet = workbook.getWorksheet('Logs') || workbook.addWorksheet('Logs');

  if (worksheet.rowCount === 0 || worksheet.columns.length === 0) {
    worksheet.columns = [
      { header: 'Thời gian đăng nhập', key: 'timestamp', width: 22 },
      { header: 'Mã SV', key: 'student_id', width: 12 },
      { header: 'Họ tên', key: 'full_name', width: 20 },
      { header: 'Số lần đăng nhập', key: 'login_count', width: 12 },
      { header: 'Môn học', key: 'course_id', width: 12 },
      { header: 'Thời gian học (giây)', key: 'duration_seconds', width: 15 },
      { header: '% Xem video', key: 'video_percentage', width: 12 },
      { header: 'Tổng điểm Quiz', key: 'total_quiz_score', width: 12 },
      { header: 'Hoàn thành', key: 'completed', width: 12 },
      { header: 'Ghi chú', key: 'note', width: 30 },
    ];
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1f4e79' } };
  }

  worksheet.addRow({
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    student_id: data.student_id || 'N/A',
    full_name: data.full_name || 'N/A',
    login_count: data.login_count || 1,
    course_id: data.course_id || 'MATH101',
    duration_seconds: data.duration_seconds || 0,
    video_percentage: data.video_percentage || 0,
    total_quiz_score: data.total_quiz_score || 0,
    completed: data.completed || 'Không',
    note: data.note || ''
  });

  try {
    await workbook.xlsx.writeFile(LOG_FILE);
    console.log('Ghi log thành công:', data.student_id, data.note || 'Đăng nhập');
  } catch (err) {
    console.error('LỖI KHI GHI FILE LOG:', err);
  }
}
// ==========================================

app.post('/api/log', async (req, res) => {
  try {
    await appendLog(req.body);
    res.json({ status: 'success' });
  } catch (err) {
    console.error('Lỗi ghi log:', err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/download', (req, res) => res.sendFile(path.join(__dirname, 'public', 'download.html')));
app.use('/logs', express.static('logs'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server chạy tại port ${PORT}`);
  
  // Tạo file mẫu nếu chưa có
  if (!fs.existsSync(LOG_FILE)) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Logs');
    ws.columns = [
      { header: 'Thời gian đăng nhập', key: 'timestamp', width: 22 },
      { header: 'Mã SV', key: 'student_id', width: 12 },
      { header: 'Họ tên', key: 'full_name', width: 20 },
      { header: 'Số lần đăng nhập', key: 'login_count', width: 12 },
      { header: 'Môn học', key: 'course_id', width: 12 },
      { header: 'Thời gian học (giây)', key: 'duration_seconds', width: 15 },
      { header: '% Xem video', key: 'video_percentage', width: 12 },
      { header: 'Tổng điểm Quiz', key: 'total_quiz_score', width: 12 },
      { header: 'Hoàn thành', key: 'completed', width: 12 },
      { header: 'Ghi chú', key: 'note', width: 30 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1f4e79' } };
    ws.addRow({ timestamp: new Date().toISOString().replace('T', ' ').substring(0,19), student_id: 'TEST', full_name: 'File mẫu', note: 'Hệ thống sẵn sàng!' });
    wb.xlsx.writeFile(LOG_FILE);
    console.log('Đã tạo file log mẫu');
  }
});
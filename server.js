const express = require('express');
const ExcelJS = require('exceljs');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Tạo thư mục logs
if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

// Hàm lấy workbook AN TOÀN (không crash khi file bị corrupt)
async function getWorkbookSafe(dateStr) {
  const filename = `logs/learning_log_${dateStr}.xlsx`;
  const workbook = new ExcelJS.Workbook();

  // Nếu file chưa tồn tại → tạo mới luôn
  if (!fs.existsSync(filename)) {
    const worksheet = workbook.addWorksheet('Learning Logs');
    worksheet.columns = [
      { header: 'Thời gian', key: 'timestamp', width: 22 },
      { header: 'Mã SV', key: 'student_id', width: 12 },
      { header: 'Họ tên', key: 'full_name', width: 22 },
      { header: 'Môn học', key: 'course_id', width: 15 },
      { header: 'Hành động', key: 'action', width: 20 },
      { header: 'Video ID', key: 'video_id', width: 15 },
      { header: 'Thời lượng (giây)', key: 'duration', width: 12 },
      { header: 'Tỷ lệ xem (%)', key: 'percentage', width: 10 },
      { header: 'Quiz ID', key: 'quiz_id', width: 12 },
      { header: 'Điểm Quiz', key: 'quiz_score', width: 10 },
      { header: 'Trang', key: 'page_url', width: 40 },
      { header: 'IP', key: 'ip', width: 15 },
      { header: 'Trình duyệt', key: 'user_agent', width: 50 },
    ];
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1f4e79' } };
    return { workbook, worksheet };
  }

  // Nếu file tồn tại → thử đọc, nếu lỗi → đổi tên file hỏng + tạo mới
  try {
    await workbook.xlsx.readFile(filename);
    return { workbook, worksheet: workbook.getWorksheet('Learning Logs') || workbook.addWorksheet('Learning Logs') };
  } catch (err) {
    console.warn(`File Excel bị lỗi → đổi tên và tạo file mới: ${filename}`);
    // Đổi tên file hỏng để không bị đọc lại
    const backupName = `${filename.replace('.xlsx', '')}_corrupted_${Date.now()}.xlsx`;
    fs.renameSync(filename, backupName);
    // Tạo file mới
    const worksheet = workbook.addWorksheet('Learning Logs');
    worksheet.columns = [
      { header: 'Thời gian', key: 'timestamp', width: 22 },
      { header: 'Mã SV', key: 'student_id', width: 12 },
      { header: 'Họ tên', key: 'full_name', width: 22 },
      { header: 'Môn học', key: 'course_id', width: 15 },
      { header: 'Hành động', key: 'action', width: 20 },
      { header: 'Video ID', key: 'video_id', width: 15 },
      { header: 'Thời lượng (giây)', key: 'duration', width: 12 },
      { header: 'Tỷ lệ xem (%)', key: 'percentage', width: 10 },
      { header: 'Quiz ID', key: 'quiz_id', width: 12 },
      { header: 'Điểm Quiz', key: 'quiz_score', width: 10 },
      { header: 'Trang', key: 'page_url', width: 40 },
      { header: 'IP', key: 'ip', width: 15 },
      { header: 'Trình duyệt', key: 'user_agent', width: 50 },
    ];
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1f4e79' } };
    return { workbook, worksheet };
  }
}

// API ghi log
app.post('/api/log', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { workbook, worksheet } = await getWorkbookSafe(today);

    const logEntry = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      student_id: req.body.student_id || 'N/A',
      full_name: req.body.full_name || 'N/A',
      course_id: req.body.course_id || 'N/A',
      action: req.body.action || '',
      video_id: req.body.video_id || '',
      duration: req.body.duration || 0,
      percentage: req.body.percentage || 0,
      quiz_id: req.body.quiz_id || '',
      quiz_score: req.body.quiz_score || '',
      page_url: req.body.page_url || req.headers.referer || '',
      ip: req.ip?.replace('::ffff:', '') || '',
      user_agent: req.headers['user-agent'] || '',
    };

    worksheet.addRow(logEntry);
    await workbook.xlsx.writeFile(`logs/learning_log_${today}.xlsx`);

    res.json({ status: 'success' });
  } catch (err) {
    console.error('Lỗi không mong muốn khi ghi log:', err);
    res.status(500).json({ error: 'Lưu thất bại' });
  }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')));
app.get('/download', (req, res) => res.sendFile(path.join(__dirname, 'public', 'download.html')));
app.use('/logs', express.static('logs'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server chạy ổn định tại port ${PORT}`);
  console.log(`Tải log hôm nay: /download`);
});
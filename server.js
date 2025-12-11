const express = require('express');
const ExcelJS = require('exceljs');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const app = express();

// QUAN TRỌNG: Render yêu cầu listen ở process.env.PORT và bind 0.0.0.0
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Tạo thư mục logs
if (!fs.existsSync('./logs')) fs.mkdirSync('./logs');

// Hàm lấy workbook theo ngày (giữ nguyên của bạn)
async function getWorkbook(dateStr) {
  const filename = `logs/learning_log_${dateStr}.xlsx`;
  let workbook = new ExcelJS.Workbook();

  if (fs.existsSync(filename)) {
    await workbook.xlsx.readFile(filename);
  } else {
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
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1f4e79' }
    };
  }
  return { workbook, worksheet: workbook.worksheets[0] };
}

// API ghi log
app.post('/api/log', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { workbook, worksheet } = await getWorkbook(today);

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
    console.error('Lỗi lưu log:', err);
    res.status(500).json({ error: 'Lưu thất bại' });
  }
});

// Trang chủ + tải file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/download', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

app.use('/logs', express.static('logs')); // cho phép tải file Excel

// CHỈ DÙNG 1 DÒNG LISTEN DUY NHẤT NÀY
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server đang chạy thành công tại port: ${PORT}`);
  console.log(`Link web: https://your-app.onrender.com`);
  console.log(`File log hôm nay: /logs/learning_log_${new Date().toISOString().slice(0,10)}.xlsx`);
});
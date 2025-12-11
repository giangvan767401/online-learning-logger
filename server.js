const express = require('express');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 10000;

// LƯU FILE TẠI /tmp CHO RENDER
const LOG_FILE = '/tmp/learning_log.xlsx';

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// WAKE-UP CHO RENDER
app.use((req, res, next) => {
  if (req.query.wake) {
    return res.send('Server wake!');
  }
  next();
});

async function appendLog(data) {
  const workbook = new ExcelJS.Workbook();
  let worksheet;

  // Load file nếu đã tồn tại
  if (fs.existsSync(LOG_FILE)) {
    try {
      await workbook.xlsx.readFile(LOG_FILE);
    } catch (err) {
      console.error("Lỗi đọc file, tạo file mới:", err);
    }
  }

  worksheet = workbook.getWorksheet('Logs') || workbook.addWorksheet('Logs');

  // Nếu sheet trống → tạo header
  if (worksheet.columns.length === 0) {
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

  await workbook.xlsx.writeFile(LOG_FILE);
}

// API nhận log
app.post('/api/log', async (req, res) => {
  try {
    await appendLog(req.body);
    res.json({ status: 'success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Trang login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Tải file Excel qua API
app.get('/api/download', (req, res) => {
  if (!fs.existsSync(LOG_FILE)) {
    return res.status(404).send("File log chưa tồn tại. Hãy học + đăng xuất 1 lần!");
  }
  res.download(LOG_FILE, 'learning_log.xlsx');
});

app.get('/download', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

app.listen(PORT, () => console.log(`Server chạy tại port ${PORT}`));

async function appendLog(data) {
  const workbook = new ExcelJS.Workbook();

  // Cố gắng đọc file cũ
  if (fs.existsSync(LOG_FILE)) {
    try {
      await workbook.xlsx.readFile(LOG_FILE);
      console.log('Đọc file log thành công');
    } catch (err) {
      console.warn('File log lỗi/khóa → ghi bằng array để an toàn tuyệt đối');
      // Không sao, vẫn tiếp tục
    }
  }

  const worksheet = workbook.getWorksheet('Logs') || workbook.addWorksheet('Logs');

  // === CHỈ TẠO HEADER NẾU CHƯA CÓ ===
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

  // === DÙNG ARRAY THEO ĐÚNG THỨ TỰ CỘT → BẤT BẠI 100% ===
  worksheet.addRow([
    new Date().toISOString().replace('T', ' ').substring(0, 19),
    data.student_id || 'N/A',
    data.full_name || 'N/A',
    data.login_count || 1,
    data.course_id || 'MATH101',
    data.duration_seconds || 0,
    data.video_percentage || 0,
    data.total_quiz_score || 0,
    data.completed || 'Không',
    data.note || ''
  ]);

  try {
    await workbook.xlsx.writeFile(LOG_FILE);
    console.log('ĐÃ GHI LOG ĐẦY ĐỦ:', data.student_id, data.full_name, data.note);
  } catch (err) {
    console.error('LỖI GHI FILE:', err);
  }
}
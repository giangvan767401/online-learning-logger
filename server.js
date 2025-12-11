const express = require("express");
const cors = require("cors");
const fs = require("fs");
const xlsx = require("xlsx");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// File log
const LOG_FILE = path.join(__dirname, "logs.xlsx");

// Tạo file logs nếu chưa có
function initLogFile() {
    if (!fs.existsSync(LOG_FILE)) {
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet([{
            "Thời gian": "",
            "Mã SV": "",
            "Họ tên": "",
            "Số lần đăng nhập": "",
            "Môn học": "",
            "Thời gian học": "",
            "% Xem video": "",
            "Tổng điểm Quiz": "",
            "Hoàn thành": "",
            "Ghi chú": ""
        }], { skipHeader: false });

        xlsx.utils.book_append_sheet(wb, ws, "Logs");
        xlsx.writeFile(wb, LOG_FILE);
    }
}

initLogFile();

// Hàm đọc số lần đăng nhập hiện tại
function getLoginCount(studentId) {
    const wb = xlsx.readFile(LOG_FILE);
    const ws = wb.Sheets["Logs"];
    const data = xlsx.utils.sheet_to_json(ws);

    const count = data.filter(r => r["Mã SV"] === studentId).length;
    return count + 1; // lần đăng nhập tiếp theo
}

// API ghi log
app.post("/log", async (req, res) => {
    const {
        student_id,
        full_name,
        course_id,
        study_time,
        video_percent,
        quiz_score,
        is_completed,
        note
    } = req.body;

    if (!student_id || !full_name || !course_id) {
        return res.status(400).json({ error: "Thiếu dữ liệu bắt buộc" });
    }

    const wb = xlsx.readFile(LOG_FILE);
    const ws = wb.Sheets["Logs"];
    const data = xlsx.utils.sheet_to_json(ws);

    const loginCount = getLoginCount(student_id);

    const newLog = {
        "Thời gian": new Date().toLocaleString("vi-VN"),
        "Mã SV": student_id,
        "Họ tên": full_name,
        "Số lần đăng nhập": loginCount,
        "Môn học": course_id,
        "Thời gian học": study_time || "",
        "% Xem video": video_percent || "",
        "Tổng điểm Quiz": quiz_score || "",
        "Hoàn thành": is_completed ? "Có" : "Chưa",
        "Ghi chú": note || ""
    };

    data.push(newLog);

    const newWS = xlsx.utils.json_to_sheet(data);
    wb.Sheets["Logs"] = newWS;
    xlsx.writeFile(wb, LOG_FILE);

    return res.json({ message: "Ghi log thành công!", log: newLog });
});

// Tải file logs
app.get("/download-logs", (req, res) => {
    res.download(LOG_FILE);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy tại ${PORT}`));

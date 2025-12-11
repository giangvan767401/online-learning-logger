const API_URL = '/api/log';
let startTime = Date.now();
let videoPercentage = 0;
let quizScore = 0;

let loginCount = Number(localStorage.getItem('login_count') || '0') + 1;
localStorage.setItem('login_count', loginCount);

// Wake server → delay → gửi log an toàn
async function safePost(data) {
  try {
    // gọi wake trước
    await fetch(API_URL + '?wake=1');

    // đợi server bật hẳn (Render Free Tier cần 300–700ms)
    await new Promise(resolve => setTimeout(resolve, 500));

    // gửi log
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

  } catch (err) {
    console.error("safePost error:", err);
  }
}

async function sendSummaryLog() {
  const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
  const completed = (videoPercentage >= 90 && quizScore >= 30) ? 'Có' : 'Không';

  await safePost({
    student_id: localStorage.getItem('student_id'),
    full_name: localStorage.getItem('full_name'),
    course_id: localStorage.getItem('course_id'),
    login_count: loginCount,
    duration_seconds: durationSeconds,
    video_percentage: videoPercentage,
    total_quiz_score: quizScore,
    completed: completed,
    note: completed === 'Có' ? 'Hoàn thành bài học' : 'Chưa hoàn thành'
  });
}

// Theo dõi video – tua thoải mái vẫn tính đúng
function onVideoTimeUpdate(video) {
  if (!video.duration) return;
  const percent = Math.round((video.currentTime / video.duration) * 100);
  if (percent > videoPercentage) {
    videoPercentage = percent;
  }
}
function onVideoEnded() {
  videoPercentage = 100;
}

// Quiz
function answer(qid, score) {
  if (document.getElementById('r' + qid.slice(1)).innerHTML) return;
  document.getElementById('r' + qid.slice(1)).innerHTML = score === 10 ? 'Correct' : 'Wrong';

  if (score === 10) quizScore += 10;

  document.getElementById('totalScore').textContent = `Điểm: ${quizScore}/50`;
}

// Logout → đảm bảo log được ghi
function logout() {
  sendSummaryLog().then(() => {
    setTimeout(() => {
      localStorage.clear();
      location.href = '/';
    }, 400); // chờ log gửi xong
  });
}

// Thoát trang / Đóng tab → dùng sendBeacon kèm wake
window.addEventListener('beforeunload', () => {
  // wake server bằng GET sync
  navigator.sendBeacon(API_URL + '?wake=1');

  // gửi beacon log
  navigator.sendBeacon(API_URL, JSON.stringify({
    student_id: localStorage.getItem('student_id') || 'unknown',
    full_name: localStorage.getItem('full_name') || 'unknown',
    course_id: localStorage.getItem('course_id') || 'unknown',
    login_count: loginCount,
    duration_seconds: Math.floor((Date.now() - startTime) / 1000),
    video_percentage: videoPercentage,
    total_quiz_score: quizScore,
    completed: (videoPercentage >= 90 && quizScore >= 30) ? 'Có' : 'Không',
    note: 'Thoát đột ngột / Đóng tab'
  }));
});

const API_URL = '/api/log';
let startTime = Date.now();
let videoPercentage = 0;
let quizScore = 0;
let loginCount = Number(localStorage.getItem('login_count') || '0') + 1;
localStorage.setItem('login_count', loginCount);

async function sendSummaryLog() {
  const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
  const completed = (videoPercentage >= 90 && quizScore >= 30) ? 'Có' : 'Không';

  await fetch(API_URL + '?wake=1', {  // thêm ?wake=1 để wake Render
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      student_id: localStorage.getItem('student_id'),
      full_name: localStorage.getItem('full_name'),
      course_id: localStorage.getItem('course_id'),
      login_count: loginCount,
      duration_seconds: durationSeconds,
      video_percentage: videoPercentage,
      total_quiz_score: quizScore,
      completed: completed,
      note: completed === 'Có' ? 'Hoàn thành bài học' : 'Chưa hoàn thành'
    })
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

// Đăng xuất → luôn ghi log
function logout() {
  sendSummaryLog();
  localStorage.clear();
  location.href = '/';
}

// Ghi log khi thoát đột ngột
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon(API_URL + '?wake=1', JSON.stringify({
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
const API_URL = '/log';
let startTime = Date.now();
let videoPercentage = 0;
let quizScore = 0;

let loginCount = Number(localStorage.getItem('login_count') || '0') + 1;
localStorage.setItem('login_count', loginCount);

// Wake server → delay → gửi log an toàn
async function safePost(data) {
  try {
    await fetch(API_URL + '?wake=1');
    await new Promise(resolve => setTimeout(resolve, 500));

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
    study_time: durationSeconds,
    video_percent: videoPercentage,
    quiz_score: quizScore,
    is_completed: completed === 'Có',
    note: completed === 'Có' ? 'Hoàn thành bài học' : 'Chưa hoàn thành'
  });
}

// Theo dõi video
function onVideoTimeUpdate(video) {
  if (!video.duration) return;
  const percent = Math.round((video.currentTime / video.duration) * 100);
  if (percent > videoPercentage) videoPercentage = percent;
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

// Logout
function logout() {
  sendSummaryLog().then(() => {
    setTimeout(() => {
      localStorage.clear();
      location.href = '/';
    }, 400);
  });
}

// Thoát tab
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon('/log?wake=1');
  navigator.sendBeacon('/log', JSON.stringify({
    student_id: localStorage.getItem('student_id') || '',
    full_name: localStorage.getItem('full_name') || '',
    course_id: localStorage.getItem('course_id') || '',
    study_time: Math.floor((Date.now() - startTime) / 1000),
    video_percent: videoPercentage,
    quiz_score: quizScore,
    is_completed: (videoPercentage >= 90 && quizScore >= 30),
    note: 'Thoát đột ngột / Đóng tab'
  }));
});

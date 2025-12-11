const API_URL = '/api/log';

async function sendLog(action, data = {}) {
  const payload = {
    student_id: localStorage.getItem('student_id') || 'unknown',
    full_name: localStorage.getItem('full_name') || 'unknown',
    course_id: localStorage.getItem('course_id') || 'unknown',
    action: action,
    page_url: window.location.href,
    ...data
  };

  await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

// Gửi log mỗi 10 giây khi xem video
function onVideoTimeUpdate(videoElement) {
  if (!videoElement.duration) return;
  const watched = Math.floor(videoElement.currentTime);
  if (watched > 0 && watched % 10 === 0) {
    sendLog('video_progress', {
      video_id: videoElement.dataset.videoId,
      duration: watched,
      percentage: Math.round((watched / videoElement.duration) * 100)
    });
  }
}

function onVideoEnded(videoElement) {
  sendLog('video_completed', {
    video_id: videoElement.dataset.videoId,
    duration: Math.floor(videoElement.duration),
    percentage: 100
  });
}

function submitQuiz(quizId, score) {
  sendLog('quiz_submitted', { quiz_id: quizId, quiz_score: score });
  alert(score === 10 ? "Đúng rồi! +10 điểm" : "Sai rồi!");
}
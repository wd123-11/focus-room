const params = new URLSearchParams(location.search);
const code = (params.get('code') || '').toUpperCase();

const shareTopic = document.getElementById('shareTopic');
const shareCode = document.getElementById('shareCode');
const finishedCount = document.getElementById('finishedCount');
const totalTime = document.getElementById('totalTime');
const avgTime = document.getElementById('avgTime');
const joinCount = document.getElementById('joinCount');
const rankList = document.getElementById('rankList');
const qqShareBtn = document.getElementById('qqShareBtn');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const joinMoreBtn = document.getElementById('joinMoreBtn');
const toast = document.getElementById('toast');

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function formatClock(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return h + ':' + m + ':' + s;
}

function formatShort(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return h + 'h' + String(m).padStart(2, '0') + 'm';
  if (m > 0) return m + 'm' + String(s).padStart(2, '0') + 's';
  return s + 's';
}

async function loadResult() {
  const resp = await fetch('/api/rooms/' + code + '/result');
  if (!resp.ok) {
    document.body.innerHTML = '<div class="container"><div class="card" style="text-align:center;"><h2>成果页不存在</h2><p class="tip">请检查链接是否完整</p><p style="margin-top:16px;"><a href="/" class="btn btn-primary" style="display:inline-block;text-decoration:none;">返回首页</a></p></div></div>';
    return;
  }
  const data = await resp.json();
  renderResult(data);
}

function renderResult(data) {
  shareTopic.textContent = data.topic;
  shareCode.textContent = data.code;
  finishedCount.textContent = data.finishedCount;
  totalTime.textContent = formatShort(data.totalDuration);
  avgTime.textContent = formatShort(data.avgDuration);
  joinCount.textContent = data.members.length;

  const ranked = data.members
    .filter((m) => m.status === 'finished')
    .sort((a, b) => b.duration - a.duration);

  const unfinished = data.members.filter((m) => m.status !== 'finished');

  if (ranked.length === 0) {
    rankList.innerHTML = '<li class="rank-item" style="justify-content:center;color:#64748b;">还没有人结束打卡</li>';
  } else {
    rankList.innerHTML = ranked.map((m, i) => `
      <li class="rank-item ${i < 3 ? 'top' + (i + 1) : ''}">
        <div class="rank-num">${i + 1}</div>
        <div class="rank-name">${m.name}${m.name === data.hostName ? ' <span class="host-tag">房主</span>' : ''}</div>
        <div class="rank-time">${formatClock(m.duration)}</div>
      </li>`).join('');
    if (unfinished.length > 0) {
      rankList.innerHTML += unfinished.map((m) => `
        <li class="rank-item">
          <div class="rank-num">—</div>
          <div class="rank-name">${m.name}</div>
          <div class="rank-time" style="color:#94a3b8;font-size:14px;">${m.status === 'running' ? '打卡中' : '未开始'}</div>
        </li>`).join('');
    }
  }

  const shareUrl = location.origin + '/share.html?code=' + data.code;
  const title = '我在「' + data.topic + '」专注打卡' + formatClock(data.members[0]?.duration || 0);
  const summary = '已有 ' + data.finishedCount + ' 人完成打卡，总专注 ' + formatShort(data.totalDuration) + '，快来一起打卡！';

  qqShareBtn.addEventListener('click', () => {
    const qqUrl = 'https://connect.qq.com/widget/shareqq/index.html?' +
      'url=' + encodeURIComponent(shareUrl) +
      '&title=' + encodeURIComponent(title) +
      '&desc=' + encodeURIComponent(summary) +
      '&summary=' + encodeURIComponent(summary);
    const win = window.open(qqUrl, '_blank', 'width=720,height=600');
    if (!win) {
      location.href = qqUrl;
    }
  });

  copyLinkBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('成果链接已复制，快去粘贴给好友');
    }).catch(() => {
      showToast('复制失败，请手动复制地址栏链接');
    });
  });

  joinMoreBtn.addEventListener('click', () => {
    location.href = '/room.html?code=' + data.code;
  });
}

loadResult();

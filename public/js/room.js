const params = new URLSearchParams(location.search);
const code = (params.get('code') || '').toUpperCase();
let token = localStorage.getItem('room_' + code);

let roomState = null;
let localTickTimer = null;
let pollTimer = null;

const joinBox = document.getElementById('joinBox');
const roomMain = document.getElementById('roomMain');
const joinRoomCode = document.getElementById('joinRoomCode');
const joinRoomForm = document.getElementById('joinRoomForm');
const joinError = document.getElementById('joinError');
const roomTopic = document.getElementById('roomTopic');
const roomCodeEl = document.getElementById('roomCode');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const myTimer = document.getElementById('myTimer');
const timerDisplay = document.getElementById('timerDisplay');
const timerLabel = document.getElementById('timerLabel');
const startBtn = document.getElementById('startBtn');
const endBtn = document.getElementById('endBtn');
const viewShareBtn = document.getElementById('viewShareBtn');
const memberList = document.getElementById('memberList');
const memberCount = document.getElementById('memberCount');
const toast = document.getElementById('toast');

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function formatDuration(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return h + ':' + m + ':' + s;
}

function statusText(status) {
  if (status === 'running') return '打卡中';
  if (status === 'finished') return '已结束';
  return '等待开始';
}

function avatarChar(name) {
  return name ? name.charAt(0).toUpperCase() : '?';
}

joinRoomCode.textContent = code;

if (!code) {
  joinBox.classList.remove('hidden');
  joinRoomCode.textContent = '参数错误';
} else if (!token) {
  joinBox.classList.remove('hidden');
} else {
  joinBox.classList.add('hidden');
  enterRoom();
}

joinRoomForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('joinRoomName').value;
  try {
    const resp = await fetch('/api/rooms/' + code + '/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      joinError.textContent = data.error || '加入失败';
      joinError.classList.add('show');
      return;
    }
    token = data.token;
    localStorage.setItem('room_' + code, token);
    joinBox.classList.add('hidden');
    enterRoom();
  } catch (err) {
    joinError.textContent = '网络异常，请重试';
    joinError.classList.add('show');
  }
});

async function fetchRoom() {
  const resp = await fetch('/api/rooms/' + code + '?token=' + encodeURIComponent(token));
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    if (resp.status === 404) {
      clearInterval(pollTimer);
      document.body.innerHTML = '<div class="container"><div class="card" style="text-align:center;"><h2>房间不存在</h2><p class="tip">请检查房间号是否正确</p><p style="margin-top:16px;"><a href="/" class="btn btn-primary" style="display:inline-block;text-decoration:none;">返回首页</a></p></div></div>';
    }
    throw new Error(data.error || '获取房间失败');
  }
  roomState = await resp.json();
  renderRoom();
}

function renderRoom() {
  roomTopic.textContent = roomState.topic;
  roomCodeEl.textContent = roomState.code;
  memberCount.textContent = '共 ' + roomState.members.length + ' 人';

  memberList.innerHTML = roomState.members.map((m) => {
    const tags = [];
    if (m.id === roomState.members[0].id && m.name === roomState.hostName) {
      tags.push('<span class="host-tag">房主</span>');
    }
    if (m.isMe) tags.push('<span class="me-tag">我</span>');
    const dot = m.status === 'running' ? '<span class="pulse-dot"></span>' : '';
    return `
      <li class="member-item ${m.status}">
        <div class="member-avatar">${avatarChar(m.name)}</div>
        <div class="member-info">
          <div class="member-name">${m.name} ${tags.join('')}</div>
          <div class="member-status">${dot}${statusText(m.status)}</div>
        </div>
        <div class="member-time">${formatDuration(m.duration)}</div>
      </li>`;
  }).join('');

  const me = roomState.me;
  myTimer.className = 'my-timer ' + (me ? me.status : 'idle');
  if (me) {
    timerDisplay.textContent = formatDuration(me.duration);
    if (me.status === 'running') {
      timerLabel.textContent = '正在专注打卡中…';
      startBtn.classList.add('hidden');
      endBtn.classList.remove('hidden');
      viewShareBtn.classList.add('hidden');
    } else if (me.status === 'finished') {
      timerLabel.textContent = '本次打卡已完成，共专注 ' + formatDuration(me.duration);
      startBtn.classList.add('hidden');
      endBtn.classList.add('hidden');
      viewShareBtn.classList.remove('hidden');
    } else {
      timerLabel.textContent = '准备开始打卡';
      startBtn.classList.remove('hidden');
      endBtn.classList.add('hidden');
      viewShareBtn.classList.add('hidden');
    }
  }
}

function enterRoom() {
  roomMain.classList.remove('hidden');
  fetchRoom().catch((err) => showToast(err.message));
  pollTimer = setInterval(() => fetchRoom().catch(() => {}), 5000);

  // 本地每秒刷新计时器，让自己的计时更流畅
  localTickTimer = setInterval(() => {
    if (!roomState || !roomState.me) return;
    const me = roomState.me;
    if (me.status === 'running') {
      const elapsed = me.duration + Math.floor((Date.now() - roomState.serverTime) / 1000);
      timerDisplay.textContent = formatDuration(elapsed);
    }
  }, 1000);
}

startBtn.addEventListener('click', async () => {
  startBtn.disabled = true;
  try {
    const resp = await fetch('/api/rooms/' + code + '/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      showToast(data.error || '操作失败');
    } else {
      showToast('打卡开始，加油！');
      await fetchRoom();
    }
  } catch (err) {
    showToast('网络异常，请重试');
  }
  startBtn.disabled = false;
});

endBtn.addEventListener('click', async () => {
  endBtn.disabled = true;
  try {
    const resp = await fetch('/api/rooms/' + code + '/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      showToast(data.error || '操作失败');
    } else {
      showToast('打卡结束，去看看成果吧');
      await fetchRoom();
    }
  } catch (err) {
    showToast('网络异常，请重试');
  }
  endBtn.disabled = false;
});

viewShareBtn.addEventListener('click', () => {
  location.href = '/share.html?code=' + code;
});

copyCodeBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(roomState.code).then(() => {
    showToast('房间号已复制');
  }).catch(() => {
    showToast('复制失败，请手动选择');
  });
});

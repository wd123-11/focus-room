const tabCreate = document.getElementById('tabCreate');
const tabJoin = document.getElementById('tabJoin');
const createForm = document.getElementById('createForm');
const joinForm = document.getElementById('joinForm');
const errorMsg = document.getElementById('errorMsg');

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add('show');
}

function clearError() {
  errorMsg.classList.remove('show');
}

tabCreate.addEventListener('click', () => {
  tabCreate.classList.add('active');
  tabJoin.classList.remove('active');
  createForm.classList.remove('hidden');
  joinForm.classList.add('hidden');
  clearError();
});

tabJoin.addEventListener('click', () => {
  tabJoin.classList.add('active');
  tabCreate.classList.remove('active');
  joinForm.classList.remove('hidden');
  createForm.classList.add('hidden');
  clearError();
});

createForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const topic = document.getElementById('createTopic').value;
  const name = document.getElementById('createName').value;
  try {
    const resp = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, name }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      showError(data.error || '创建失败，请重试');
      return;
    }
    localStorage.setItem('room_' + data.code, data.token);
    location.href = '/room.html?code=' + data.code;
  } catch (err) {
    showError('网络异常，请检查后重试');
  }
});

joinForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  const code = document.getElementById('joinCode').value.trim().toUpperCase();
  const name = document.getElementById('joinName').value;
  if (code.length !== 6) {
    showError('请输入完整的 6 位房间号');
    return;
  }
  try {
    const resp = await fetch('/api/rooms/' + code + '/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      showError(data.error || '加入失败，请重试');
      return;
    }
    localStorage.setItem('room_' + code, data.token);
    location.href = '/room.html?code=' + code;
  } catch (err) {
    showError('网络异常，请检查后重试');
  }
});

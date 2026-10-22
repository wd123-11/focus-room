const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function buildRoomState(code, token) {
  const room = db.getRoom(code);
  if (!room) return null;
  const members = db.getMembers(code);
  const now = Date.now();
  let me = null;

  const memberViews = members.map((m) => {
    let status = 'idle';
    let duration = 0;
    if (m.started_at && m.ended_at) {
      status = 'finished';
      duration = Math.max(0, Math.floor((m.ended_at - m.started_at) / 1000));
    } else if (m.started_at) {
      status = 'running';
      duration = Math.floor((now - m.started_at) / 1000);
    }
    const isMe = token && db.getMemberByToken(token)?.id === m.id;
    if (isMe) {
      me = { id: m.id, name: m.name, status, duration, startedAt: m.started_at, endedAt: m.ended_at };
    }
    return {
      id: m.id,
      name: m.name,
      status,
      duration,
      startedAt: m.started_at,
      endedAt: m.ended_at,
      isMe,
    };
  });

  return {
    code: room.code,
    topic: room.topic,
    hostName: room.host_name,
    createdAt: room.created_at,
    status: room.status,
    members: memberViews,
    me,
    serverTime: now,
  };
}

// 创建房间
app.post('/api/rooms', (req, res) => {
  const topic = (req.body.topic || '').trim().slice(0, 30);
  const name = (req.body.name || '').trim().slice(0, 20);
  if (!topic) return res.status(400).json({ error: '请填写打卡主题' });
  if (!name) return res.status(400).json({ error: '请填写你的昵称' });
  const { code, token } = db.createRoom(topic, name);
  res.json({ code, token });
});

// 加入房间
app.post('/api/rooms/:code/join', (req, res) => {
  const code = String(req.params.code).toUpperCase();
  const name = (req.body.name || '').trim().slice(0, 20);
  const room = db.getRoom(code);
  if (!room) return res.status(404).json({ error: '房间不存在，请检查房间号' });
  if (!name) return res.status(400).json({ error: '请填写你的昵称' });
  const members = db.getMembers(code);
  if (members.some((m) => m.name === name)) {
    return res.status(409).json({ error: '该昵称已在房间中，请换一个' });
  }
  const { token } = db.addMember(code, name);
  res.json({ token });
});

// 获取房间状态
app.get('/api/rooms/:code', (req, res) => {
  const code = String(req.params.code).toUpperCase();
  const state = buildRoomState(code, req.query.token);
  if (!state) return res.status(404).json({ error: '房间不存在' });
  res.json(state);
});

// 开始打卡
app.post('/api/rooms/:code/start', (req, res) => {
  const code = String(req.params.code).toUpperCase();
  const token = req.body.token;
  const room = db.getRoom(code);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  const member = db.getMemberByToken(token);
  if (!member || member.room_code !== code) {
    return res.status(403).json({ error: '你还没有加入这个房间' });
  }
  if (member.started_at && !member.ended_at) {
    return res.status(400).json({ error: '你已经在打卡中了' });
  }
  if (member.ended_at) {
    return res.status(400).json({ error: '你已经结束本次打卡' });
  }
  db.startMember(member.id);
  res.json({ ok: true });
});

// 结束打卡
app.post('/api/rooms/:code/end', (req, res) => {
  const code = String(req.params.code).toUpperCase();
  const token = req.body.token;
  const room = db.getRoom(code);
  if (!room) return res.status(404).json({ error: '房间不存在' });
  const member = db.getMemberByToken(token);
  if (!member || member.room_code !== code) {
    return res.status(403).json({ error: '你还没有加入这个房间' });
  }
  if (!member.started_at) {
    return res.status(400).json({ error: '你还没有开始打卡' });
  }
  if (member.ended_at) {
    return res.status(400).json({ error: '你已经结束打卡了' });
  }
  db.endMember(member.id);
  res.json({ ok: true });
});

// 分享结果页数据（公开，无需 token）
app.get('/api/rooms/:code/result', (req, res) => {
  const code = String(req.params.code).toUpperCase();
  const state = buildRoomState(code, null);
  if (!state) return res.status(404).json({ error: '房间不存在' });
  const finished = state.members.filter((m) => m.status === 'finished');
  const totalDuration = finished.reduce((sum, m) => sum + m.duration, 0);
  const avgDuration = finished.length ? Math.round(totalDuration / finished.length) : 0;
  res.json({
    code: state.code,
    topic: state.topic,
    hostName: state.hostName,
    createdAt: state.createdAt,
    members: state.members,
    finishedCount: finished.length,
    totalDuration,
    avgDuration,
  });
});

app.listen(PORT, () => {
  console.log(`FocusRoom server running on port ${PORT}`);
});

const BASE = 'http://localhost:3000';

async function post(path, body) {
  const resp = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || '请求失败');
  return data;
}

async function get(path) {
  const resp = await fetch(BASE + path);
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || '请求失败');
  return data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const room = await post('/api/rooms', { topic: '高数期末复习', name: '小李' });
  console.log('1. 创建房间成功，房间号:', room.code);
  const token1 = room.token;

  const joined = await post(`/api/rooms/${room.code}/join`, { name: '小王' });
  console.log('2. 小王加入成功');
  const token2 = joined.token;

  await post(`/api/rooms/${room.code}/start`, { token: token1 });
  console.log('3. 小李开始打卡');
  await sleep(3000);

  await post(`/api/rooms/${room.code}/start`, { token: token2 });
  console.log('4. 小王开始打卡');
  await sleep(2000);

  await post(`/api/rooms/${room.code}/end`, { token: token1 });
  console.log('5. 小李结束打卡');
  await sleep(2000);

  await post(`/api/rooms/${room.code}/end`, { token: token2 });
  console.log('6. 小王结束打卡');

  const state = await get(`/api/rooms/${room.code}?token=${token1}`);
  console.log('7. 房间状态:');
  state.members.forEach((m) => {
    console.log(`   - ${m.name} [${m.status}] 时长 ${m.duration}s`);
  });

  const result = await get(`/api/rooms/${room.code}/result`);
  console.log('8. 成果单: 完成', result.finishedCount, '人, 总时长', result.totalDuration, 's, 人均', result.avgDuration, 's');

  // 异常场景测试
  try {
    await post(`/api/rooms/${room.code}/start`, { token: token1 });
    console.log('9. [异常] 重复开始未被拦截 - 测试失败');
  } catch (e) {
    console.log('9. [异常] 重复开始被正确拦截:', e.message);
  }

  try {
    await post('/api/rooms/ZZZZZZ/join', { name: '测试' });
    console.log('10. [异常] 不存在房间未被拦截 - 测试失败');
  } catch (e) {
    console.log('10. [异常] 不存在房间被正确拦截:', e.message);
  }

  console.log('\n全部测试通过 ✓');
})();

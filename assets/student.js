(() => {
  'use strict';
  /*
   * 학생 투표 페이지 – 로그인·설정 없이 이름만 적으면 선생님 화면으로 전달돼요.
   * 주소 예: index.html?c=<방 코드>&t=<제목>
   * 방 코드는 선생님 화면이 무작위로 만들어 QR에 넣어 줘요. 이름은 무료 중계 서비스(ntfy.sh)를 거쳐 전달돼요.
   */
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const code = params.get('c') || '';
  const title = (params.get('t') || '우리 반 배려왕').slice(0, 30);
  // 시험용: ?relay=http://localhost:포트 로 가짜 중계 서버 사용
  const RELAY = params.get('relay') || 'https://ntfy.sh';

  const valid = /^[a-z0-9]{16,40}$/.test(code);
  const VOTED_KEY = `caringKing.voted:${code}`; // 이 태블릿이 이 방에서 투표했는지

  const readVote = () => { try { return localStorage.getItem(VOTED_KEY); } catch { return null; } };
  const saveVote = (name) => { try { localStorage.setItem(VOTED_KEY, name); } catch { /* 무시 */ } };

  // 글자·숫자만 남김 (공백·이모지·기호 제거)
  const normalize = (raw) => String(raw || '').normalize('NFC').replace(/[^\p{L}\p{N}]/gu, '');

  function show(view, name) {
    $('vote').hidden = view !== 'vote';
    $('done').hidden = view !== 'done';
    $('broken').hidden = view !== 'broken';
    if (view === 'done') $('picked').textContent = name;
  }

  $('title').textContent = title;
  document.title = `${title} 투표`;

  if (!valid) show('broken');
  else if (readVote()) show('done', readVote());
  else show('vote');

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = normalize($('name').value);
    const msg = $('msg');
    if (!name) return (msg.textContent = '친구 이름을 적어 주세요.');
    if (name.length > 10) return (msg.textContent = '이름이 너무 길어요. (10글자 이하)');
    if (/^[㄰-㆏]+$/.test(name)) return (msg.textContent = '이름을 정확히 적어 주세요.');
    if (readVote()) return show('done', readVote());
    if (!confirm(`‘${name}’ 친구에게 투표할까요?\n한 번 투표하면 바꿀 수 없어요.`)) return;

    $('submit').disabled = true;
    msg.textContent = '';
    try {
      const res = await fetch(`${RELAY}/ck-${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }, // 한글이 파일로 처리되지 않게 글자 형식 명시
        body: name,
      });
      if (!res.ok) throw new Error(res.status === 429 ? 'busy' : 'fail');
      saveVote(name);
      show('done', name);
    } catch (err) {
      msg.textContent = err.message === 'busy'
        ? '친구들이 한꺼번에 보내는 중이에요. 잠시 뒤 다시 눌러 주세요.'
        : '보내지 못했어요. 와이파이를 확인하고 다시 눌러 주세요.';
    } finally {
      $('submit').disabled = false;
    }
  });
})();

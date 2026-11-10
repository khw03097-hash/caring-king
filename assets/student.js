(() => {
  'use strict';
  /*
   * 학생 투표 페이지 – 로그인 없이 이름만 적으면 선생님의 구글 설문지로 제출돼요.
   * 주소 예: index.html?f=<설문지 ID>&e=<질문 번호>&r=<회차>&t=<제목>
   * (선생님 화면의 QR에 이 값들이 들어 있어요)
   */
  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const formId = params.get('f') || '';
  const entryId = params.get('e') || '';
  const round = params.get('r') || '0';
  const title = (params.get('t') || '우리 반 배려왕').slice(0, 30);

  const valid = /^[\w-]{20,}$/.test(formId) && /^\d+$/.test(entryId);
  const VOTED_KEY = `caringKing.voted:${formId}:${round}`; // 이 태블릿에서 이번 회차에 투표했는지

  function readVote() {
    try { return localStorage.getItem(VOTED_KEY); } catch { return null; }
  }
  function saveVote(name) {
    try { localStorage.setItem(VOTED_KEY, name); } catch { /* 저장소를 못 쓰는 브라우저 */ }
  }

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
      // 구글 설문지는 다른 사이트에서 보낸 결과를 읽을 수 없게 막아 두어서(no-cors) 보내기만 해요.
      // 인터넷이 끊겼을 때만 오류가 나요.
      await fetch(`https://docs.google.com/forms/d/e/${formId}/formResponse`, {
        method: 'POST',
        mode: 'no-cors',
        body: new URLSearchParams({ [`entry.${entryId}`]: name }),
      });
      saveVote(name);
      show('done', name);
    } catch {
      msg.textContent = '인터넷에 연결되어 있지 않아요. 와이파이를 확인하고 다시 눌러 주세요.';
    } finally {
      $('submit').disabled = false;
    }
  });
})();

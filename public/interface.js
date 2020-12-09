function toggle() {
  const s0 = document.getElementById('settings-json').style;
  const state = s0.display === 'none' ? 'block' : 'none';
  s0.display = state;
  const s1 = document.getElementById('settings').style;
  s1.height = state === 'none' ? '50px' : '100vh';
  s1.width = state === 'none' ? '300px' : '50%';
  const s2 = document.getElementById('settings-toggle-icon');
  s2.classList.remove(state === 'none' ? 'fa-chevron-up' : 'fa-chevron-down');
  s2.classList.add(state !== 'none' ? 'fa-chevron-up' : 'fa-chevron-down');
}

toggle();

function addStream() {
  const streamName = document.getElementById('stream-name').value;
  const streamIp = document.getElementById('stream-ip').value;

  console.log(streamName);
  console.log(streamIp);
  connectAxis();
}

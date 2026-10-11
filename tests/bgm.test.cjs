const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const help = { hidden: true, textContent: '' };
const audio = { paused: true, volume: 0, pause() { this.paused = true; }, load() {}, removeAttribute() {}, addEventListener() {}, play: async function() { this.paused = false; } };
const context = vm.createContext({ URL, console: { warn() {}, error: console.error }, document: { getElementById: id => id === 'background-music' ? audio : id === 'bgm-help' ? help : null, addEventListener() {} }, templeContent: { bgmVolume: 0.3, bgmSheetURL: 'test' }, setInterval() {} });
const source = readFileSync('script.js', 'utf8').split('initializeTempleTV();')[0];
vm.runInContext(source, context);
async function run() {
  vm.runInContext(`fetchCSV = async () => [
    ['MusicURL','Type','Active','DisplayOrder','Weekday','Start Time','End Time'],
    ['https://drive.google.com/file/d/test123/view?resourcekey=key123','SCHEDULED','YES','1','MONDAY','6:00 PM','8:00 PM'],
    ['music/default.mp3','DEFAULT','YES','2','ALL','',''],
    ['music/disabled.mp3','SPECIAL','NO','3','MONDAY','6:00 PM','8:00 PM']
  ];`, context);
  await vm.runInContext('loadBGMPlaylist()', context);
  assert.equal(vm.runInContext('specialBGMTracks.length', context), 1);
  assert.equal(vm.runInContext('specialBGMTracks[0].startTime', context), '6:00 PM');
  assert.equal(vm.runInContext('specialBGMTracks[0].endTime', context), '8:00 PM');
  assert.equal(vm.runInContext('defaultBGMPlaylist.length', context), 1);
  assert.equal(vm.runInContext('specialBGMTracks[0].url', context), 'https://drive.google.com/uc?export=download&id=test123&resourcekey=key123');
  assert.equal(vm.runInContext(`convertDriveAudioURL('https://other.example/audio?id=123')`, context), 'https://other.example/audio?id=123');
  assert.equal(vm.runInContext(`weekdayMatches('SATURDAY-2', new Date(2026,9,10))`, context), true);
  assert.equal(vm.runInContext(`timeWindowMatches('6:00 PM','8:00 PM',new Date(2026,9,12,18,0))`, context), true);
  assert.equal(vm.runInContext(`timeWindowMatches('6:00 PM','8:00 PM',new Date(2026,9,12,20,0))`, context), false);
  vm.runInContext('defaultBGMPlaylist=[]; currentBGMMode="SPECIAL"; startDefaultBGM(true)', context);
  assert.equal(audio.paused, true);
  assert.equal(vm.runInContext('currentBGMPlaylist.length', context), 0);
  audio.play = async () => { throw Object.assign(new Error('blocked'), { name: 'NotAllowedError' }); };
  await vm.runInContext('tryPlayBGM()', context);
  assert.equal(help.hidden, false);
  assert.match(help.textContent, /enable background music/);
  audio.play = async () => {};
  await vm.runInContext('tryPlayBGM()', context);
  assert.equal(help.hidden, true);
  console.log('V1 BGM regression checks passed');
}
run().catch(error => { console.error(error); process.exitCode = 1; });

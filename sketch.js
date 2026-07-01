let lanes = 5;
let laneWidth;
let notes = [];
let score = 0;
let speed = 5;
let keys = ['A', 'S', 'D', 'F', 'G'];

let gameState = "START"; 
let misses = 0;
let maxMisses = 5;

// --- 音楽用の設定（ライブラリ不要の仕組みに変更） ---
let audioCtx = null;
let melody = [
  'C4', 'C4', 'D4', 'C4', 'F4', 'E4', 'rest',
  'C4', 'C4', 'D4', 'C4', 'G4', 'F4', 'rest',
  'C4', 'C4', 'C5', 'A4', 'F4', 'E4', 'D4',
  'A#4', 'A#4', 'A4', 'F4', 'G4', 'F4'
];
let durations = [
  0.75, 0.25, 1.0, 1.0, 1.0, 2.0, 0.5,
  0.75, 0.25, 1.0, 1.0, 1.0, 2.0, 0.5,
  0.75, 0.25, 1.0, 1.0, 1.0, 1.0, 1.0,
  0.75, 0.25, 1.0, 1.0, 1.0, 2.0
];
let currentNoteIndex = 0;
let noteTimer = 0;

// 音階の名前と周波数の対応表
let noteFreqs = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88, 'C5': 523.25
};

function setup() {
  createCanvas(400, 600);
  laneWidth = width / lanes;
}

function draw() {
  background(20);

  if (gameState === "START") {
    drawStartScreen();
  } else if (gameState === "PLAY") {
    drawPlayScreen();
    playMelody(); 
  } else if (gameState === "GAMEOVER") {
    drawGameOverScreen();
  }
}

// ブラウザ標準の機能で一瞬だけ音を鳴らす関数
function playTone(freq, durationSec) {
  if (!audioCtx) return;
  let osc = audioCtx.createOscillator();
  let gainNode = audioCtx.createGain();
  
  osc.type = 'sine'; // 優しい音色
  osc.frequency.value = freq;
  
  // 音がブツッと切れないように滑らかに音量を下げる設定
  gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSec);
  
  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + durationSec);
}

function playMelody() {
  noteTimer--;

  if (noteTimer <= 0) {
    if (currentNoteIndex >= melody.length) {
      currentNoteIndex = 0; // ループ
    }

    let currentNote = melody[currentNoteIndex];
    let duration = durations[currentNoteIndex];

    if (currentNote !== 'rest') {
      let freq = noteFreqs[currentNote];
      if (freq) {
        // 次の音までの秒数を計算して鳴らす
        playTone(freq, duration * 0.4);
      }

      // タイルを生成
      let randomLane = floor(random(lanes));
      notes.push({
        lane: randomLane,
        y: -100,
        h: 80
      });
    }

    noteTimer = duration * 35; 
    currentNoteIndex++;
  }
}

// --- 画面描画 ---
function drawStartScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(32);
  text("Birthday Tiles", width / 2, height / 2 - 60);
  
  textSize(16);
  text("Play Keys: [A] [S] [D] [F] [G]", width / 2, height / 2);
  text("Allowed Misses: " + maxMisses, width / 2, height / 2 + 30);
  
  fill(255);
  rectMode(CENTER);
  rect(width / 2, height / 2 + 100, 240, 45, 5);
  
  fill(0);
  textSize(16);
  text("Press [SPACE] to Start", width / 2, height / 2 + 100);
  rectMode(CORNER);
}

function drawPlayScreen() {
  stroke(60);
  for (let i = 1; i < lanes; i++) {
    line(i * laneWidth, 0, i * laneWidth, height);
  }

  for (let i = notes.length - 1; i >= 0; i--) {
    let note = notes[i];
    note.y += speed;

    fill(0);
    stroke(200);
    strokeWeight(2);
    rect(note.lane * laneWidth, note.y, laneWidth, note.h);

    if (note.y > height) {
      notes.splice(i, 1);
      misses++;
      checkGameOver();
    }
  }

  let judgeZoneY = height - 80;
  for (let i = 0; i < lanes; i++) {
    if (keyIsPressed && key.toUpperCase() === keys[i]) {
      fill(150);
    } else {
      fill(255);
    }
    noStroke();
    rect(i * laneWidth, judgeZoneY, laneWidth, 80);

    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text(keys[i], i * laneWidth + laneWidth / 2, judgeZoneY + 40);
  }

  fill(255);
  noStroke();
  textSize(20);
  textAlign(LEFT, TOP);
  text("Score: " + score, 20, 20);
  
  textAlign(RIGHT, TOP);
  let lifeText = "";
  for(let i = 0; i < maxMisses; i++) {
    if (i < maxMisses - misses) lifeText += "● ";
    else lifeText += "× ";
  }
  text(lifeText, width - 20, 20);
}

function drawGameOverScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(36);
  fill(255, 100, 100);
  text("GAME OVER", width / 2, height / 2 - 50);
  
  fill(255);
  textSize(24);
  text("Final Score: " + score, width / 2, height / 2 + 10);
  
  textSize(16);
  text("Press [SPACE] to Restart", width / 2, height / 2 + 70);
}

function checkGameOver() {
  if (misses >= maxMisses) {
    gameState = "GAMEOVER";
  }
}

function keyPressed() {
  if (gameState === "START") {
    if (key === ' ') {
      // スペースキーが押された瞬間にオーディオ機能を初期化（エラー回避）
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      startGame();
    }
  } else if (gameState === "GAMEOVER") {
    if (key === ' ') {
      gameState = "START";
    }
  } else if (gameState === "PLAY") {
    let judgeZoneY = height - 80;
    let currentKey = key.toUpperCase();
    let hit = false;

    for (let i = 0; i < lanes; i++) {
      if (currentKey === keys[i]) {
        for (let j = 0; j < notes.length; j++) {
          let note = notes[j];
          if (note.lane === i) {
            if (note.y + note.h > judgeZoneY && note.y < height) {
              score += 10;
              notes.splice(j, 1);
              hit = true;
              break;
            }
          }
        }
        if (!hit) {
          misses++;
          checkGameOver();
        }
      }
    }
  }
}

function startGame() {
  notes = [];
  score = 0;
  misses = 0;
  currentNoteIndex = 0;
  noteTimer = 0;
  gameState = "PLAY";
}

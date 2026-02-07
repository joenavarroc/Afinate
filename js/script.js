const canvas = document.getElementById("dial");
const ctx = canvas.getContext("2d");
const noteEl = document.getElementById("note");
const statusEl = document.getElementById("status");
const instrumentSel = document.getElementById("instrument");
const startBtn = document.getElementById("start");
const freqEl = document.getElementById("freq");

const guitarNotes = [
 {note:"E",freq:82.41},{note:"A",freq:110},
 {note:"D",freq:146.83},{note:"G",freq:196},
 {note:"B",freq:246.94},{note:"E",freq:329.63}
];
const bassNotes = [
 {note:"E",freq:41.2},{note:"A",freq:55},
 {note:"D",freq:73.42},{note:"G",freq:98}
];

let audioCtx, analyser, buffer;

startBtn.addEventListener("click", async ()=>{
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
  analyser = audioCtx.createAnalyser();
  const mic = audioCtx.createMediaStreamSource(stream);
  mic.connect(analyser);
  analyser.fftSize = 2048;
  buffer = new Float32Array(analyser.fftSize);
  update();
});

function drawDial(value){
  ctx.clearRect(0,0,320,180);
  const cx=160, cy=150, r=110;
  const start=Math.PI*0.9;
  const end=Math.PI*2.1;
  const points=15;

  for(let i=0;i<points;i++){
    let t=i/(points-1);
    let angle=start+t*(end-start);
    let x=cx+Math.cos(angle)*r;
    let y=cy+Math.sin(angle)*r;

    let color = t<0.3?"red": t<0.45?"orange": t<0.55?"lime": t<0.7?"orange":"red";
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.arc(x,y,6,0,Math.PI*2);
    ctx.fill();
  }

  let needleAngle = start + (value+50)/100*(end-start);
  ctx.strokeStyle="white";
  ctx.lineWidth=3;
  ctx.beginPath();
  ctx.moveTo(cx,cy);
  ctx.lineTo(cx+Math.cos(needleAngle)*r, cy+Math.sin(needleAngle)*r);
  ctx.stroke();
}

function autoCorrelate(buf,sampleRate){
  let SIZE=buf.length;
  let rms=0;
  for(let i=0;i<SIZE;i++) rms+=buf[i]*buf[i];
  rms=Math.sqrt(rms/SIZE);
  if(rms<0.01) return -1;

  let c=new Array(SIZE).fill(0);
  for(let i=0;i<SIZE;i++)
    for(let j=0;j<SIZE-i;j++)
      c[i]+=buf[j]*buf[j+i];

  let d=0;
  while(c[d]>c[d+1]) d++;
  let maxval=-1,maxpos=-1;
  for(let i=d;i<SIZE;i++){
    if(c[i]>maxval){maxval=c[i];maxpos=i;}
  }
  return sampleRate/maxpos;
}

function closest(freq,list){
  return list.reduce((a,b)=>Math.abs(freq-a.freq)<Math.abs(freq-b.freq)?a:b);
}

function update(){
  analyser.getFloatTimeDomainData(buffer);
  let freq = autoCorrelate(buffer,audioCtx.sampleRate);

  if(freq!=-1){
    freqEl.textContent = freq.toFixed(1)+" Hz";
    let list = instrumentSel.value==="guitar" ? guitarNotes : bassNotes;
    let note = closest(freq,list);
    let diff = freq-note.freq;

    noteEl.textContent = note.note;
    statusEl.textContent = Math.abs(diff)<1 ? "In tune" : "Tuning";
    drawDial(diff*10);
  }
  requestAnimationFrame(update);
}

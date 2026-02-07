console.log("JS OK");

const canvas = document.getElementById("dial");
const ctx = canvas.getContext("2d");
const noteEl = document.getElementById("note");
const freqEl = document.getElementById("freq");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start");

const guitarNotes = [
  {note:"E",freq:82.41},
  {note:"A",freq:110},
  {note:"D",freq:146.83},
  {note:"G",freq:196},
  {note:"B",freq:246.94},
  {note:"E",freq:329.63}
];

const bassNotes = [
  {note:"E",freq:41.20},
  {note:"A",freq:55.00},
  {note:"D",freq:73.42},
  {note:"G",freq:98.00}
];

let notes = guitarNotes;

const instrumentSelect = document.getElementById("instrument");

instrumentSelect.onchange = () => {
  notes = instrumentSelect.value === "bass" ? bassNotes : guitarNotes;
};


let audioCtx, analyser, buffer;

startBtn.onclick = async ()=>{
  audioCtx = new AudioContext();
  await audioCtx.resume();
  const stream = await navigator.mediaDevices.getUserMedia({audio:true});
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  buffer = new Float32Array(analyser.fftSize);
  const source = audioCtx.createMediaStreamSource(stream);
  source.connect(analyser);
  statusEl.textContent = "Escuchando...";
  update();
};

function drawDial(diff){
  ctx.clearRect(0,0,320,180);

  const cx = 160;
  const cy = 120;
  const spacing = 14;

  let level = Math.round(diff / 2); 
  level = Math.max(-7, Math.min(7, level));

  for(let i = -7; i <= 7; i++){
    let x = cx + i * spacing;
    let y = cy;

    let color = "#222";

    if(i < 0) color = "red";
    if(i > 0) color = "red";
    if(i === 0) color = "lime";

    if(
      (level < 0 && i >= level && i < 0) ||
      (level > 0 && i <= level && i > 0) ||
      (level === 0 && i === 0)
    ){
      ctx.fillStyle = color;
    } else {
      ctx.fillStyle = "#333";
    }

    // LED cuadrado simple (compatible con todos)
    ctx.fillRect(x-6, y-6, 12, 12);
  }
}

function autoCorrelate(buf,sr){
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

  let max=-1,pos=-1;
  for(let i=d;i<SIZE;i++){
    if(c[i]>max){max=c[i];pos=i;}
  }
  return sr/pos;
}

function closest(freq){
  return notes.reduce((a,b)=>
    Math.abs(freq-a.freq)<Math.abs(freq-b.freq)?a:b
  );
}

function update(){
  analyser.getFloatTimeDomainData(buffer);
  let freq=autoCorrelate(buffer,audioCtx.sampleRate);

  if(freq!=-1){
      let sum = 0;
  for(let i=0;i<buffer.length;i++){
    sum += Math.abs(buffer[i]);
  }
  let volume = sum / buffer.length;

    let n=closest(freq);
    let diff=freq-n.freq;

    noteEl.textContent=n.note;
    freqEl.textContent=freq.toFixed(1)+" Hz";

    if(diff>1) statusEl.textContent="Muy alto (aflojá)";
    else if(diff<-1) statusEl.textContent="Muy bajo (apretá)";
    else statusEl.textContent="Afinado ✔";

    drawDial(diff);
  }

  requestAnimationFrame(update);
}

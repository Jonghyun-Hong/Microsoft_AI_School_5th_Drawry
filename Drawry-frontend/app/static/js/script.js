async function speakTextWithAzure(text) {
  if (!text) return;

  const response = await fetch("/speak", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) return;

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await response.arrayBuffer();
  const decodedAudio = await audioContext.decodeAudioData(audioBuffer);

  const source = audioContext.createBufferSource();
  source.buffer = decodedAudio;
  source.connect(audioContext.destination);
  source.start(0);
}

import { SOUNDS } from './constants.ts';

export const playSound = (type: 'correct' | 'wrong') => {
  const audio = new Audio(SOUNDS[type]);
  audio.play().catch(() => {
    // Ignore errors if browser blocks autoplay
  });
};

export const speakText = (text: string) => {
  if (!('speechSynthesis' in window)) return;

  // Stop any current speech
  window.speechSynthesis.cancel();

  // Prepare text for better speech (especially for math)
  let spokenText = text;
  spokenText = spokenText.replace(/\+/g, ' cộng ');
  spokenText = spokenText.replace(/-/g, ' trừ ');
  spokenText = spokenText.replace(/=/g, ' bằng ');
  spokenText = spokenText.replace(/\?/g, ' mấy ');
  spokenText = spokenText.replace(/>/g, ' lớn hơn ');
  spokenText = spokenText.replace(/</g, ' bé hơn ');

  // Small delay to ensure cancel has finished
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find(v => v.lang.toLowerCase().includes('vi'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, 100);
};

// Initial voice load for some browsers
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }
}

import { Howl } from 'howler';

export const playLoopedSound = (audioFilePath, maxLoops) => {
  var loopCount = 0;
  var sound;

  const playSound = () => {
    sound = new Howl({
      src: [audioFilePath],
      onend: handleEnd,
    });
    sound.play();
  };

  const handleEnd = () => {
    if (loopCount < maxLoops - 1) {
      loopCount++;
      sound.play();
    } else {
      loopCount = 0;
    }
  };

  playSound();
};

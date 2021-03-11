import * as Tone from "tone";

let effects = [
  {
    label: "Echo",
    type: "mic",
    params: [
      { label: "Delay Time", key: "delayTime", min: 0, max: 1, val: 0 },
      { label: "Feedback", key: "feedback", min: 0, max: 1, val: 0 },
    ],
    // effect: new Tone.FeedbackDelay(0, 0),
    function: "FeedbackDelay"
  },
  {
    label: "Pitch Shift",
    type: "mic",
    params: [{ label: "Interval", key: "interval", min: -20, max: 20, val: 0 }],
    // effect: new Tone.PitchShift(0),
    function: "PitchShift"
  },
  {
    label: "Upset Baby",
    file: "assets/185575__ciccarelli__crying-baby.wav.mp3",
  },
  {
    label: "Man Weeping",
    file: "assets/200428__qubodup__man-crying-and-whimmering.flac.mp3",
  },
];

for (let e of effects) {
  if (e.file) {
    e.effect = new Tone.Player(e.file);
    e.params = [{ label: "Volume", key: "volume", min: -30, max: 30, val: 0 }];
    e.type = "file";
    e.function = "Player"
  }
}

export default effects;

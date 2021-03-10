import * as Tone from "tone";

let effects = [
  {
    label: "Echo",
    type: mic,
    params: [
      { label: "Delay Time", min: 0, max: 1 },
      { label: "Feedback", min: 0, max: 1 },
    ],
    effect: new Tone.FeedbackDelay(0, 0),
  },
  {
    label: "Pitch Shift",
    type: mic,
    params: [{ label: "Interval", min: -20, max: 20 }],
    effect: new Tone.PitchShift(0),
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
    e.effect = new Tone.Player(e.file)
  }
}

export default effects;

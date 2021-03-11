let effects = [
  {
    label: "Echo",
    type: "mic",
    params: [
      { label: "Delay Time", key: "delayTime", min: 0, max: 1, val: 0.4 },
      { label: "Feedback", key: "feedback", min: 0, max: 1, val: 0.1 },
    ],
    function: "FeedbackDelay",
    icon: require("./images/echo.gif"),
  },
  {
    label: "Bad Connection",
    params: [{ label: "Choppiness", key: "frequency", min: 100, max: 500, val: 250 }],
    icon: require("./images/shift.gif"),
  },
  // {
  //   label: "Pitch Shift",
  //   type: "mic",
  //   params: [{ label: "Interval", key: "interval", min: -22, max: 22, val: 0 }],
  //   function: "PitchShift",
  //   icon: require("./images/shift.gif"),
  // },
  {
    label: "Upset Baby",
    file: "assets/185575__ciccarelli__crying-baby.wav.mp3",
    icon: require("./images/baby.gif"),
  },
  {
    label: "Man Weeping",
    file: "assets/200428__qubodup__man-crying-and-whimmering.flac.mp3",
    icon: require("./images/tear.gif"),
  },
  {
    label: "Wind",
    file: "assets/244807__meepalicious__strong-wind-and-moving-cars.wav.mp3",
    icon: require("./images/wind.gif"),
  },
  {
    label: "Dogs",
    file: "assets/474484__rpdud27__aaa-3-0-1.wav.mp3",
    icon: require("./images/dog.gif"),
  },
  {
    label: "Construction",
    file: "assets/400991__inspectorj__construction-jackhammer-excavator-a.wav.mp3",
    icon: require("./images/hammer.gif"),
  },
  {
    label: "Urination",
    file: "assets/473997__nomerodin1__pee-in-the-toilet.wav.mp3",
    icon: require("./images/toilet.gif"),
  },
];

for (let e of effects) {
  if (e.file) {
    e.params = [{ label: "Volume", key: "volume", min: -30, max: 30, val: 0 }];
    e.type = "file";
    e.function = "Player";
  }
}

export default effects;

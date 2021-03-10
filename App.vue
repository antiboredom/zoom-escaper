<template>
  <div>
    <div v-if="hasSink">
      <p>
        <label for="inputDevice">Microphone</label>
        <select id="inputDevice" v-model="inputDevice">
          <option v-for="input in inputs" :value="input.value">
            {{ input.text }}
          </option>
        </select>
      </p>

      <p>
        <label for="outputDevice">Output</label>
        <select id="outputDevice" v-model="outputDevice">
          <option v-for="output in outputs" :value="output.value">
            {{ output.text }}
          </option>
        </select>
      </p>

      <p>
        <button @click="start">{{ running ? "Stop" : "Start" }}</button>
      </p>

      <div class="effect" v-for="e in effects">
        <label>{{ e.label }} <input type="checkbox" v-model="e.on" @change="toggle(e)" /></label>
        <div class="params">
          <div v-for="param in e.params">
            <label>{{ param.label }}</label>
            <input
              type="range"
              :min="param.min"
              :max="param.max"
              step="0.01"
              v-model="param.val"
              @change="adjust(e)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import * as Tone from "tone";
// import effects from "./effects";

export default Vue.extend({
  created() {
    this.getDevices();
  },

  data() {
    return {
      inputs: [],
      outputs: [],
      inputDevice: null,
      outputDevice: null,
      hasSink: false,
      running: false,
      effects: [],
    };
  },
  methods: {
    async getDevices() {
      const sink = Audio.prototype.setSinkId;
      this.hasSink = sink ? true : false;

      if (!sink) {
        return false;
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs = devices
        .filter((d) => d.kind === "audioinput")
        .map((d) => ({ text: d.label, value: d.deviceId }));
      const outputs = devices
        .filter((d) => d.kind === "audiooutput")
        .map((d) => ({ text: d.label, value: d.deviceId }));

      this.inputDevice = inputs[0].value;

      const vbDevice = outputs.find((d) => d.text.includes("VB"));
      if (vbDevice) this.outputDevice = vbDevice.value;

      this.inputs = inputs;
      this.outputs = outputs;
    },

    async start() {
      this.context = new AudioContext({ sampleRate: 48000 });

      this.destination = new MediaStreamAudioDestinationNode(this.context, {
        channelCountMode: "explicit",
        channelCount: 1,
        channelInterpretation: "speakers",
      });

      this.audio = new Audio();
      this.audio.srcObject = this.destination.stream;
      await this.audio.setSinkId(this.outputDevice);
      this.audio.play();

      // this.stream = await navigator.mediaDevices.getUserMedia({
      //   audio: {
      //     deviceId: { exact: this.inputDevice },
      //     channelCount: { ideal: 1 },
      //     noiseSuppression: { ideal: false },
      //     echoCancellation: { ideal: true },
      //     autoGainControl: { ideal: false },
      //     sampleRate: { ideal: 48000 },
      //   },
      // });
      // this.source = this.context.createMediaStreamSource(this.stream);

      Tone.setContext(this.context);
      const synth = new Tone.Synth();
      synth.connect(this.destination);
      synth.triggerAttackRelease("C4", "8n");

      this.mic = new Tone.UserMedia();
      this.mic.open(this.inputDevice);
      this.mic.connect(this.destination);

      let effects = [
        {
          label: "Echo",
          type: "mic",
          params: [
            { label: "Delay Time", key: "delayTime", min: 0, max: 1, val: 0 },
            { label: "Feedback", key: "feedback", min: 0, max: 1, val: 0 },
          ],
          effect: new Tone.FeedbackDelay(0, 0),
        },
        {
          label: "Pitch Shift",
          type: "mic",
          params: [{ label: "Interval", key: "interval", min: -20, max: 20, val: 0 }],
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
          e.effect = new Tone.Player(e.file);
          e.params = [{ label: "Volume", key: "volume", min: -30, max: 30, val: 0 }];
          e.type = "file";
        }
      }

      this.toneEffects = effects;

      for (let e of this.toneEffects) {
        const effect = {
          label: e.label,
          type: e.type,
          params: e.params,
          on: false,
        };
        this.effects.push(effect);
      }
    },

    toggle(effect) {
      const toneEffect = this.toneEffects.find((e) => e.label === effect.label).effect;
      console.log(effect.on, this.destination, this.mic, toneEffect);

      if (effect.on) {
        if (effect.type === "mic") {
          this.mic.connect(toneEffect);
        } else if (effect.type === "file") {
          toneEffect.loop = true;
          toneEffect.start();
        }
        toneEffect.connect(this.destination);
      } else {
        if (effect.type === "mic") {
          this.mic.disconnect(toneEffect);
        } else if (effect.type === "file") {
          toneEffect.stop();
        }

        toneEffect.disconnect(this.destination);
      }
    },

    adjust(effect) {
      const toneEffect = this.toneEffects.find((e) => e.label === effect.label).effect;
      let params = {};
      for (const p of effect.params) {
        params[p.key] = p.val;
      }
      toneEffect.set(params);
    },
  },
});
</script>

<style scoped>
.effect {
  padding: 20px;
  border: 1px solid #000;
}
</style>

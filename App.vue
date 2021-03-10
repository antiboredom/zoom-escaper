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

      <div>
        <label
          >Pitch Shift
          <input
            type="checkbox"
            v-model="effects.pitchShift.on"
            @change="toggleEffect('pitchShift')"
        /></label>

        Interval
        <input
          type="range"
          min="-22"
          max="22"
          step="0.1"
          v-model="effects.pitchShift.params.interval"
          @change="adjuctEffect('feedbackDelay')"
        />
      </div>

      <div>
        <label
          >Feedback
          <input
            type="checkbox"
            v-model="effects.feedbackDelay.on"
            @change="toggleEffect('feedbackDelay')"
        /></label>

        Feedback Delay
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model="effects.feedbackDelay.params.delayTime"
          @change="adjuctEffect('feedbackDelay')"
        />

        Feedback Amount
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          v-model="effects.feedbackDelay.params.feedback"
          @change="adjuctEffect('feedbackDelay')"
        />
      </div>

      <div>
        <label
          >Baby Crying
          <input
            type="checkbox"
            v-model="effects.baby.on"
            @change="toggleEffect('baby')"
        /></label>

        Volume
        <input
          type="range"
          min="-30"
          max="20"
          step="0.1"
          v-model="effects.baby.params.volume"
          @change="adjuctEffect('baby')"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import * as Tone from "tone";
import effects from "./effects";

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
      feedbackMe: false,
      feedbackMeDelay: 0,
      feedbackMeFeedback: 0,
      running: false,
      effects: [],
      effects: {
        feedbackDelay: {
          mic: true,
          effect: null,
          on: false,
          params: { feedback: 0, delayTime: 0 },
        },
        pitchShift: { mic: true, effect: null, on: false, params: { interval: 0 } },
        baby: { effect: null, on: false, file: "assets/185575__ciccarelli__crying-baby.wav.mp3", params: { volume: 0 } },
        dog: { effect: null, on: false, file: "", params: { volume: 0.5 } },
        crying: { effect: null, on: false, file: "", params: { volume: 0.5 } },
        traffic: { effect: null, on: false, file: "", params: { volume: 0.5 } },
        construction: { effect: null, on: false, file: "", params: { volume: 0.5 } },
        peeing: { effect: null, on: false, file: "", params: { volume: 0.5 } },
        crowd: { effect: null, on: false, file: "", params: { volume: 0.5 } },
      },
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

      this.feedbackDelay = new Tone.FeedbackDelay(1, 0.5);
      this.createEffects();
    },

    createEffects() {
      this.effects.feedbackDelay.effect = new Tone.FeedbackDelay(0, 0);
      this.effects.pitchShift.effect = new Tone.PitchShift(0);
      this.effects.baby.effect = new Tone.Player(this.effects.baby.file);
    },

    toggleEffect(effect) {
      const e = this.effects[effect];
      console.log(e);
      console.log(e.effect);

      if (e.on) {
        if (e.mic) this.mic.connect(e.effect);

        if (e.file) {
          e.effect.loop = true
          e.effect.start();
        }

        e.effect.connect(this.destination);
      } else {
        if (e.mic) this.mic.disconnect(e.effect);

        if (e.file) {
          e.effect.stop();
        }

        e.effect.disconnect(this.destination);
      }
    },

    adjuctEffect(effect) {
      const e = this.effects[effect];
      e.effect.set(e.params);
    },

    toggleFeedback() {
      console.log(this.feedbackMe);
      if (this.feedbackMe) {
        this.mic.connect(this.feedbackDelay);
        this.feedbackDelay.connect(this.destination);
      } else {
        this.mic.disconnect(this.feedbackDelay);
        this.feedbackDelay.disconnect(this.destination);
      }
    },
    adjustFeedback() {
      console.log(this.feedbackMeDelay, this.feedbackMeFeedback);
      this.feedbackDelay.set({
        delayTime: this.feedbackMeDelay,
        feedback: this.feedbackMeFeedback,
      });
    },
  },
});
</script>

<style scoped></style>

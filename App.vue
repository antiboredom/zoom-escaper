<template>
  <div class="container">
    <h1>Zoom Escaper</h1>
    <p class="about">
      Zoom Escaper is a simple tool to help you escape Zoom meetings and other videoconferencing
      scenarios. It allows you to self-sabotage your audio stream, making your presence unbearable
      to others. Zoom Escaper works in Chrome only, and is made by <a href="https://lav.io">Sam Lavigne</a>.
    </p>

    <div v-if="permission">
      <p class="instructions">
        <strong>Quick Setup:</strong> Install
        <a href="https://vb-audio.com/Cable/" target="_blank">VB-Cable</a> (donationware, no
        affiliation with Zoom Escaper), then set your microphone to "VB-Cable" in your Zoom
        settings. Preview what you sound like by selecting your headphones as the ouput, then when
        ready, switch the output to "VB-Cable".
      </p>

      <div v-if="hasSink">
        <div class="devices">
          <label for="input-device">Microphone</label>
          <select id="input-device" v-model="inputDevice" @change="changeDevice">
            <option v-for="input in inputs" :value="input.value">
              {{ input.text }}
            </option>
          </select>
        </div>

        <div class="devices">
          <label for="output-device">Output</label>
          <select id="output-device" v-model="outputDevice" @change="changeDevice">
            <option v-for="output in outputs" :value="output.value">
              {{ output.text }}
            </option>
          </select>
        </div>

        <div class="start-holder">
          <button @click="start">{{ running ? "Stop" : "Start" }}</button>
        </div>

        <div class="effects" :class="{ disabled: !running }">
          <div class="effect" v-for="e in effects" :class="{ active: e.on }">
            <div class="toggle">
              <input
                type="checkbox"
                :disabled="!running"
                v-model="e.on"
                @change="toggle(e)"
                :id="e.label"
              /><label :for="e.label">{{ e.label }}</label>
            </div>
            <div class="params">
              <div v-for="param in e.params" class="param">
                <label>{{ param.label }}</label>
                <input
                  type="range"
                  :min="param.min"
                  :max="param.max"
                  step="0.01"
                  v-model="param.val"
                  @change="adjust(e)"
                  :disabled="!running"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <div class="start-holder">
        <button @click="enableMic">Enable Microphone</button>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import * as Tone from "tone";
import effects from "./effects";

export default Vue.extend({
  async created() {
    const permissions = await navigator.permissions.query({ name: "microphone" });
    this.permission = permissions.state === "granted";
    if (this.permission) {
      this.enableMic();
    }
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
      permission: false,
    };
  },
  methods: {
    async enableMic() {
      this.getDevices();

      for (let e of effects) {
        const effect = {
          label: e.label,
          type: e.type,
          params: e.params,
          on: false,
        };
        this.effects.push(effect);
      }
    },

    async getDevices() {
      const sink = Audio.prototype.setSinkId;
      this.hasSink = sink ? true : false;

      if (!sink) {
        return false;
      }
      this.mic = new Tone.UserMedia();

      if (!this.permission) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        } catch (e) {
          console.log(e);
          this.permission = false;
          return false;
        }
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
      this.permission = true;
    },

    async startAudio() {
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

      Tone.setContext(this.context);

      this.mic = new Tone.UserMedia();
      this.mic.open(this.inputDevice);
      this.mic.connect(this.destination);

      // actually instantiate the tone effects now that everything else is good to go
      for (let e of effects) {
        if (e.type === "mic") {
          const params = e.params.map((p) => p.val);
          e.effect = new Tone[e.function](...params);
        } else if (e.type === "file") {
          e.effect = new Tone.Player(e.file);
        }
      }

      this.running = true;
    },

    async start() {
      if (!this.running) {
        this.startAudio();
      } else {
        this.running = false;
        this.mic.close();
        this.audio = null;
        this.context.close();
        this.destination = null;
      }
    },

    async changeDevice() {
      if (this.running) {
        console.log(this.effects.filter((e) => e.on));
        this.effects
          .filter((e) => e.on)
          .forEach((e) => {
            e.on = false;
            this.toggle(e);
          });
        this.startAudio();
      }
    },

    toggle(effect) {
      const toneEffect = effects.find((e) => e.label === effect.label).effect;

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
      const toneEffect = effects.find((e) => e.label === effect.label).effect;
      let params = {};
      for (const p of effect.params) {
        params[p.key] = p.val;
      }
      toneEffect.set(params);
    },
  },
});
</script>

<style>
body {
}

body,
select,
button,
input {
  font-size: 18px;
  font-family: serif;
}

.container {
  max-width: 900px;
  margin: auto;
}

h1 {
  font-weight: normal;
  font-size: 50px;
  margin: 0;
}

p {
  margin: 0;
}

p,
h1 {
  margin-bottom: 30px;
}

a {
  color: red;
}

.instructions {
  border: 1px solid red;
  padding: 20px;
}

.start-holder {
  text-align: center;
  margin: 20px 0px;
}
button {
  font-size: 30px;
}
.devices {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  margin: 10px 0px;
}

.effects {
  display: grid;
  /* grid-template-columns: 1fr 1fr 1fr; */
  grid-template-columns: repeat(12, 1fr);
  grid-gap: 20px;
}
.effect {
  padding: 20px;
  border: 1px solid #000;
  grid-column: span 6;
}

.effect:nth-child(1),
.effect:nth-child(2) {
  grid-column: span 6;
}

.param {
  display: grid;
  grid-template-columns: 1fr 2fr;
  align-items: center;
  margin: 10px 0px;
}
.toggle {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  grid-gap: 5px;
  font-size: 20px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 5px;
  margin-bottom: 5px;
}

.disabled {
  opacity: 0.5;
}

.active {
  background-color: lightgreen;
}
</style>

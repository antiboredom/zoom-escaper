<template>
  <div class="container">
    <header>
      <img src="images/logo.png" class="logo" />
      <div>
        <h1>Zoom Escaper</h1>

        <p class="about">
          Zoom Escaper is a simple tool to help you escape Zoom meetings and other videoconferencing
          scenarios. It allows you to self-sabotage your audio stream, making your presence
          unbearable to others.
        </p>
      </div>
    </header>

    <div class="instructions">
      <h2>Instructions</h2>
      <p>
        Zoom Escaper only works in Chrome on desktop, and requires a secondary piece of software
        called VB-Cable.
      </p>
      <ol>
        <li v-if="!permission">
          ENABLE microphone access on this site by clicking the big "Enable Microphone" button (you
          only need to do this once).
        </li>
        <li>
          INSTALL <a href="https://vb-audio.com/Cable/" target="_blank">VB-Cable</a
          ><span class="hidden"
            >*
            <div>VB-Cable is donationware, and has no affilition with Zoom Escaper</div></span
          >
          and when the installation is complete, refresh this website.
        </li>
        <li>
          PREVIEW your sound by switching the Output dropdown on this site to your computer speakers
          or headphones. Experiment with audio settings for your meeting.
        </li>
        <li>START YOUR ZOOM CALL and switch the Output on this page to "VB-Cable".</li>
        <li>IN ZOOM set your microphone to "VB-Cable".</li>
        <li>
          TURNING IT OFF: Deactivate the Zoom Escaper by switching the microphone settings in Zoom
          back to your computer's mic, and exit this website.
        </li>
      </ol>
      <p>
        Warning: During your Zoom call, only your coworkers will be able to hear the audio
        interference applied to your voice. You will not be able to hear it yourself. Ensure that
        you preview the use of this tool before deployment.
      </p>
    </div>

    <div v-if="permission">
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
              />
              <label :for="e.label">{{ e.label }}</label>
              <img :src="e.icon" />
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

    <footer>
      Zoom Escaper is made by <a href="https://lav.io">Sam Lavigne</a>. View the code
      <a href="https://github.com/antiboredom/zoom-escaper">here</a>. Also see
      <a href="https://antiboredom.github.io/zoom-deleter">Zoom Deleter</a>.
    </footer>
  </div>
</template>

<script>
import Vue from "vue";
import * as Tone from "tone";
import effects from "./effects";

class VolumeEffect {
  constructor(dest) {
    this.dest = dest;
    this.suspended = false;
    this.frequency = 500;
    this.active = false;
  }

  start() {
    if (this.active) {
      this.timeout = setTimeout(() => {
        if (this.suspended) {
          this.dest.context.resume();
          this.suspended = false;
        } else {
          this.dest.context.suspend();
          this.suspended = true;
        }
        this.start();
      }, parseInt(Math.random() * this.frequency));
    }
  }

  connect() {
    this.active = true;
    clearTimeout(this.timeout);
    this.start();
  }

  disconnect() {
    this.active = false
    clearTimeout(this.timeout);
  }

  set(params) {
    clearTimeout(this.timeout);
    this.frequency = params.frequency;
    if (this.active) {
      this.start();
    }
  }
}

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
          icon: e.icon,
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
        } else {
          e.effect = new VolumeEffect(this.destination);
        }
      }

      this.running = true;
    },

    async start() {
      if (!this.running) {
        this.startAudio();
      } else {
        this.effects
          .filter((e) => e.on)
          .forEach((e) => {
            e.on = false;
            this.toggle(e);
          });
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
* {
  box-sizing: border-box;
}
body {
  background-image: url("images/bg-left.gif"), url("images/bg-right.gif");
  background-position: left center, right center;
  background-repeat: no-repeat, no-repeat;
  background-attachment: fixed, fixed;
  background-size: auto 100%, auto 100%;
  margin: 0;
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
  /* background-color: rgba(255, 255, 255, 0.9); */
  background-color: #fff;
  padding: 30px;
  /* border: 5px solid red; */
  /* border: 5px solid rgb(77, 135, 246);; */
  border-width: 0px 5px;
}

h1 {
  font-weight: normal;
  font-size: 50px;
  margin: 0;
  margin-bottom: 20px;
}

h2 {
  font-weight: normal;
  margin: 0;
}

.logo {
  /* height: 200px; */
  /* margin: auto; */
  /* margin-bottom: 20px; */
  display: block;
  width: 100%;
}

p {
  margin: 0;
}

header {
  display: grid;
  grid-template-columns: 200px 1fr;
  text-align: left;
  margin-bottom: 20px;
  grid-gap: 20px;
}

a {
  color: red;
}

.instructions {
  border: 1px solid red;
  padding: 20px;
  margin-bottom: 30px;
  font-size: 0.9em;
}

ul {
  margin: 0;
  padding: 0;
}

li {
  margin: 5px 0px;
}

/* p, */
/* h1, */
/* footer { */
/*   text-align: center; */
/* } */

.about {
  font-size: 1.2em;
}

footer {
  padding: 20px 0px;
  font-size: 0.8em;
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
  grid-template-columns: auto 1fr 40px;
  align-items: center;
  grid-gap: 5px;
  font-size: 20px;
  border-bottom: 1px solid #ccc;
  padding-bottom: 5px;
  margin-bottom: 5px;
}

.toggle img {
  width: 100%;
}

.disabled {
  opacity: 0.5;
}

.active {
  background-color: #d4efff;
  border-color: red;
}

.hidden {
  position: relative;
  cursor: help;
}

.hidden div {
  position: absolute;
  background-color: #fff;
  border: 1px solid #000;
  width: 180px;
  padding: 10px;
  z-index: 1;
  display: none;
  left: 10px;
  top: 10px;
  font-size: 14px;
}

.hidden:hover div {
  display: block;
}

.use-me {
  position: absolute;
  left: 0;
  top: 0;
  transform: rotate(-20deg);
}

/* label, .effect, .about, .instructions { */
/*   background-color: #fff; */
/* } */
</style>

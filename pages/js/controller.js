const VJC = [];
const ch1 = 1;
const ch2 = 2;
window.addEventListener("load", () => {
  const eventHandlers = {
    onChangeVideo: (channel, videoId) => {
      document.querySelector("#loadedVideoId").value = videoId;
      VJC[channel].unMute();
      VJC[channel == ch1 ? ch2 : ch1].mute();
    },
    onSuspendPreview: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .suspend`);
      overlay.classList.remove("hidden");
    },
    onResumePreview: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .suspend`);
      overlay.classList.add("hidden");
    },
    onSyncStart: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .syncing`);
      overlay.classList.remove("hidden");
    },
    onSyncEnd: (channel) => {
      const overlay = document.querySelector(`.deck.ch${channel} .syncing`);
      overlay.classList.add("hidden");
    },
  };

  VJC[ch1] = new VJController(1, { events: eventHandlers, autoplay: true });
  VJC[ch2] = new VJController(2, { events: eventHandlers });

  const relayElement = document.querySelector("#videoId");

  var observer = new MutationObserver(() => {
    console.log("YTVJ:C 変更検知(videoId)");
    changeVideo(relayElement.value);
  });

  observer.observe(relayElement, {
    attributes: true,
    childList: true,
    characterData: true,
  });

  changeVideo(relayElement.value);
  calcOpacity();
  OpenProjectionWindow();
});

var prepareVideoId;
function changeVideo(text) {
  let id;
  if (text.length === 11) {
    id = text;
  } else {
    if (/^(https?:\/\/)[^\s$.?#].[^\s]*$/i.test(text)) {
      const url = new URL(text);
      if (url.hostname === "youtu.be") {
        id = url.pathname.substr(1, 11);
      }
      if (url.pathname === "/watch") {
        const params = new URLSearchParams(url.search);
        id = params.get("v");
      }
    }
  }

  if (id) {
    const url = `https://img.youtube.com/vi/${id}/default.jpg`;
    document.querySelector(".yt-thumbnail").src = url;
    document.querySelector("#input-videoId").value = id;
    prepareVideoId = id;
  }
}

function switchVideo() {
  const crossFader = document.querySelector(".crossfader input");
  const dir = -Math.sign(crossFader.value);
  var val = parseFloat(crossFader.value);
  const interval = setInterval(() => {
    val += dir / 50;
    crossFader.value = val;
    calcOpacity();
    if (Math.abs(val) >= 1) {
      clearInterval(interval);
    }
  }, 10);
}

function setLSpeed(val) {
  val = parseFloat(val);
  VJC[ch1].setData("speed", val);
  document.querySelector(".deck.left .speed input[type=range]").value =
    val.toFixed(2);
  document.querySelector(".deck.left .speed input[type=number]").value =
    val.toFixed(2);
}

function setRSpeed(val) {
  val = parseFloat(val);
  VJC[ch2].setData("speed", val);
  document.querySelector(".deck.right .speed input[type=range]").value =
    val.toFixed(2);
  document.querySelector(".deck.right .speed input[type=number]").value =
    val.toFixed(2);
}

function calcOpacity() {
  var l = parseFloat(document.querySelector("#Lopacity").value);
  var r = parseFloat(document.querySelector("#Ropacity").value);
  var s = parseFloat(document.querySelector("#cross-fader").value);
  if (s < 0) {
    VJC[ch1].setData("zIndex", 0);
    VJC[ch2].setData("zIndex", 1);
    r *= (1 - Math.abs(s)) * 0.5;
  } else {
    VJC[ch1].setData("zIndex", 1);
    VJC[ch2].setData("zIndex", 0);
    l *= (1 - Math.abs(s)) * 0.5;
  }
  VJC[ch1].setData("opacity", l);
  VJC[ch2].setData("opacity", r);
}

function OpenProjectionWindow() {
  window.open("./projection.html", "Projection", "width=640,height=360");
}

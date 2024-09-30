var LPlayer, RPlayer;
window.addEventListener("load", () => {
  const onChangeVideoHandler = (videoId) => {
    document.querySelector("#loadedVideoId").value = videoId;
  };

  LPlayer = new VJController(1, {
    onChangeVideo: onChangeVideoHandler,
    onSuspendPreview: () => {
      const overlay = document.querySelector(".deck.left .suspend");
      overlay.classList.remove("hidden");
    },
    onResumePreview: () => {
      const overlay = document.querySelector(".deck.left .suspend");
      overlay.classList.add("hidden");
    },
    onSyncStart: () => {
      const overlay = document.querySelector(".deck.left .syncing");
      overlay.classList.remove("hidden");
    },
    onSyncEnd: () => {
      const overlay = document.querySelector(".deck.left .syncing");
      overlay.classList.add("hidden");
    },
  });

  RPlayer = new VJController(2, {
    onChangeVideo: onChangeVideoHandler,
    onSuspendPreview: () => {
      const overlay = document.querySelector(".deck.right .suspend");
      overlay.classList.remove("hidden");
    },
    onResumePreview: () => {
      const overlay = document.querySelector(".deck.right .suspend");
      overlay.classList.add("hidden");
    },
    onSyncStart: () => {
      const overlay = document.querySelector(".deck.right .syncing");
      overlay.classList.remove("hidden");
    },
    onSyncEnd: () => {
      const overlay = document.querySelector(".deck.right .syncing");
      overlay.classList.add("hidden");
    },
  });

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
  LPlayer.setData("speed", val);
  document.querySelector(".deck.left .speed input[type=range]").value =
    val.toFixed(2);
  document.querySelector(".deck.left .speed input[type=number]").value =
    val.toFixed(2);
}

function setRSpeed(val) {
  val = parseFloat(val);
  RPlayer.setData("speed", val);
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
    LPlayer.setData("zIndex", 0);
    RPlayer.setData("zIndex", 1);
    r *= (1 - Math.abs(s)) * 0.5;
  } else {
    LPlayer.setData("zIndex", 1);
    RPlayer.setData("zIndex", 0);
    l *= (1 - Math.abs(s)) * 0.5;
  }
  LPlayer.setData("opacity", l);
  RPlayer.setData("opacity", r);
}

function OpenProjectionWindow() {
  window.open("./projection.html", "Projection", "width=640,height=360");
}

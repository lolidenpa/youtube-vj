var LPlayer, RPlayer;
window.addEventListener("load", () => {
  LPlayer = new VJController("leftPlayer", {
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

  RPlayer = new VJController("rightPlayer", {
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
  setLSpeed(1);
  setRSpeed(1);
  OpenProjectionWindow();
});

var prepareVideoId;
function changeVideo(id) {
  if (id.length === 11) {
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
    LPlayer.setData("z-index", 0);
    RPlayer.setData("z-index", 1);
    r *= (1 - Math.abs(s)) * 0.5;
  } else {
    LPlayer.setData("z-index", 1);
    RPlayer.setData("z-index", 0);
    l *= (1 - Math.abs(s)) * 0.5;
  }
  LPlayer.setData("opacity", l);
  RPlayer.setData("opacity", r);
}

function OpenProjectionWindow() {
  window.open("./projection.html", "Projection", "width=640,height=360");
}

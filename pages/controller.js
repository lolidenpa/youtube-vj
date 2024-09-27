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
});

var prepareVideoId;
function changeVideo(id) {
  document.querySelector(
    ".yt-thumbnail"
  ).src = `https://img.youtube.com/vi/${id}/default.jpg`;
  prepareVideoId = id;
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

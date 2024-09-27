var LPlayer, RPlayer;
window.addEventListener("load", () => {
  LPlayer = new VJController("leftPlayer");
  RPlayer = new VJController("rightPlayer");

  var observer = new MutationObserver(function () {
    console.log("YTVJ:C 変更検知(videoId)");
    const videoId = document.getElementById("videoId").value;
    changeVideo(videoId);
  });

  /** 監視対象の要素オブジェクト */
  const elem = document.getElementById("videoId");

  /** 監視時のオプション */
  const config2 = {
    attributes: true,
    childList: true,
    characterData: true,
  };

  /** 要素の変化監視をスタート */
  observer.observe(elem, config2);

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

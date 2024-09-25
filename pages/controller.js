/**
 * 【VJ側】画面切替
 */

var LPlayer,
  RPlayer,
  feder = {};
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

  feder = {
    left: document.querySelector("#Lopacity").value,
    right: document.querySelector("#Ropacity").value,
    switch: document.querySelector("#horizontal-fader").value,
  };
  console.log(feder);
  calcOpacity();
});

var prepareVideoId;
function changeVideo(id) {
  document.querySelector(
    ".yt-thumbnail"
  ).src = `https://img.youtube.com/vi/${id}/default.jpg`;
  document.querySelector(".videoId").innerText = id;
  prepareVideoId = id;
}
function setLOpacity(value) {
  feder.left = value;
  calcOpacity();
}

function setROpacity(value) {
  feder.right = value;
  calcOpacity();
}

function setLROpacity(value) {
  feder.switch = value;
  calcOpacity();
}

function calcOpacity() {
  var l = feder.left;
  var r = feder.right;
  var s = feder.switch;
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

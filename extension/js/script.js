const urls = {
  youtubeOrigin: "https://www.youtube.com",
  previewPage: "https://srv-rpi4-main.kazuprog.work/youtube-vj/preview.html",
  controllerPage:
    "https://srv-rpi4-main.kazuprog.work/youtube-vj/controller.html",
};
/**
 * YTVJ:EY YouTube-VJ:Extension:YouTube
 * YTVJ:EP YouTube-VJ:Extension:Preview
 * YTVJ:EC YouTube-VJ:Extension:Control
 */

if (location.origin == urls.youtubeOrigin) {
  var currentUrl = null;
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      // URLが変更されていなけれな何もしない
      if (window.location.href === currentUrl) {
        return;
      }

      currentUrl = window.location.href;

      // 動画ページじゃなければ何もしない
      if (location.pathname !== "/watch") {
        return;
      }

      // YouTube 動画IDを取得
      let urlParam = window.location.search;
      let params = new URLSearchParams(urlParam);
      let videoId = params.get("v");

      chrome.storage.local.set({ videoId: videoId }).then(() => {
        console.log(`【YTVJ:EY】動画変更検知 videoId:${videoId}`);
      });
    });
  });

  observer.observe(document, { subtree: true, childList: true });
}

if (location.href == urls.controllerPage) {
  window.addEventListener("load", () => {
    chrome.storage.local.get("videoId", function (items) {
      console.log("【YTVJ:E】Storage読(videoId)");
      document.querySelector("#videoId").value = items.videoId;
    });
  });

  console.log("【YTVJ:E】Storage待(videoId)");
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.videoId) {
      console.log("【YTVJ:E】Storage読(videoId)");
      document.querySelector("#videoId").value = changes.videoId.newValue;
    }
  });

  prepareObserver(document.querySelector("#leftPlayerData"), (data) => {
    chrome.storage.local.set({ leftPlayerData: data }).then(() => {
      console.log(`【YTVJ:E】変更検知(leftPlayerData) >Storage`);
    });
  });

  prepareObserver(document.querySelector("#rightPlayerData"), (data) => {
    chrome.storage.local.set({ rightPlayerData: data }).then(() => {
      console.log(`【YTVJ:E】変更検知(rightPlayerData) >Storage`);
    });
  });
}

if (location.href == urls.previewPage) {
  window.addEventListener("load", () => {
    chrome.storage.local.get("leftPlayerData", function (items) {
      console.log("【YTVJ:P】Storage読(leftPlayerData)");
      document.querySelector("#leftPlayerData").value = JSON.stringify(
        items.leftPlayerData || {}
      );
    });
    chrome.storage.local.get("rightPlayerData", function (items) {
      console.log("【YTVJ:P】Storage読(rightPlayerData)");
      document.querySelector("#rightPlayerData").value = JSON.stringify(
        items.rightPlayerData || {}
      );
    });
  });

  console.log("【YTVJ:P】Storage待(leftPlayerData)");
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.leftPlayerData) {
      console.log("【YTVJ:P】Storage読(leftPlayerData)");
      document.querySelector("#leftPlayerData").value = JSON.stringify(
        changes.leftPlayerData.newValue
      );
    }
  });
  console.log("【YTVJ:P】Storage待(rightPlayerData)");
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.rightPlayerData) {
      console.log("【YTVJ:P】Storage読(rightPlayerData)");
      document.querySelector("#rightPlayerData").value = JSON.stringify(
        changes.rightPlayerData.newValue
      );
    }
  });
}

function prepareObserver(element, callback) {
  var observer = new MutationObserver(() => {
    callback(JSON.parse(element.value));
  });

  observer.observe(element, {
    attributes: true,
    childList: true,
    characterData: true,
  });
}

/**
 * 時刻を秒数に変換
 * @param {*} t 時刻 XX:XX
 * @returns 経過時間
 */
function convPlayTimeToSecond(t) {
  const words = t.split(":");
  idx = words.length - 1;
  second = Number(words[idx]); // 秒
  second += Number(words[idx - 1]) * 60; // 分
  if (idx == 2) {
    second += Number(words[idx - 2]) * 3600; // 時間
  }
  return second;
}

/**
 * 現在のシステム時刻を取得
 * @returns int
 */
function now_milsecond() {
  var date = new Date();
  // UNIXタイムスタンプを取得する (ミリ秒単位)
  return date.getTime();
}

/**
 * 【拡張機能】送信操作(Control+X)後、直近の再生時間変更時にデータ送信する
 */
function launch() {
  if (
    document.querySelector("#movie_player").classList.contains("paused-mode") ==
    true
  ) {
    // 一時停止中の場合、即時送信
    shoot();
  } else {
    // 再生中の場合は、現在の再生時間 N + 1 のタイミングで送信
    clickSettingButton();
    clickSettingButton();
    const observer = new MutationObserver(() => shoot());
    observer.observe(
      document.querySelector(
        "#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > div.ytp-time-display.notranslate > span:nth-child(2) > span.ytp-time-current"
      ),
      { childList: true, subtree: true }
    );
  }
}

function shoot(delay) {
  if (!isSended) {
    let unixTime = now_milsecond();
    let urlParam = window.location.search;
    let params = new URLSearchParams(urlParam);
    let v = params.get("v");

    element = document.querySelector(
      "#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-left-controls > div.ytp-time-display.notranslate > span:nth-child(2) > span.ytp-time-current"
    );
    let t = convPlayTimeToSecond(element.textContent);

    chrome.storage.local
      .set({
        videoId: v,
        targetTime: t,
        systemUnixTime: now_milsecond(),
      })
      .then(() => {
        console.log(`【拡張機能】storage書込完了 v=${v} 開始位置=${t}`);
      });
    isSended = true;
  }
}

/**
 * 設定ボタンをクリック
 */
function clickSettingButton() {
  document
    .querySelector(
      "#movie_player > div.ytp-chrome-bottom > div.ytp-chrome-controls > div.ytp-right-controls > button.ytp-button.ytp-settings-button"
    )
    .click();
}

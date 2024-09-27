class VJController {
  _data = {
    videoId: "BLeUas72Mzk",
    pause: false,
    opacity: 1,
    "z-index": 0,
    speed: 1,
  };
  _elementId;
  _event;
  _pausePreview = false;

  constructor(elementId, event = {}) {
    this._elementId = elementId;
    this._event = event;
    this.player = new VJPlayer(elementId, {}, false, {
      onStateChange: (e) => {
        this._onPlayerStateChange(e);
      },
    });

    localStorage.removeItem(this._elementId);
  }

  _isChangeTiming = false;
  _onPlayerStateChange(e) {
    /**
     * 3: BUFFERING
     * 5: CUED
     * 0: ENDED
     * 2: PAUSED
     * 1: PLAYING
     *-1: UNSTARTED
     */
    /**
     * 動画変更時
     * PAUSED -> UNSTARTED -> BUFFERING -> UNSTARTED -> BUFFERING -> PLAYING
     * 再生位置変更時の遷移
     * PAUSED -> BUFFERING -> PLAYING
     * 動画終了時(自動再生)
     * ENDED -> PLAYING -> BUFFERING -> PLAYING
     */
    // 再生位置変更(単純なローディングはしらん)
    if (e.data == YT.PlayerState.BUFFERING) {
      this.setData("pause", false);
    }
    // 動画変更時は自動再生、タイミング通知
    if (e.data == YT.PlayerState.UNSTARTED) {
      this.setData("pause", false);
      this._isChangeTiming = true;
    }
    if (e.data == YT.PlayerState.PAUSED) {
      if (this._pausePreview) {
        return;
      }
      this.setData("pause", true);
      this._isChangeTiming = true;
    }

    if (e.data == YT.PlayerState.ENDED) {
      this._isChangeTiming = true;
    }

    if (e.data == YT.PlayerState.PLAYING) {
      // 再生されたらプレビューの一時停止は解除
      if (this._pausePreview) {
        if (this._event.onResumePreview) {
          this._event.onResumePreview();
        }
        this._pausePreview = false;
      }
      if (this._isChangeTiming) {
        this._setTiming();
        this._isChangeTiming = false;
      } else {
        this.player.__syncTiming();
      }
    }
  }

  _setTiming() {
    console.log("setTiming");
    this.setData("timing", {
      timestamp: +new Date() / 1000,
      playerTime: this.player.player.getCurrentTime(),
    });
  }

  setData(key, value) {
    this._data[key] = value;
    if (key === "speed") {
      // 速度変更なら、タイミング情報も送信
      setTimeout(() => {
        this._setTiming();
      }, 100);
    }

    localStorage.setItem(this._elementId, JSON.stringify(this._data));

    // カスタムイベントを作成して発火
    document.dispatchEvent(
      new CustomEvent("VJPlayerUpdated", {
        detail: {
          key: this._elementId,
          value: JSON.stringify(this._data),
        },
      })
    );
  }

  suspendPreview() {
    if (!this._pausePreview) {
      if (this._event.onSuspendPreview) {
        this._event.onSuspendPreview();
      }
      this._pausePreview = true;
    }
    this.player._syncing = false;
    this.player.player.pauseVideo();
  }

  resumePreview() {
    this.player.player.playVideo();
  }

  adjustTiming(sec) {
    this.setData("timing", {
      timestamp: this._data.timing.timestamp,
      playerTime: this._data.timing.playerTime + sec,
    });
  }
}

class VJPlayer {
  player = null;
  _elementId = null;
  _isViewer = null;
  _data = {};
  _events = {};

  constructor(elementId, data = {}, viewer = false, events = {}) {
    this._events = events;
    this._elementId = elementId;
    this._isViewer = viewer;
    data = {
      speed: 1,
      pause: false,
      timing: {
        timestamp: 0,
        playerTime: 0,
      },
      videoId: "BLeUas72Mzk", //【フリー動画素材】ローディング動画4秒【ダウンロード可能】
      ...data,
    };

    this.player = new YT.Player(elementId, {
      videoId: data.videoId,
      events: {
        onReady: (e) => {
          this._onPlayerReady(e);
        },
        onStateChange: (e) => {
          this._onPlayerStateChange(e);

          if (this._events.onStateChange) {
            this._events.onStateChange(e);
          }
        },
      },
      playerVars: {
        autoplay: 1, // 自動再生
        fs: 0, // 全画面表示ボタンを非表示
        iv_load_policy: 3, // アノテーション無効
      },
    });

    this._data = data;
    console.log(data);
  }

  _onPlayerReady(event) {
    console.log(`YTVJ:P YouTube Player Ready`);

    event.target.mute();

    document.addEventListener("VJPlayerUpdated", (event) => {
      if (event.detail.key === this._elementId) {
        const data = JSON.parse(event.detail.value);
        for (const key in data) {
          this.__applyData(key, data[key]);
        }
      }
    });

    // 初回データ読み込み
    document.dispatchEvent(
      new CustomEvent("VJPlayerUpdated", {
        detail: {
          key: this._elementId,
          value: localStorage.getItem(this._elementId),
        },
      })
    );
  }

  __applyData(key, value) {
    if (JSON.stringify(this._data[key]) === JSON.stringify(value)) {
      return;
    }
    console.log(`YTVJ:P 設定適用 ${key} = ${JSON.stringify(value)}`);
    this._data[key] = value;
    switch (key) {
      case "videoId":
        this.player.loadVideoById(value);
        break;
      case "pause":
        if (value === true) {
          this.player.pauseVideo();
        } else {
          this.player.playVideo();
        }
        break;
      case "timing":
        this.player.playVideo();
        this.__syncTiming();
        break;
      case "speed":
        this.player.setPlaybackRate(value);
        break;
      case "opacity":
        if (this._isViewer) {
          document.querySelector(`#${this._elementId}`).style.opacity = value;
        }
        break;
      case "z-index":
        if (this._isViewer) {
          document.querySelector(`#${this._elementId}`).style.zIndex = value;
        }
        break;
    }
  }

  _onPlayerStateChange(event) {
    /**
     * 3: BUFFERING
     * 5: CUED
     * 0: ENDED
     * 2: PAUSED
     * 1: PLAYING
     *-1: UNSTARTED
     */
    console.log("ChangeState" + event.data);

    if (event.data == YT.PlayerState.ENDED) {
      event.target.seekTo(0);
      event.target.playVideo();
    }

    if (event.data == YT.PlayerState.PLAYING) {
      // 新動画読み込み時は自動再生されるっぽい？
      // 一時停止中にPreviewリロードで再生される対策
      if (this._data.pause) {
        this.player.pauseVideo();
        return;
      }
      if (this._isViewer) {
        this.__syncTiming();
      }
    }
  }

  _syncing = false;
  __syncTiming() {
    if (this._syncing) return;

    // コントローラーからデータを受け取っていない
    if (this._data.timing.timestamp == 0) return;

    this._syncing = true;
    console.log(`YTVJ:P 同期処理`);

    const process = () => {
      if (this._data.pause) {
        this._syncing = false;
        return;
      }
      const timing = this._data.timing;
      const elapsedRealTime = new Date() / 1000 - timing.timestamp;

      const expectPlayerTime =
        timing.playerTime + elapsedRealTime * this._data.speed;

      if (this.player.getDuration() < expectPlayerTime) {
        // 計算上の再生位置が動画の長さよりも長ければ同期中止
        this.player.setPlaybackRate(this._data.speed);
        this._syncing = false;
        console.log(`YTVJ:P 同期中止`);
      } else {
        const syncOffset = expectPlayerTime - this.player.getCurrentTime();

        console.log(`YTVJ:P ズレ：${parseInt(syncOffset * 1000)}ms`);
        if (Math.abs(syncOffset) < 0.01) {
          this.player.setPlaybackRate(this._data.speed);
          this._syncing = false;
          console.log(`YTVJ:P 同期完了`);
        } else if (Math.abs(syncOffset) > 5) {
          this.player.setPlaybackRate(this._data.speed);
          this.player.seekTo(expectPlayerTime + 1);
          this._syncing = false;
          console.log(`YTVJ:P 強制同期`);
        } else {
          const offsetSpd =
            Math.sign(syncOffset) * Math.max(0.1, Math.abs(syncOffset));
          this.player.setPlaybackRate(this._data.speed + offsetSpd);
        }
      }
      if (this._syncing) {
        setTimeout(() => {
          process();
        }, 100);
      }
    };
    process();
  }
}

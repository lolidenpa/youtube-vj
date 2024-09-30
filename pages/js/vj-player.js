class VJPlayer {
  player = null;
  _elementId = null;
  _localStorageKey = null;
  _isViewer = null;
  _data = {};
  _events = {};

  constructor(channel, data = {}, viewer = false, events = {}) {
    this._events = events;
    this._elementId = `vj_player_ch${channel}`;
    this._localStorageKey = `ytvj_ch${channel}`;
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

    this.player = new YT.Player(this._elementId, {
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
      if (event.detail.key === this._localStorageKey) {
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
          key: this._localStorageKey,
          value: localStorage.getItem(this._localStorageKey),
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

    if (this._events.onSyncStart) {
      this._events.onSyncStart();
    }
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
        this._syncing = false;
        console.log(`YTVJ:P 同期中止`);
      } else {
        const syncOffset = expectPlayerTime - this.player.getCurrentTime();

        console.log(`YTVJ:P ズレ：${parseInt(syncOffset * 1000)}ms`);
        if (Math.abs(syncOffset) < 0.01) {
          this._syncing = false;
          console.log(`YTVJ:P 同期完了`);
        } else if (Math.abs(syncOffset) > 5) {
          this.player.seekTo(expectPlayerTime + 0.5);
          //this._syncing = false;
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
      } else {
        this.player.setPlaybackRate(this._data.speed);
        if (this._events.onSyncEnd) {
          this._events.onSyncEnd();
        }
      }
    };
    process();
  }
}

class VJController {
  _isSeeked = false;
  _pausePreview = false;
  constructor(elementId, data = {}) {
    this.player = new VJPlayer(elementId, data, false, {
      onReady: (e) => {
        this._onPlayerReady(e);
      },
      onStateChange: (e) => {
        this._onPlayerStateChange(e);
      },
    });
    this._dataElement = document.querySelector(`#${elementId}Data`);
    this.setData("videoId", "BLeUas72Mzk");
    this.setData("pause", false);
  }
  _onPlayerReady(e) {}

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
    console.log(e.data);
    /**
     * 動画変更時
     * PAUSED -> UNSTARTED -> BUFFERING -> UNSTARTED -> BUFFERING -> PLAYING
     * 再生位置変更時の遷移
     * PAUSED -> BUFFERING -> PLAYING
     */
    // 再生位置変更(単純なローディングはしらん)
    if (e.data == YT.PlayerState.BUFFERING) {
      this.setData("pause", false);
      this._isSeeked = true;
    }
    // 動画変更時は自動再生
    if (e.data == YT.PlayerState.UNSTARTED) {
      this.setData("pause", false);
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
      this._pausePreview = false;
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
    const dataElement = this._dataElement;
    var data = this._loadData();
    data[key] = value;
    if (key === "speed") {
      // 速度変更なら、タイミング情報も送信
      setTimeout(() => {
        this._setTiming();
      }, 100);
    }
    dataElement.value = JSON.stringify(data);
  }

  pausePreview() {
    this._pausePreview = true;
    this.player._syncing = false;
    this.player.player.pauseVideo();
  }

  _loadData() {
    const dataElement = this._dataElement;
    return JSON.parse(dataElement.value);
  }

  seekTo(target) {
    this._isSeek = true;

    this.player.seekTo(target, true);
    this._setTiming();
  }

  adjustTiming(sec) {
    var data = this._loadData();
    this.setData("timing", {
      timestamp: data.timing.timestamp,
      playerTime: data.timing.playerTime + sec,
    });
  }
}

class VJPlayer {
  player = null;
  _elementId = null;
  _isViewer = null;
  _dataElement = null;
  _data = {};
  _events = {};
  __isYTPlayerReady = false;

  constructor(elementId, data = {}, viewer = false, events = {}) {
    this._events = events;
    this._elementId = elementId;
    this._isViewer = viewer;
    data = {
      speed: 1,
      pause: true,
      timing: {
        timestamp: new Date() / 1000,
        playerTime: 0,
      },
      videoId: "aaa",
      ...data,
    };

    this.player = new YT.Player(elementId, {
      videoId: "BLeUas72Mzk", //【フリー動画素材】ローディング動画4秒【ダウンロード可能】
      events: {
        onReady: (e) => {
          this._onPlayerReady(e);

          if (this._events.onReady) {
            this._events.onReady(e);
          }
        },
        onStateChange: (e) => {
          this._onPlayerStateChange(e);

          if (this._events.onStateChange) {
            this._events.onStateChange(e);
          }
        },
      },
      playerVars: {
        rel: 0, // 関連動画
        controls: this._isViewer ? 0 : 1, // コントロール
        iv_load_policy: 3, // アノテーション無効
      },
    });

    this._dataElement = document.querySelector(`#${elementId}Data`);
    this._data = data;
    console.log(data);
    this.__prepareObserver();
  }

  __prepareObserver() {
    const elem = this._dataElement;

    var observer = new MutationObserver(() => {
      if (!this.__isYTPlayerReady) return;

      console.log(`YTVJ:P 変更検知(${elem.id})`);
      const data = JSON.parse(elem.value);
      for (const key in data) {
        this.__applyData(key, data[key]);
      }
    });

    observer.observe(elem, {
      attributes: true,
      childList: true,
      characterData: true,
    });
  }

  _onPlayerReady(event) {
    console.log(`YTVJ:P YouTube Player Ready`);
    this.__isYTPlayerReady = true;

    event.target.mute();

    const data = JSON.parse(this._dataElement.value);
    for (const key in data) {
      this.__applyData(key, data[key]);
    }
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
      if (this._isViewer) {
        //pausePreview中だと強制同期ループしてしまう
        return;
      }
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
      if (this._syncing) {
        setTimeout(() => {
          process();
        }, 100);
      }
    };
    process();
  }
}

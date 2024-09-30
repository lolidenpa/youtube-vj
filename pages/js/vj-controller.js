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

  constructor(channel, event = {}) {
    this._event = event;
    this.player = new VJPlayer(channel, {}, false, {
      onStateChange: (e) => {
        this._onPlayerStateChange(e);
      },
      onSyncStart: () => {
        if (event.onSyncStart) {
          event.onSyncStart();
        }
      },
      onSyncEnd: () => {
        if (event.onSyncEnd) {
          event.onSyncEnd();
        }
      },
    });
    this._elementId = this.player._elementId;

    localStorage.removeItem(this.player._localStorageKey);
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

    localStorage.setItem(
      this.player._localStorageKey,
      JSON.stringify(this._data)
    );

    // カスタムイベントを作成して発火
    document.dispatchEvent(
      new CustomEvent("VJPlayerUpdated", {
        detail: {
          key: this.player._localStorageKey,
          value: JSON.stringify(this._data),
        },
      })
    );

    if (key === "videoId") {
      if (this._event.onChangeVideo) {
        this._event.onChangeVideo(value);
      }
    }
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

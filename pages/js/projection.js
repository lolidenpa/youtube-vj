var LPlayer, RPlayer;
window.addEventListener("load", () => {
  LPlayer = new VJPlayer(1, { isProjection: true });
  RPlayer = new VJPlayer(2, { isProjection: true });

  window.addEventListener("storage", (event) => {
    document.dispatchEvent(
      new CustomEvent("VJPlayerUpdated", {
        detail: {
          key: event.key,
          value: event.newValue,
        },
      })
    );
  });
});

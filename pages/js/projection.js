var LPlayer, RPlayer;
window.addEventListener("load", () => {
  LPlayer = new VJPlayer(1, {}, true);
  RPlayer = new VJPlayer(2, {}, true);

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

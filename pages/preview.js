var LPlayer, RPlayer;
window.addEventListener("load", () => {
  LPlayer = new VJPlayer("leftPlayer", {}, true);
  RPlayer = new VJPlayer("rightPlayer", {}, true);

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

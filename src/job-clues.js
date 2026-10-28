/* Clean isolated clue pictures. Scene art and hit regions remain unchanged. */
(function (root) {
  "use strict";
  const ids = [
    "key",
    "can",
    "glove",
    "rake",
    "carrot",
    "horseshoe",
    "nest",
    "seeds",
    "strawberry",
    "butterfly",
    "ladybug",
    "shovel",
    "fork",
    "mug",
  ];
  function id(object) {
    return object.name === "Garden fork" ? "fork" : object.id;
  }
  function file(object) {
    const value = id(object);
    if (!ids.includes(value))
      throw Error("Missing clean clue illustration: " + value);
    return "assets/job-clues/" + value + ".webp";
  }
  function art(object) {
    return `<img class="isolated-job-clue" src="${file(object)}" alt="" draggable="false"/>`;
  }
  const api = { ids, id, file, art };
  if (typeof module !== "undefined") module.exports = api;
  root.JobClues = api;
})(typeof globalThis !== "undefined" ? globalThis : this);

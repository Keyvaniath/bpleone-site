// Tiny progressive enhancements. Site works fine without this file.
(function () {
  // Auto-update the year in the footer.
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

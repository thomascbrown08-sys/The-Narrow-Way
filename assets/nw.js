/* The Narrow Way — road navigation (progressive enhancement) */
(function () {
  'use strict';
  var sidebar = document.getElementById('nwSidebar');
  var overlay = document.getElementById('nwOverlay');
  var burger  = document.getElementById('nwBurger');

  function open(){ sidebar && sidebar.classList.add('open'); overlay && overlay.classList.add('open'); }
  function close(){ sidebar && sidebar.classList.remove('open'); overlay && overlay.classList.remove('open'); }

  if (burger)  burger.addEventListener('click', function(){
    sidebar && sidebar.classList.contains('open') ? close() : open();
  });
  if (overlay) overlay.addEventListener('click', close);
  if (sidebar) sidebar.addEventListener('click', function(e){
    if (e.target.closest('a') && window.matchMedia('(max-width:920px)').matches) close();
  });

  // On a landmark page, bring the lit waypoint into view within the road
  var active = sidebar && sidebar.querySelector('.nw-waypoint.is-active');
  if (active && sidebar.scrollHeight > sidebar.clientHeight) {
    var top = active.offsetTop - (sidebar.clientHeight / 2) + (active.offsetHeight / 2);
    sidebar.scrollTop = Math.max(0, top);
  }
})();

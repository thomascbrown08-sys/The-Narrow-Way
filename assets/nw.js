/* The Narrow Way — navigation (progressive enhancement) */
(function () {
  'use strict';
  var sidebar = document.getElementById('nwSidebar');
  var overlay = document.getElementById('nwOverlay');
  var burger  = document.getElementById('nwBurger');

  function openNav(){ sidebar && sidebar.classList.add('open'); overlay && overlay.classList.add('open'); }
  function closeNav(){ sidebar && sidebar.classList.remove('open'); overlay && overlay.classList.remove('open'); }

  if (burger)  burger.addEventListener('click', function(){
    sidebar && sidebar.classList.contains('open') ? closeNav() : openNav();
  });
  if (overlay) overlay.addEventListener('click', closeNav);

  if (sidebar) {
    sidebar.addEventListener('click', function(e){
      var caret = e.target.closest('.nw-caret');
      if (caret) {
        e.preventDefault();
        var branch = caret.closest('.nw-branch');
        var kids = branch && branch.querySelector(':scope > .nw-kids');
        if (kids) {
          var hidden = kids.style.display === 'none';
          kids.style.display = hidden ? '' : 'none';
          caret.classList.toggle('open', hidden);
        }
        return;
      }
      if (e.target.closest('a') && window.matchMedia('(max-width:920px)').matches) closeNav();
    });

    var active = sidebar.querySelector('.nw-twig.is-active');
    if (active && sidebar.scrollHeight > sidebar.clientHeight) {
      var top = active.offsetTop - (sidebar.clientHeight / 2) + (active.offsetHeight / 2);
      sidebar.scrollTop = Math.max(0, top);
    }
  }
})();

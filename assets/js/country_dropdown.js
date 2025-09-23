// ==== Çok seviyeli hover dropdown stabilitesi ====

var $root     = $('.dropdown-root');             // Ürünlerimiz <li>
var $menuRoot = $root.children('.menu-root');    // 1. dropdown
var $subs     = $root.find('.dropdown-sub');     // Oturma/Yatak satırları

var ROOT_DELAY = 160;     // kök kapanma gecikmesi
var SUB_DELAY  = 160;     // alt menü kapanma gecikmesi
var rootTimer  = null;
var subTimers  = new WeakMap(); // her dropdown-sub için ayrı timer

function isDesktop(){ return window.matchMedia('(min-width: 992px)').matches; }

// --- kök aç/kapa (hover)
function openRoot(){
  clearTimeout(rootTimer);
  $root.addClass('open');
}
function closeRoot(){
  clearTimeout(rootTimer);
  rootTimer = setTimeout(function(){ $root.removeClass('open'); }, ROOT_DELAY);
}

// --- sub aç/kapa (hover)
function openSub($sub){
  var t = subTimers.get($sub[0]);
  if(t) clearTimeout(t);

  // ekranın sağında taşarsa sola aç
  var $panel = $sub.find('> .menu-sub');
  if ($panel.length) {
    // geçici olarak gösterip ölç
    $panel.css({visibility:'hidden', display:'block'});
    var rect = $panel[0].getBoundingClientRect();
    $panel.css({visibility:'', display:''});
    var overflowRight = rect.right > (window.innerWidth - 16);
    $sub.toggleClass('open-left', overflowRight);
  }

  $sub.addClass('open');
}
function closeSub($sub){
  var t = setTimeout(function(){ $sub.removeClass('open open-left'); }, SUB_DELAY);
  subTimers.set($sub[0], t);
}

// --- Desktop davranışı: hover ile kontrol
function bindDesktop(){
  // kök
  $root.on('mouseenter.desktop', openRoot);
  $root.on('mouseleave.desktop', closeRoot);
  $menuRoot.on('mouseenter.desktop', openRoot);
  $menuRoot.on('mouseleave.desktop', closeRoot);

  // alt menüler
  $subs.each(function(){
    var $sub = $(this);
    $sub.on('mouseenter.desktop', function(){
      openRoot();          // kök açık kalsın
      openSub($sub);       // alt menü açık
    });
    $sub.on('mouseleave.desktop', function(){
      closeSub($sub);      // alt menü kapanmayı geciktir
    });

    // alt panelin içine girince de açık kalsın
    var $panel = $sub.find('> .menu-sub');
    $panel.on('mouseenter.desktop', function(){
      openRoot();
      openSub($sub);
    });
    $panel.on('mouseleave.desktop', function(){
      closeSub($sub);
    });
  });

  // masaüstünde tıklayınca navigasyon yapsın (prevent yok)
  $root.find('> .nav-link').off('click.mobile');
  $subs.find('> .sub-link').off('click.mobile');
}

// --- Mobile: tıkla aç/kapa
function bindMobile(){
  $root.off('.desktop'); $menuRoot.off('.desktop'); $subs.off('.desktop');
  $root.removeClass('open'); $subs.removeClass('open open-left');

  // Ürünlerimiz
  $root.find('> .nav-link').on('click.mobile', function(e){
    e.preventDefault(); $root.toggleClass('open');
  });
  // Oturma/Yatak
  $subs.find('> .sub-link').on('click.mobile', function(e){
    e.preventDefault(); $(this).parent().toggleClass('open');
  });
}

// dışarı tıkla kapat
$(document).on('click', function(e){
  var $t = $(e.target);
  if (!$root.is($t) && $root.has($t).length === 0) {
    $root.removeClass('open'); $subs.removeClass('open open-left');
  }
});

// ESC ile kapat
$(document).on('keydown', function(e){
  if (e.key === 'Escape') {
    $root.removeClass('open'); $subs.removeClass('open open-left');
  }
});

// başlat
function applyBindings(){ isDesktop() ? bindDesktop() : bindMobile(); }
applyBindings();
$(window).on('resize', applyBindings);


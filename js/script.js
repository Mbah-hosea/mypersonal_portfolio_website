/* ==========================================================
   Mbah Hosea Njeck — Portfolio
   Vanilla JS: nav, scroll effects, typing line, image fallbacks, contact form
   ========================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Header border + scroll progress ---------- */
  var header = document.querySelector('.site-header');
  var progress = document.querySelector('.scroll-progress');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 8);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  function setNav(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  }
  toggle.addEventListener('click', function () {
    setNav(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') setNav(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('open')) {
      setNav(false);
      toggle.focus();
    }
  });

  /* ---------- Typing line in the hero ---------- */
  var typedEl = document.getElementById('typed');
  if (typedEl && !reduceMotion) {
    var words = ['business websites', 'Flutter mobile apps', 'custom software solutions'];
    var w = 0, c = 0, deleting = false;

    var tick = function () {
      var word = words[w];
      c += deleting ? -1 : 1;
      typedEl.textContent = word.slice(0, c);
      var delay = deleting ? 35 : 75;
      if (!deleting && c === word.length) { deleting = true; delay = 1600; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
      setTimeout(tick, delay);
    };
    typedEl.textContent = '';
    setTimeout(tick, 700);
  }

  /* ---------- Highlight current section in nav + reveal on scroll ---------- */
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) sectionObserver.observe(target);
    });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    var revealSelectors = [
      '.section-title', '.section-note', '.prose', '.skill-group', '.service',
      '.project', '.chips.plain li', '.contact-grid'
    ].join(',');

    document.querySelectorAll(revealSelectors).forEach(function (el) {
      var index = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty('--d', Math.min(index, 6) * 70 + 'ms');   // gentle stagger among siblings
      el.classList.add('reveal');
      revealObserver.observe(el);
    });
  }

  /* ---------- Image fallback: show a labelled placeholder if an image is missing ---------- */
  document.querySelectorAll('.img-frame img').forEach(function (img) {
    function markMissing() { img.parentElement.classList.add('img-missing'); }
    if (img.complete && img.naturalWidth === 0) markMissing();
    img.addEventListener('error', markMissing);
  });

  /* ---------- Placeholder links (no real URL yet) ---------- */
  document.querySelectorAll('a.is-placeholder').forEach(function (a) {
    a.setAttribute('aria-disabled', 'true');
    a.title = a.dataset.note || 'Link coming soon';
    a.addEventListener('click', function (e) { e.preventDefault(); });
  });

  /* ---------- Contact form ----------
     Honest behaviour:
     1. If data-endpoint is set (e.g. a Formspree URL), the form posts there.
     2. Otherwise it opens the visitor's email app with the message prefilled (mailto:).
     Nothing is claimed as "sent" unless a service confirmed it.
  ------------------------------------------------ */
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');

  function setStatus(msg, isError) {
    status.textContent = msg;
    status.classList.toggle('error', !!isError);
  }

  function validate() {
    var ok = true;
    form.querySelectorAll('.field').forEach(function (field) {
      var input = field.querySelector('input, textarea');
      var valid = input.value.trim() !== '' && (input.type !== 'email' || /^\S+@\S+\.\S+$/.test(input.value.trim()));
      field.classList.toggle('invalid', !valid);
      input.setAttribute('aria-invalid', String(!valid));
      if (!valid) ok = false;
    });
    return ok;
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) {
        setStatus('Please fill in every field with a valid email address.', true);
        return;
      }

      var data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        message: form.message.value.trim()
      };
      var endpoint = form.dataset.endpoint;
      var to = form.dataset.email;

      if (endpoint) {
        setStatus('Sending…');
        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(data)
        }).then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          form.reset();
          setStatus('Thank you, your message has been sent.');
        }).catch(function () {
          setStatus('Sorry, the message could not be sent. Please use the email or WhatsApp links instead.', true);
        });
        return;
      }

      if (to.indexOf('YOUR_EMAIL') !== -1) {
        setStatus('The email address has not been configured yet. Please use the other contact links.', true);
        return;
      }

      var subject = encodeURIComponent('Portfolio message from ' + data.name);
      var body = encodeURIComponent(data.message + '\n\n— ' + data.name + ' (' + data.email + ')');
      window.location.href = 'mailto:' + to + '?subject=' + subject + '&body=' + body;
      setStatus('Your email app should open with the message ready to send.');
    });
  }
})();
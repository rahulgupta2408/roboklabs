// ===== ROBOK LABS – GLOBAL SCRIPT =====

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// Mobile dropdown toggles
document.querySelectorAll('.nav-links .dropdown > a').forEach(link => {
  link.addEventListener('click', e => {
    if (window.innerWidth <= 768) {
      e.preventDefault();
      link.parentElement.classList.toggle('open');
    }
  });
});

// Sticky navbar shadow on scroll
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 20
      ? '0 4px 24px rgba(0,0,0,0.5)'
      : '0 2px 16px rgba(0,0,0,0.4)';
  });
}

// Close mobile menu on outside click
document.addEventListener('click', e => {
  if (navLinks && navToggle && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
    navLinks.classList.remove('open');
  }
});

// Contact form submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.textContent = 'Sending…';
    btn.disabled = true;

    const data = Object.fromEntries(new FormData(contactForm).entries());

    // Attach FormSubmit.co configuration fields
    const name = `${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.trim();
    data._subject  = name ? `New Contact Inquiry from ${name}` : 'New Contact Form Submission';
    data._captcha  = 'false';   // disable built-in CAPTCHA (not needed with AJAX)
    data._template = 'table';   // nicely formatted table email

    try {
      const res  = await fetch('https://formsubmit.co/ajax/instatrades2408@gmail.com', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify(data),
      });
      const json = await res.json();

      // FormSubmit.co returns { success: "true" } (string) on success
      if (res.ok && json.success === 'true') {
        btn.textContent = '✓ Message Sent!';
        btn.style.background = '#00A3C4';
        contactForm.reset();
        setTimeout(() => {
          btn.textContent = 'Send Message';
          btn.disabled = false;
          btn.style.background = '';
        }, 4000);
      } else {
        btn.textContent = 'Send Failed – Try Again';
        btn.style.background = '#c0392b';
        btn.disabled = false;
        setTimeout(() => {
          btn.textContent = 'Send Message';
          btn.style.background = '';
        }, 4000);
      }
    } catch (_) {
      btn.textContent = 'Send Failed – Try Again';
      btn.style.background = '#c0392b';
      btn.disabled = false;
      setTimeout(() => {
        btn.textContent = 'Send Message';
        btn.style.background = '';
      }, 4000);
    }
  });
}

// Newsletter form
document.querySelectorAll('.newsletter-form').forEach(form => {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button');
    btn.textContent = '✓ Subscribed!';
    btn.style.background = '#00A3C4';
    form.reset();
    setTimeout(() => {
      btn.textContent = 'Subscribe';
      btn.style.background = '';
    }, 3000);
  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Animate cards on scroll (Intersection Observer)
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.card, .service-card, .port-card, .testimonial, .app-item, .step, .mfg-feature').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

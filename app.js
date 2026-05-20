/**
 * SMAN 2 BANDUNG — SPMB 2026 WEBSITE LOGIC
 * Author: Antigravity AI
 * Interaction and Responsive Elements
 */

document.addEventListener('DOMContentLoaded', () => {
  // === 1. THEME MANAGEMENT (DARK MODE) ===
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  const systemThemeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentSavedTheme = localStorage.getItem('theme');

  // Set initial theme based on local storage or system preference
  if (currentSavedTheme === 'dark' || (!currentSavedTheme && systemThemeDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // Toggle Theme Click Event
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    });
  });

  // === 2. SCROLL PROGRESS & STICKY NAVBAR ===
  const header = document.querySelector('header');
  const scrollProgressBar = document.querySelector('.scroll-progress-bar');
  const scrollTopFloat = document.querySelector('.scroll-top-float');

  window.addEventListener('scroll', () => {
    // Scroll progress calculations
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolledPercentage = height > 0 ? (winScroll / height) * 100 : 0;
    
    if (scrollProgressBar) {
      scrollProgressBar.style.setProperty('--scroll-progress', `${scrolledPercentage}%`);
    }

    // Sticky Header Scroll Transition
    if (winScroll > 50) {
      header.classList.add('scrolled');
      if (scrollTopFloat) scrollTopFloat.classList.add('show');
    } else {
      header.classList.remove('scrolled');
      if (scrollTopFloat) scrollTopFloat.classList.remove('show');
    }
  });

  // Scroll to Top action
  if (scrollTopFloat) {
    scrollTopFloat.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // === 3. MOBILE MENU (HAMBURGER) ===
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    // Close menu when links are clicked
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        // Handle mobile dropdown toggle
        const navItem = link.parentElement;
        const hasDropdown = navItem.querySelector('.dropdown-menu');

        if (window.innerWidth <= 768 && hasDropdown) {
          e.preventDefault();
          navItem.classList.toggle('mobile-open');
        } else {
          hamburger.classList.remove('active');
          navMenu.classList.remove('active');
        }
      });
    });
  }

  // === 4. ANNOUNCEMENT BANNER CLOSE ===
  const announcementBanner = document.getElementById('announcement-banner');
  const closeAnnouncementBtn = document.getElementById('close-announcement');
  
  if (announcementBanner && closeAnnouncementBtn) {
    closeAnnouncementBtn.addEventListener('click', () => {
      announcementBanner.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        announcementBanner.style.display = 'none';
      }, 300);
    });
  }

  // === 5. INTERSECTION OBSERVER FOR REVEAL & STATS COUNTER ===
  // Reveal animations
  const revealElements = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealElements.forEach(el => revealObserver.observe(el));

  // Counter animations
  const statNumbers = document.querySelectorAll('.stat-number');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = entry.target;
        const targetVal = parseInt(target.getAttribute('data-target'), 10);
        const suffix = target.getAttribute('data-suffix') || '';
        let startVal = 0;
        const duration = 2000; // 2 seconds
        const stepTime = Math.max(Math.floor(duration / targetVal), 15);
        
        const timer = setInterval(() => {
          startVal += Math.ceil(targetVal / (duration / stepTime));
          if (startVal >= targetVal) {
            target.textContent = targetVal.toLocaleString('id-ID') + suffix;
            clearInterval(timer);
          } else {
            target.textContent = startVal.toLocaleString('id-ID') + suffix;
          }
        }, stepTime);

        counterObserver.unobserve(target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(num => counterObserver.observe(num));

  // === 6. ABOUT COLLAGE TIMELINE & DETAILS MODAL ===
  const openModalBtn = document.getElementById('btn-about-modal');
  const aboutModal = document.getElementById('about-modal');
  const closeModalBtn = document.getElementById('close-about-modal');

  if (openModalBtn && aboutModal) {
    openModalBtn.addEventListener('click', () => {
      aboutModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    const closeModal = () => {
      aboutModal.classList.remove('active');
      document.body.style.overflow = '';
    };

    closeModalBtn.addEventListener('click', closeModal);
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) closeModal();
    });
  }

  // === 7. SPMB FAQ ACCORDION LOGIC ===
  const accordionHeaders = document.querySelectorAll('.accordion-header');

  accordionHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const accordionItem = header.parentElement;
      const accordionContent = accordionItem.querySelector('.accordion-content');
      
      // Check if it's already active
      const isActive = accordionItem.classList.contains('active');
      
      // Close all items
      document.querySelectorAll('.accordion-item').forEach(item => {
        item.classList.remove('active');
        item.querySelector('.accordion-content').style.maxHeight = null;
      });

      if (!isActive) {
        accordionItem.classList.add('active');
        accordionContent.style.maxHeight = accordionContent.scrollHeight + "px";
      }
    });
  });

  // === 8. INTERACTIVE TIMELINE SECTION ===
  const timelineSteps = document.querySelectorAll('.timeline-step');
  const timelineProgressBar = document.querySelector('.timeline-line-progress');
  const timelineDetailsBoxes = document.querySelectorAll('.timeline-details-box');

  function updateTimeline(index) {
    // Calculate progress line percentage based on index (0 to steps.length - 1)
    const percentage = (index / (timelineSteps.length - 1)) * 100;
    if (timelineProgressBar) {
      timelineProgressBar.style.width = `${percentage}%`;
    }

    // Set active class on steps
    timelineSteps.forEach((step, i) => {
      if (i <= index) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
    });

    // Show corresponding detail box
    timelineDetailsBoxes.forEach((box, i) => {
      if (i === index) {
        box.classList.add('active');
      } else {
        box.classList.remove('active');
      }
    });
  }

  timelineSteps.forEach((step, index) => {
    step.addEventListener('click', () => {
      updateTimeline(index);
    });
  });

  // Initialize first timeline step as active
  if (timelineSteps.length > 0) {
    updateTimeline(0);
  }

  // === 9. NEWS CAROUSEL SECTION ===
  const newsTrack = document.getElementById('news-track');
  const newsPrev = document.getElementById('news-prev');
  const newsNext = document.getElementById('news-next');
  
  if (newsTrack && newsPrev && newsNext) {
    let index = 0;
    
    function getSlideWidth() {
      const cards = newsTrack.querySelectorAll('.news-card');
      if (cards.length === 0) return 0;
      const style = window.getComputedStyle(cards[0]);
      const cardWidth = cards[0].offsetWidth;
      const marginRight = parseFloat(style.marginRight) || 24; // fallback to 24px gap
      return cardWidth + marginRight;
    }

    function maxSlides() {
      const totalCards = newsTrack.querySelectorAll('.news-card').length;
      let visibleCards = 3;
      if (window.innerWidth <= 1024) visibleCards = 2;
      if (window.innerWidth <= 768) visibleCards = 1;
      return totalCards - visibleCards;
    }

    function slideNews() {
      const maxIdx = maxSlides();
      if (index > maxIdx) index = maxIdx;
      if (index < 0) index = 0;
      const slideDist = index * getSlideWidth();
      newsTrack.style.transform = `translateX(-${slideDist}px)`;
    }

    newsNext.addEventListener('click', () => {
      if (index < maxSlides()) {
        index++;
        slideNews();
      }
    });

    newsPrev.addEventListener('click', () => {
      if (index > 0) {
        index--;
        slideNews();
      }
    });

    window.addEventListener('resize', () => {
      slideNews(); // recalibrate width on resize
    });
  }

  // === 10. MASONRY GALLERY FILTER & LIGHTBOX ===
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCloseBtn = document.getElementById('lightbox-close');

  // Init filter: Show all
  galleryItems.forEach(item => item.classList.add('show'));

  // Filtering
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active btn
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        if (filterValue === 'all' || itemCategory === filterValue) {
          item.classList.add('show');
        } else {
          item.classList.remove('show');
        }
      });
    });
  });

  // Lightbox view
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const imgSrc = item.querySelector('img').getAttribute('src');
      const imgTitle = item.querySelector('.gallery-title').textContent;
      
      if (lightboxModal && lightboxImg && lightboxTitle) {
        lightboxImg.setAttribute('src', imgSrc);
        lightboxTitle.textContent = imgTitle;
        lightboxModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  if (lightboxModal && lightboxCloseBtn) {
    const closeLightbox = () => {
      lightboxModal.classList.remove('active');
      document.body.style.overflow = '';
    };

    lightboxCloseBtn.addEventListener('click', closeLightbox);
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  // === 11. TESTIMONIAL SLIDER ===
  const testimonialTrack = document.getElementById('testimonial-track');
  const testimonialDotsContainer = document.getElementById('testimonial-dots');
  
  if (testimonialTrack) {
    const slides = testimonialTrack.querySelectorAll('.testimonial-slide');
    let activeTestimonialIdx = 0;
    let autoPlayTimer;

    // Create Navigation Dots dynamically
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('testimonial-dot');
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Testimonial Slide ${i + 1}`);
      dot.addEventListener('click', () => {
        goToTestimonial(i);
        resetAutoPlay();
      });
      if (testimonialDotsContainer) testimonialDotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.testimonial-dot');

    function goToTestimonial(index) {
      activeTestimonialIdx = index;
      testimonialTrack.style.transform = `translateX(-${index * 100}%)`;
      
      dots.forEach((dot, i) => {
        if (i === index) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }

    function startAutoPlay() {
      autoPlayTimer = setInterval(() => {
        let nextIdx = activeTestimonialIdx + 1;
        if (nextIdx >= slides.length) nextIdx = 0;
        goToTestimonial(nextIdx);
      }, 5000); // every 5 seconds
    }

    function resetAutoPlay() {
      clearInterval(autoPlayTimer);
      startAutoPlay();
    }

    startAutoPlay();
  }

  // === 12. FLOATING HELP CHATBOT LOGIC ===
  const helpChatBtn = document.getElementById('help-chat-btn');
  const helpChatWidget = document.getElementById('help-chat-widget');
  const closeChatBtn = document.getElementById('close-chat-btn');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const helpChatBody = document.getElementById('help-chat-body');

  if (helpChatBtn && helpChatWidget) {
    // Toggle chat widget visibility
    helpChatBtn.addEventListener('click', () => {
      const isOpen = helpChatWidget.style.display === 'flex';
      helpChatWidget.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen && helpChatBody) {
        helpChatBody.scrollTop = helpChatBody.scrollHeight;
      }
    });

    if (closeChatBtn) {
      closeChatBtn.addEventListener('click', () => {
        helpChatWidget.style.display = 'none';
      });
    }

    // Message responses
    const botResponses = [
      "Terima kasih atas pertanyaannya! SPMB SMAN 2 Bandung 2026 dibuka dalam beberapa jalur seleksi seperti Afirmasi, Prestasi, dan Zonasi.",
      "Dokumen pendaftaran yang diperlukan meliputi Kartu Keluarga, Rapor SMP Semester 1-5, Ijazah/SKL, dan sertifikat prestasi jika ada.",
      "Pendaftaran dimulai pada bulan Juni 2026. Anda dapat melihat jadwal lengkap di bagian 'Timeline SPMB' di atas.",
      "Untuk informasi lebih lanjut tentang persentase kuota jalur zonasi, silakan kunjungi menu Informasi -> Jalur Seleksi.",
      "Ada hal lain tentang SPMB SMAN 2 Bandung 2026 yang ingin Anda ketahui?"
    ];
    let responseIdx = 0;

    const sendMessage = () => {
      const text = chatInput.value.trim();
      if (!text) return;

      // Add user message
      const userMsg = document.createElement('div');
      userMsg.classList.add('chat-msg', 'chat-msg-user');
      userMsg.textContent = text;
      helpChatBody.appendChild(userMsg);
      
      chatInput.value = '';
      helpChatBody.scrollTop = helpChatBody.scrollHeight;

      // Bot typing simulation
      setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.classList.add('chat-msg', 'chat-msg-bot');
        botMsg.textContent = botResponses[responseIdx];
        
        responseIdx = (responseIdx + 1) % botResponses.length;
        
        helpChatBody.appendChild(botMsg);
        helpChatBody.scrollTop = helpChatBody.scrollHeight;
      }, 1000);
    };

    if (chatSendBtn && chatInput) {
      chatSendBtn.addEventListener('click', sendMessage);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    }
  }

  // === 13. DUMMY FORM SUBMISSION VALIDATION ===
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nama = document.getElementById('form-nama').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const pesan = document.getElementById('form-pesan').value.trim();

      if (!nama || !email || !pesan) {
        alert("Harap lengkapi semua isian formulir.");
        return;
      }

      // Success animation
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      
      submitBtn.disabled = true;
      submitBtn.textContent = "Mengirim...";

      setTimeout(() => {
        alert(`Terima kasih, ${nama}! Pesan Anda telah terkirim. Admin kami akan menghubungi Anda melalui email ${email}.`);
        contactForm.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }, 1500);
    });
  }
});

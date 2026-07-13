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

  // === 9.2. INSTAGRAM CARD INTERACTION ===
  const likeButtons = document.querySelectorAll('.action-icon-btn[aria-label="Suka"]');
  const bookmarkButtons = document.querySelectorAll('.bookmark-btn');

  likeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('liked');
    });
  });

  bookmarkButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('bookmarked');
    });
  });

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

  // === 11. TESTIMONIAL SLIDER & DYNAMIC VISITOR INJECTOR ===
  const testimonialTrack = document.getElementById('testimonial-track');
  const testimonialDotsContainer = document.getElementById('testimonial-dots');
  const btnToggleTestimonialForm = document.getElementById('btn-toggle-testimonial-form');
  const testimonialFormWrapper = document.getElementById('testimonial-form-wrapper');
  const testimonialForm = document.getElementById('testimonial-form');
  const btnCancelTestimonial = document.getElementById('btn-cancel-testimonial');
  const testimonialAlert = document.getElementById('testimonial-alert');

  let activeTestimonialIdx = 0;
  let autoPlayTimer;
  let testimonialSlides = [];

  function showTestimonialAlert(msg, type = 'error') {
    if (!testimonialAlert) return;
    testimonialAlert.textContent = msg;
    testimonialAlert.className = `modal-alert ${type}`;
    testimonialAlert.style.display = 'block';
  }

  function hideTestimonialAlert() {
    if (testimonialAlert) {
      testimonialAlert.className = 'modal-alert hidden';
      testimonialAlert.style.display = 'none';
    }
  }

  function setupSlider() {
    if (!testimonialTrack) return;
    
    // Clear auto play timer
    if (autoPlayTimer) clearInterval(autoPlayTimer);

    // Get current slides
    testimonialSlides = testimonialTrack.querySelectorAll('.testimonial-slide');
    if (testimonialSlides.length === 0) return;

    // Reset dots container
    if (testimonialDotsContainer) testimonialDotsContainer.innerHTML = '';
    
    // Reset position
    activeTestimonialIdx = 0;
    testimonialTrack.style.transform = `translateX(0)`;

    // Create Navigation Dots dynamically
    testimonialSlides.forEach((_, i) => {
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

    startAutoPlay();
  }

  function goToTestimonial(index) {
    if (!testimonialTrack) return;
    const dots = testimonialDotsContainer ? testimonialDotsContainer.querySelectorAll('.testimonial-dot') : [];
    
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
    if (testimonialSlides.length <= 1) return;
    autoPlayTimer = setInterval(() => {
      let nextIdx = activeTestimonialIdx + 1;
      if (nextIdx >= testimonialSlides.length) nextIdx = 0;
      goToTestimonial(nextIdx);
    }, 5000);
  }

  function resetAutoPlay() {
    clearInterval(autoPlayTimer);
    startAutoPlay();
  }

  // Load testimonials from server
  async function loadTestimonials() {
    if (!testimonialTrack) return;
    
    try {
      const response = await fetch('/api/testimonials');
      const result = await response.json();
      
      if (response.ok && result.success) {
        testimonialTrack.innerHTML = '';
        
        result.data.forEach(item => {
          const slide = document.createElement('div');
          slide.classList.add('testimonial-slide');
          
          const avatarUrl = item.avatar || 'assets/avatar_default.png';
          
          slide.innerHTML = `
            <div class="testimonial-card glass-panel">
              <span class="testimonial-quote-icon">“</span>
              <p class="testimonial-quote">
                "${escapeHtml(item.message)}"
              </p>
              <div class="testimonial-user">
                <img src="${avatarUrl}" alt="${escapeHtml(item.name)}" class="testimonial-avatar" onerror="this.src='assets/avatar_alumni.png'">
                <div class="testimonial-info">
                  <span class="testimonial-name">${escapeHtml(item.name)}</span>
                  <span class="testimonial-role">${escapeHtml(item.role)}</span>
                </div>
              </div>
            </div>
          `;
          testimonialTrack.appendChild(slide);
        });
        
        setupSlider();
      }
    } catch (err) {
      console.error('Error loading testimonials:', err);
    }
  }

  // Helper to escape HTML tags
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Toggle Form Visibility
  if (btnToggleTestimonialForm && testimonialFormWrapper) {
    btnToggleTestimonialForm.addEventListener('click', () => {
      const isHidden = testimonialFormWrapper.style.display === 'none';
      testimonialFormWrapper.style.display = isHidden ? 'block' : 'none';
      if (isHidden) {
        testimonialFormWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      hideTestimonialAlert();
    });
  }

  // Cancel testimonial creation
  if (btnCancelTestimonial && testimonialFormWrapper) {
    btnCancelTestimonial.addEventListener('click', () => {
      testimonialFormWrapper.style.display = 'none';
      if (testimonialForm) testimonialForm.reset();
      hideTestimonialAlert();
    });
  }
  // Handle Form Submission
  if (testimonialForm) {
    testimonialForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('testi-name').value.trim();
      const role = document.getElementById('testi-role').value.trim();
      const message = document.getElementById('testi-message').value.trim();
      const avatarInput = document.getElementById('testi-avatar');
      
      const submitBtn = document.getElementById('btn-submit-testimonial');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Mengirim...';
      hideTestimonialAlert();
      
      // Check file size if uploaded
      if (avatarInput && avatarInput.files.length > 0) {
        const file = avatarInput.files[0];
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > 1) {
          showTestimonialAlert("Ukuran file foto profil tidak boleh melebihi 1MB!", "error");
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          if (window.lucide) lucide.createIcons();
          return;
        }
      }
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('role', role);
      formData.append('message', message);
      
      if (avatarInput && avatarInput.files.length > 0) {
        formData.append('avatar', avatarInput.files[0]);
      }
      
      try {
        const response = await fetch('/api/testimonials', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          showTestimonialAlert(result.message || 'Testimoni Anda berhasil dikirim!', 'success');
          testimonialForm.reset();
          
          // Reload testimonials immediately to show the new one
          await loadTestimonials();
          
          setTimeout(() => {
            testimonialFormWrapper.style.display = 'none';
            hideTestimonialAlert();
          }, 2000);
        } else {
          showTestimonialAlert(result.error || 'Gagal mengirim testimoni.');
        }
      } catch (err) {
        console.error('Error submitting testimonial:', err);
        showTestimonialAlert('Koneksi server gagal. Silakan coba beberapa saat lagi.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        if (window.lucide) lucide.createIcons();
      }
    });
  }
  // Initialize
  loadTestimonials();

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

    // Keyword-based chatbot logic
    function getBotResponse(userMessage) {
      const msg = userMessage.toLowerCase().trim();
      
      if (msg.includes('halo') || msg.includes('hai') || msg.includes('pagi') || msg.includes('siang') || msg.includes('sore') || msg.includes('malam') || msg.includes('assalamu') || msg.includes('permisi') || msg.includes('tanya')) {
        return "Halo! Selamat datang di Layanan Asisten SPMB SMAN 2 Bandung 2026. Silakan tanyakan hal-hal terkait:<br><br>" +
               "• <strong>syarat</strong> (berkas & dokumen pendaftaran)<br>" +
               "• <strong>jadwal</strong> (timeline & tanggal penting)<br>" +
               "• <strong>jalur</strong> (zonasi, prestasi, afirmasi, mutasi)<br>" +
               "• <strong>daftar ulang</strong> (cara verifikasi NISN online)<br>" +
               "• <strong>kontak</strong> (alamat sekolah & helpdesk)<br>" +
               "• <strong>biaya</strong> (informasi biaya sekolah)";
      }
      
      if (msg.includes('syarat') || msg.includes('dokumen') || msg.includes('berkas') || msg.includes('rapor') || msg.includes('sptjm') || msg.includes('surat') || msg.includes('persyaratan')) {
        return "<strong>Dokumen Persyaratan Utama:</strong><br>" +
               "1. Ijazah SMP/sederajat atau Surat Keterangan Lulus (SKL)<br>" +
               "2. Akta Kelahiran / Kartu Identitas Anak (KIA)<br>" +
               "3. Kartu Keluarga (KK) asli yang terbit minimal 1 tahun<br>" +
               "4. KTP Orang Tua / Wali<br>" +
               "5. SPTJM bermeterai (Surat Pernyataan Tanggung Jawab Mutlak)<br><br>" +
               "<strong>Dokumen Tambahan (Sesuai Jalur):</strong><br>" +
               "• Jalur Afirmasi: Kartu KIP / KKS / PKH<br>" +
               "• Jalur Prestasi Kejuaraan: Piagam kejuaraan minimal tingkat kota/kabupaten";
      }
      
      if (msg.includes('jadwal') || msg.includes('tanggal') || msg.includes('kapan') || msg.includes('timeline') || msg.includes('mulai') || msg.includes('tahap')) {
        return "<strong>Jadwal Penting PPDB SMAN 2 Bandung 2026:</strong><br><br>" +
               "• <strong>18 - 29 Mei 2026:</strong> Pemetaan Akun PPDB<br>" +
               "• <strong>25 - 28 Juni 2026:</strong> Pendaftaran resmi & Seleksi Tahap 1<br>" +
               "• <strong>1 - 5 Juli 2026:</strong> Pendaftaran resmi & Seleksi Tahap 2<br><br>" +
               "Detail jadwal selengkapnya dapat Anda temukan di bagian 'Timeline SPMB' pada halaman utama website.";
      }
      
      if (msg.includes('jalur') || msg.includes('zonasi') || msg.includes('domisili') || msg.includes('afirmasi') || msg.includes('prestasi') || msg.includes('pindah') || msg.includes('mutasi') || msg.includes('kuota')) {
        return "<strong>Jalur Pendaftaran & Kuota SMAN 2 Bandung:</strong><br><br>" +
               "1. <strong>Zonasi / Domisili (35%):</strong> Berdasarkan jarak udara dari rumah ke sekolah.<br>" +
               "2. <strong>Afirmasi KETM/PDBK (30%):</strong> Untuk keluarga tidak mampu atau berkebutuhan khusus.<br>" +
               "3. <strong>Prestasi (30%):</strong> Terbagi atas Prestasi Nilai Rapor & Prestasi Kejuaraan.<br>" +
               "4. <strong>Perpindahan Tugas Orang Tua & Anak Guru (5%):</strong> Untuk orang tua yang pindah kerja dinas.<br><br>" +
               "Info lengkap syarat masing-masing jalur tersedia di menu <em>Informasi -> Jalur Seleksi</em>.";
      }
      
      if (msg.includes('daftar ulang') || msg.includes('registrasi') || msg.includes('ulang') || msg.includes('verifikasi') || msg.includes('cara daftar') || msg.includes('prosedur')) {
        return "<strong>Prosedur Daftar Ulang Online Calon Siswa:</strong><br><br>" +
               "1. Klik tombol kuning <strong>'Daftar Ulang'</strong> di kanan atas halaman ini.<br>" +
               "2. Masukkan 10 digit <strong>NISN</strong> Anda yang sudah dinyatakan lulus PPDB.<br>" +
               "3. Isi lengkap biodata, alamat, nomor WA, dan ukuran baju seragam.<br>" +
               "4. Unggah berkas scan KK dan Bukti Kelulusan PPDB asli (Format PDF/JPG, max 2MB).<br>" +
               "5. Setelah disubmit, cetak <strong>Bukti Daftar Ulang</strong> yang berisi QR Code dan jadwal sesi penyerahan dokumen fisik ke sekolah.";
      }
      
      if (msg.includes('biaya') || msg.includes('bayar') || msg.includes('gratis') || msg.includes('uang') || msg.includes('spp') || msg.includes('pembangunan')) {
        return "<strong>Informasi Biaya Pendaftaran & Sekolah:</strong><br><br>" +
               "Seluruh proses pendaftaran SPMB/PPDB, Daftar Ulang, dan kegiatan belajar mengajar di SMAN 2 Bandung selaku sekolah negeri adalah <strong>GRATIS (100% tidak dipungut biaya apapun)</strong>.<br><br>" +
               "Hati-hati terhadap penipuan/pungutan liar yang mengatasnamakan panitia sekolah.";
      }
      
      if (msg.includes('lokasi') || msg.includes('alamat') || msg.includes('tempat') || msg.includes('mana') || msg.includes('peta') || msg.includes('dago') || msg.includes('cihampelas')) {
        return "SMAN 2 Bandung berlokasi strategis di <strong>Jl. Cihampelas No.173, Cipaganti, Kec. Coblong, Kota Bandung, Jawa Barat 40131</strong>.<br><br>" +
               "Peta Google Maps interaktif dan navigasi arah dapat Anda akses di bagian paling bawah halaman utama website ini.";
      }
      
      if (msg.includes('kontak') || msg.includes('telepon') || msg.includes('telp') || msg.includes('email') || msg.includes('wa') || msg.includes('whatsapp') || msg.includes('hubung') || msg.includes('panitia') || msg.includes('helpdesk') || msg.includes('nyambung') || msg.includes('sambung')) {
        return "<strong>Layanan Pengaduan & Informasi Helpdesk:</strong><br><br>" +
               "• <strong>Telepon:</strong> (022) 2032610 (Hari pelayanan, Senin - Sabtu: 08:00 - 15:00 WIB)<br>" +
               "• <strong>Email:</strong> contact@sman2bdg.sch.id<br>" +
               "• <strong>WhatsApp Panitia:</strong> Hubungi admin dengan mengklik logo WhatsApp hijau di pojok kanan bawah layar untuk chat langsung.";
      }

      if (msg.includes('terima kasih') || msg.includes('nuhun') || msg.includes('makasih') || msg.includes('ok') || msg.includes('siap') || msg.includes('suwun') || msg.includes('thanks')) {
        return "Sama-sama! Senang bisa membantu Anda. Semoga sukses pendaftaran SPMB SMAN 2 Bandung 2026.<br><br>" +
               "Jika ada hal lain, ketik kata kunci seperti <em>'syarat'</em>, <em>'jadwal'</em>, <em>'jalur'</em>, atau <em>'daftar ulang'</em>.";
      }
      
      return "Maaf, Asisten SPMB tidak mengenali kata kunci tersebut.<br><br>" +
             "Coba ketik kata kunci bantuan berikut:<br>" +
             "• <strong>syarat</strong> (dokumen persyaratan)<br>" +
             "• <strong>jadwal</strong> (timeline PPDB)<br>" +
             "• <strong>jalur</strong> (zonasi/afirmasi/prestasi/mutasi)<br>" +
             "• <strong>daftar ulang</strong> (cara daftar ulang online)<br>" +
             "• <strong>kontak</strong> (alamat, email, & telepon)<br>" +
             "• <strong>biaya</strong> (infomasi spp & uang sekolah)";
    }

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
        botMsg.innerHTML = getBotResponse(text);
        
        helpChatBody.appendChild(botMsg);
        helpChatBody.scrollTop = helpChatBody.scrollHeight;
      }, 700);
    };

    if (chatSendBtn && chatInput) {
      chatSendBtn.addEventListener('click', sendMessage);
      chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
      });
    }
  }

  // === 13. FORM SUBMISSION (KIRIM PERTANYAAN) ===
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('form-nama').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const message = document.getElementById('form-pesan').value.trim();

      if (!name || !email || !message) {
        alert("Harap lengkapi semua isian formulir.");
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      
      submitBtn.disabled = true;
      submitBtn.textContent = "Mengirim...";

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          alert(result.message || 'Pertanyaan Anda berhasil dikirim!');
          contactForm.reset();
        } else {
          alert(result.error || 'Gagal mengirim pertanyaan. Silakan coba lagi.');
        }
      } catch (err) {
        console.error('Error submitting contact form:', err);
        alert('Koneksi server gagal. Silakan coba beberapa saat lagi.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // === 14. DAFTAR ULANG ONLINE MODAL & MULTI-STEP LOGIC ===
  const btnsOpenDaftarUlang = document.querySelectorAll('.btn-open-daftar-ulang');
  const daftarUlangModal = document.getElementById('daftar-ulang-modal');
  const btnCloseDaftarUlang = document.getElementById('close-daftar-ulang-modal');
  const duAlert = document.getElementById('daftar-ulang-alert');
  
  // Steps and Indicators
  const formSteps = document.querySelectorAll('.form-step-content');
  const indicators = document.querySelectorAll('.step-indicator-item');
  
  // Form Inputs (Basic & Pribadi)
  const inputNisn = document.getElementById('du-nisn');
  const inputName = document.getElementById('du-name');
  const inputGender = document.getElementById('du-gender');
  const inputNik = document.getElementById('du-nik');
  const inputNoKk = document.getElementById('du-nokk');
  const inputTempatLahir = document.getElementById('du-tempat-lahir');
  const inputTanggalLahir = document.getElementById('du-tanggal-lahir');
  const inputNoAkta = document.getElementById('du-no-akta');
  const inputAgama = document.getElementById('du-agama');
  const inputKewarganegaraan = document.getElementById('du-kewarganegaraan');
  const inputKewarganegaraanNegara = document.getElementById('du-kewarganegaraan-negara');
  const inputKebutuhanKhusus = document.getElementById('du-kebutuhan-khusus');
  
  // Address & Contact
  const inputAlamatJalan = document.getElementById('du-alamat-jalan');
  const inputRt = document.getElementById('du-rt');
  const inputRw = document.getElementById('du-rw');
  const inputDusun = document.getElementById('du-dusun');
  const inputKelurahan = document.getElementById('du-kelurahan');
  const inputKecamatan = document.getElementById('du-kecamatan');
  const inputKodePos = document.getElementById('du-kode-pos');
  const inputLintang = document.getElementById('du-lintang');
  const inputBujur = document.getElementById('du-bujur');
  const inputTempatTinggal = document.getElementById('du-tempat-tinggal');
  const inputTransportasi = document.getElementById('du-transportasi');
  const inputAnakKe = document.getElementById('du-anak-ke');
  const inputPenerimaKip = document.getElementById('du-penerima-kip');
  const inputTetapKip = document.getElementById('du-tetap-kip');
  const inputAlasanTolakPip = document.getElementById('du-alasan-tolak-pip');
  const inputEmail = document.getElementById('du-email');
  const inputPhone = document.getElementById('du-phone');
  const inputTeleponRumah = document.getElementById('du-telepon-rumah');
  const inputUniform = document.getElementById('du-uniform');
  const inputAddress = document.getElementById('du-address');
  
  // Father Candidate
  const inputAyahNama = document.getElementById('du-ayah-nama');
  const inputAyahNik = document.getElementById('du-ayah-nik');
  const inputAyahTahunLahir = document.getElementById('du-ayah-tahun-lahir');
  const inputAyahPendidikan = document.getElementById('du-ayah-pendidikan');
  const inputAyahPekerjaan = document.getElementById('du-ayah-pekerjaan');
  const inputAyahPenghasilan = document.getElementById('du-ayah-penghasilan');
  const inputAyahKebutuhanKhusus = document.getElementById('du-ayah-kebutuhan-khusus');
  
  // Mother Candidate
  const inputIbuNama = document.getElementById('du-ibu-nama');
  const inputIbuNik = document.getElementById('du-ibu-nik');
  const inputIbuTahunLahir = document.getElementById('du-ibu-tahun-lahir');
  const inputIbuPendidikan = document.getElementById('du-ibu-pendidikan');
  const inputIbuPekerjaan = document.getElementById('du-ibu-pekerjaan');
  const inputIbuPenghasilan = document.getElementById('du-ibu-penghasilan');
  const inputIbuKebutuhanKhusus = document.getElementById('du-ibu-kebutuhan-khusus');
  
  // Wali Candidate
  const inputWaliNama = document.getElementById('du-wali-nama');
  const inputWaliNik = document.getElementById('du-wali-nik');
  const inputWaliTahunLahir = document.getElementById('du-wali-tahun-lahir');
  const inputWaliPendidikan = document.getElementById('du-wali-pendidikan');
  const inputWaliPekerjaan = document.getElementById('du-wali-pekerjaan');
  const inputWaliPenghasilan = document.getElementById('du-wali-penghasilan');
  
  // Periodik & Registrasi
  const inputTinggiBadan = document.getElementById('du-tinggi-badan');
  const inputBeratBadan = document.getElementById('du-berat-badan');
  const inputLingkarKepala = document.getElementById('du-lingkar-kepala');
  const inputJumlahSaudara = document.getElementById('du-jumlah-saudara');
  const inputJarakSekolah = document.getElementById('du-jarak-sekolah');
  const inputJarakSekolahKm = document.getElementById('du-jarak-sekolah-km');
  const inputWaktuTempuhJam = document.getElementById('du-waktu-tempuh-jam');
  const inputWaktuTempuhMenit = document.getElementById('du-waktu-tempuh-menit');
  
  const inputJenisPendaftaran = document.getElementById('du-jenis-pendaftaran');
  const inputNis = document.getElementById('du-nis');
  const inputTanggalMasuk = document.getElementById('du-tanggal-masuk');
  const inputSekolahAsal = document.getElementById('du-sekolah-asal');
  const inputNomorPesertaUn = document.getElementById('du-nomor-peserta-un');
  const inputNoSeriIjazah = document.getElementById('du-no-seri-ijazah');
  const inputNoSkhun = document.getElementById('du-no-skhun');
  
  const inputKesejahteraanJenis = document.getElementById('du-kesejahteraan-jenis');
  const inputKesejahteraanNoKartu = document.getElementById('du-kesejahteraan-no-kartu');
  const inputKesejahteraanNamaKartu = document.getElementById('du-kesejahteraan-nama-kartu');
  
  // File inputs & Drag boxes
  const fileKk = document.getElementById('du-kk-file');
  const filePpdb = document.getElementById('du-ppdb-file');
  const dragKk = document.getElementById('drag-kk');
  const dragPpdb = document.getElementById('drag-ppdb');
  const nameKk = document.getElementById('name-kk');
  const namePpdb = document.getElementById('name-ppdb');
  
  // Navigation Buttons
  const btnStep1Next = document.getElementById('btn-step1-next');
  const btnStep2Prev = document.getElementById('btn-step2-prev');
  const btnStep2Next = document.getElementById('btn-step2-next');
  const btnStep3Prev = document.getElementById('btn-step3-prev');
  const btnStep3Next = document.getElementById('btn-step3-next');
  const btnStep4Prev = document.getElementById('btn-step4-prev');
  const btnStep4Submit = document.getElementById('btn-step4-submit');
  const btnPrintReceipt = document.getElementById('btn-print-receipt');
  const btnCloseReceipt = document.getElementById('btn-close-receipt');
  
  let currentStep = 1;
  let verifiedNisn = '';
  
  // Setup Conditional Visibility triggers
  if (inputKewarganegaraan) {
    inputKewarganegaraan.addEventListener('change', () => {
      const gr = document.getElementById('du-group-kewarganegaraan-negara');
      if (gr) gr.style.display = inputKewarganegaraan.value === 'WNA' ? 'block' : 'none';
      if (inputKewarganegaraanNegara) {
        inputKewarganegaraanNegara.required = inputKewarganegaraan.value === 'WNA';
        if (inputKewarganegaraan.value !== 'WNA') inputKewarganegaraanNegara.value = '';
      }
    });
  }

  if (inputPenerimaKip) {
    inputPenerimaKip.addEventListener('change', () => {
      const gTetap = document.getElementById('du-group-tetap-kip');
      const gTolak = document.getElementById('du-group-alasan-tolak-pip');
      if (inputPenerimaKip.value === 'Ya') {
        if (gTetap) gTetap.style.display = 'block';
        if (gTolak) gTolak.style.display = 'none';
        if (inputAlasanTolakPip) inputAlasanTolakPip.selectedIndex = 0;
      } else {
        if (gTetap) gTetap.style.display = 'none';
        if (gTolak) gTolak.style.display = 'block';
        if (inputTetapKip) inputTetapKip.selectedIndex = 0;
      }
    });
  }

  if (inputJarakSekolah) {
    inputJarakSekolah.addEventListener('change', () => {
      const gJarakKm = document.getElementById('du-group-jarak-sekolah-km');
      if (gJarakKm) gJarakKm.style.display = inputJarakSekolah.value === 'Lebih dari 1 km' ? 'block' : 'none';
      if (inputJarakSekolahKm) {
        inputJarakSekolahKm.required = inputJarakSekolah.value === 'Lebih dari 1 km';
        if (inputJarakSekolah.value !== 'Lebih dari 1 km') inputJarakSekolahKm.value = '';
      }
    });
  }
  
  // Helper to show alert in modal
  function showModalAlert(message, type = 'error') {
    if (!duAlert) return;
    duAlert.textContent = message;
    duAlert.className = `modal-alert ${type}`;
    duAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  
  function hideModalAlert() {
    if (duAlert) {
      duAlert.className = 'modal-alert hidden';
      duAlert.textContent = '';
    }
  }
  
  // Helper to switch steps
  function goToStep(stepNum) {
    currentStep = stepNum;
    hideModalAlert();
    
    // Toggle active classes on steps content
    formSteps.forEach((stepEl, idx) => {
      if (idx === stepNum - 1) {
        stepEl.classList.add('active');
      } else {
        stepEl.classList.remove('active');
      }
    });
    
    // Toggle active classes on indicators
    indicators.forEach((indicatorEl, idx) => {
      if (idx <= stepNum - 1) {
        indicatorEl.classList.add('active');
      } else {
        indicatorEl.classList.remove('active');
      }
    });
  }
  
  // Reset all states
  function resetDaftarUlangForm() {
    goToStep(1);
    verifiedNisn = '';
    if (inputNisn) {
      inputNisn.value = '';
      inputNisn.disabled = false;
    }
    
    // Reset all input values
    const allInputs = daftarUlangModal.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
      if (input.id === 'du-nisn' || input.id === 'du-name') return;
      if (input.type === 'file') {
        input.value = '';
      } else if (input.tagName === 'SELECT') {
        input.selectedIndex = 0;
      } else {
        input.value = '';
      }
    });
    
    // Hidden groups reset
    const gNegara = document.getElementById('du-group-kewarganegaraan-negara');
    if (gNegara) gNegara.style.display = 'none';
    const gTetap = document.getElementById('du-group-tetap-kip');
    if (gTetap) gTetap.style.display = 'none';
    const gTolak = document.getElementById('du-group-alasan-tolak-pip');
    if (gTolak) gTolak.style.display = 'none';
    const gJarakKm = document.getElementById('du-group-jarak-sekolah-km');
    if (gJarakKm) gJarakKm.style.display = 'none';
    
    if (nameKk) nameKk.textContent = 'Belum ada file terpilih';
    if (namePpdb) namePpdb.textContent = 'Belum ada file terpilih';
  }
  
  // Open modal
  if (btnsOpenDaftarUlang && daftarUlangModal) {
    btnsOpenDaftarUlang.forEach(btn => {
      btn.addEventListener('click', () => {
        resetDaftarUlangForm();
        daftarUlangModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });
  }
  
  // Close modal
  const closeModalDU = () => {
    if (daftarUlangModal) {
      daftarUlangModal.classList.remove('active');
      document.body.style.overflow = '';
      resetDaftarUlangForm();
    }
  };
  
  if (btnCloseDaftarUlang) btnCloseDaftarUlang.addEventListener('click', closeModalDU);
  if (daftarUlangModal) {
    daftarUlangModal.addEventListener('click', (e) => {
      if (e.target === daftarUlangModal) closeModalDU();
    });
  }
  
  // Drag & drop handlers helper
  function setupDragDrop(dragEl, inputEl, nameEl) {
    if (!dragEl || !inputEl || !nameEl) return;
    
    dragEl.addEventListener('click', () => inputEl.click());
    
    dragEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragEl.classList.add('dragover');
    });
    
    dragEl.addEventListener('dragleave', () => {
      dragEl.classList.remove('dragover');
    });
    
    dragEl.addEventListener('drop', (e) => {
      e.preventDefault();
      dragEl.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        inputEl.files = e.dataTransfer.files;
        handleFileChange(inputEl, nameEl);
      }
    });
    
    inputEl.addEventListener('change', () => {
      handleFileChange(inputEl, nameEl);
    });
  }
  
  function handleFileChange(inputEl, nameEl) {
    if (inputEl.files.length > 0) {
      const file = inputEl.files[0];
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 2) {
        showModalAlert(`Berkas ${file.name} melebihi batas ukuran 2MB!`, 'error');
        inputEl.value = '';
        nameEl.textContent = 'Belum ada file terpilih';
        return;
      }
      hideModalAlert();
      nameEl.textContent = `${file.name} (${sizeMB.toFixed(2)} MB)`;
    } else {
      nameEl.textContent = 'Belum ada file terpilih';
    }
  }
  
  setupDragDrop(dragKk, fileKk, nameKk);
  setupDragDrop(dragPpdb, filePpdb, namePpdb);
  
  function prefillFormFields(data) {
    if (!data) return;

    const setVal = (id, value) => {
      const el = document.getElementById(id);
      if (el && value !== undefined && value !== null) {
        el.value = value.toString().trim();
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    // Data Pribadi
    if (data.name) setVal('du-name', data.name);
    if (data.gender) setVal('du-gender', data.gender);
    if (data.nik) setVal('du-nik', data.nik);
    if (data.no_kk) setVal('du-nokk', data.no_kk);

    // Tempat Lahir (mapping dropdown)
    if (data.tempat_lahir) {
      const el = document.getElementById('du-tempat-lahir');
      if (el) {
        let exists = false;
        for (let i = 0; i < el.options.length; i++) {
          if (el.options[i].value === data.tempat_lahir) {
            exists = true;
            break;
          }
        }
        if (!exists && data.tempat_lahir.trim() !== '') {
          const opt = document.createElement('option');
          opt.value = data.tempat_lahir;
          opt.textContent = data.tempat_lahir;
          el.appendChild(opt);
        }
        el.value = data.tempat_lahir;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }

    // Tanggal Lahir (formatted YYYY-MM-DD)
    if (data.tanggal_lahir) {
      const dateStr = data.tanggal_lahir.split('T')[0];
      setVal('du-tanggal-lahir', dateStr);
    }

    // Alamat & Kontak
    if (data.alamat_jalan) setVal('du-alamat-jalan', data.alamat_jalan);
    if (data.rt) setVal('du-rt', data.rt);
    if (data.rw) setVal('du-rw', data.rw);
    if (data.dusun) setVal('du-dusun', data.dusun);
    if (data.kelurahan) setVal('du-kelurahan', data.kelurahan);
    if (data.kecamatan) setVal('du-kecamatan', data.kecamatan);
    if (data.kode_pos) setVal('du-kode-pos', data.kode_pos);
    if (data.lintang) setVal('du-lintang', data.lintang);
    if (data.bujur) setVal('du-bujur', data.bujur);
    if (data.email) setVal('du-email', data.email);
    if (data.phone) setVal('du-phone', data.phone);
    if (data.sekolah_asal) setVal('du-sekolah-asal', data.sekolah_asal);

    // Orang Tua
    if (data.ayah_nama) setVal('du-ayah-nama', data.ayah_nama);
    if (data.ibu_nama) setVal('du-ibu-nama', data.ibu_nama);
  }

  // STEP 1 Action: Verify NISN
  if (btnStep1Next) {
    btnStep1Next.addEventListener('click', async () => {
      let nisnVal = inputNisn.value.trim();
      if (!nisnVal) {
        showModalAlert('Silakan masukkan NISN Anda terlebih dahulu.');
        return;
      }
      
      // Auto-pad leading zero if 9 digits
      if (/^\d{9}$/.test(nisnVal)) {
        nisnVal = '0' + nisnVal;
        inputNisn.value = nisnVal;
      }
      
      if (!/^\d{10}$/.test(nisnVal)) {
        showModalAlert('NISN harus tepat berisi 10 digit angka.');
        return;
      }
      
      btnStep1Next.disabled = true;
      btnStep1Next.innerHTML = 'Memverifikasi...';
      
      try {
        const response = await fetch(`/api/check-nisn/${nisnVal}`);
        const result = await response.json();
        
        if (!response.ok) {
          showModalAlert(result.error || 'Terjadi kesalahan verifikasi.');
        } else if (result.alreadyRegistered) {
          // If already registered, fetch receipt data and display Step 6 directly!
          showModalAlert('Anda sudah melakukan daftar ulang sebelumnya. Memuat tanda bukti...', 'success');
          
          setTimeout(async () => {
            try {
              const receiptResponse = await fetch(`/api/receipt/${nisnVal}`);
              const receiptData = await receiptResponse.json();
              if (receiptResponse.ok && receiptData.success) {
                const reg = receiptData.data;
                document.getElementById('receipt-name').textContent = reg.name;
                document.getElementById('receipt-nisn').textContent = reg.nisn;
                document.getElementById('receipt-session').textContent = reg.queue_session;
                document.getElementById('receipt-qr-img').src = reg.qr_code;
                goToStep(6); // Final success receipt step
              } else {
                showModalAlert('Gagal memuat tanda bukti pendaftaran ulang.');
              }
            } catch (receiptErr) {
              console.error(receiptErr);
              showModalAlert('Kesalahan jaringan memuat tanda bukti.');
            }
          }, 1500);
        } else if (result.eligible) {
          // Success: save NISN and fill student name
          verifiedNisn = nisnVal;
          inputName.value = result.name;
          
          if (result.studentData) {
            prefillFormFields(result.studentData);
          }
          
          goToStep(2);
        }
      } catch (err) {
        console.error(err);
        showModalAlert('Koneksi server gagal. Pastikan server backend Anda berjalan.');
      } finally {
        btnStep1Next.disabled = false;
        btnStep1Next.innerHTML = 'Verifikasi NISN <i data-lucide="check-circle"></i>';
        if (window.lucide) lucide.createIcons();
      }
    });
  }
  
  // STEP 2 Actions: Data Pribadi
  if (btnStep2Prev) {
    btnStep2Prev.addEventListener('click', () => {
      goToStep(1);
    });
  }
  
  if (btnStep2Next) {
    btnStep2Next.addEventListener('click', () => {
      // Basic validations
      const gender = inputGender.value;
      const nik = inputNik.value.trim();
      const noKk = inputNoKk.value.trim();
      const tempatLahir = inputTempatLahir.value.trim();
      const tanggalLahir = inputTanggalLahir.value;
      const noAkta = inputNoAkta.value.trim();
      const agama = inputAgama.value;
      const kewarganegaraan = inputKewarganegaraan.value;
      const kewarganegaraanNegara = inputKewarganegaraanNegara.value.trim();
      const kebutuhanKhusus = inputKebutuhanKhusus.value;
      
      const alamatJalan = inputAlamatJalan.value.trim();
      const rt = inputRt.value.trim();
      const rw = inputRw.value.trim();
      const kelurahan = inputKelurahan.value.trim();
      const kecamatan = inputKecamatan.value.trim();
      const kodePos = inputKodePos.value.trim();
      const tempatTinggal = inputTempatTinggal.value;
      const transportasi = inputTransportasi.value;
      const anakKe = inputAnakKe.value;
      const email = inputEmail.value.trim();
      const phone = inputPhone.value.trim();
      const uniform = inputUniform.value;
      const address = inputAddress.value.trim();
      
      if (!gender || !nik || !noKk || !tempatLahir || !tanggalLahir || !noAkta || !agama || !kewarganegaraan || 
          !alamatJalan || !rt || !rw || !kelurahan || !kecamatan || !kodePos || !tempatTinggal || !transportasi || 
          !anakKe || !email || !phone) {
        showModalAlert('Mohon lengkapi seluruh isian data pribadi wajib yang diberi tanda bintang.');
        return;
      }
      
      if (kewarganegaraan === 'WNA' && !kewarganegaraanNegara) {
        showModalAlert('Silakan isi nama negara kewarganegaraan WNA Anda.');
        return;
      }
      
      if (!/^\d{16}$/.test(nik)) {
        showModalAlert('NIK harus tepat berisi 16 digit angka.');
        return;
      }
      
      if (!/^\d{16}$/.test(noKk)) {
        showModalAlert('Nomor KK harus tepat berisi 16 digit angka.');
        return;
      }
      
      if (!/^\d+$/.test(rt) || !/^\d+$/.test(rw)) {
        showModalAlert('Nomor RT/RW harus berupa angka.');
        return;
      }
      
      if (!/^\d{5}$/.test(kodePos)) {
        showModalAlert('Kode Pos harus tepat berisi 5 digit angka.');
        return;
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showModalAlert('Format alamat email tidak valid.');
        return;
      }
      
      if (!/^\+?\d{9,15}$/.test(phone)) {
        showModalAlert('Format nomor WhatsApp/HP tidak valid. Gunakan 9-15 digit angka.');
        return;
      }
      
      hideModalAlert();
      goToStep(3);
    });
  }
  
  // STEP 3 Actions: Data Orang Tua & Wali
  if (btnStep3Prev) {
    btnStep3Prev.addEventListener('click', () => {
      goToStep(2);
    });
  }
  
  if (btnStep3Next) {
    btnStep3Next.addEventListener('click', () => {
      // Validate Father
      const ayahNama = inputAyahNama.value.trim();
      const ayahNik = inputAyahNik.value.trim();
      const ayahTahunLahir = inputAyahTahunLahir.value;
      const ayahPendidikan = inputAyahPendidikan.value;
      const ayahPekerjaan = inputAyahPekerjaan.value;
      const ayahPenghasilan = inputAyahPenghasilan.value;
      
      // Validate Mother
      const ibuNama = inputIbuNama.value.trim();
      const ibuNik = inputIbuNik.value.trim();
      const ibuTahunLahir = inputIbuTahunLahir.value;
      const ibuPendidikan = inputIbuPendidikan.value;
      const ibuPekerjaan = inputIbuPekerjaan.value;
      const ibuPenghasilan = inputIbuPenghasilan.value;
      
      // Validate Wali (if filled)
      const waliNama = inputWaliNama.value.trim();
      const waliNik = inputWaliNik.value.trim();
      const waliTahunLahir = inputWaliTahunLahir.value;
      const waliPendidikan = inputWaliPendidikan.value;
      const waliPekerjaan = inputWaliPekerjaan.value;
      const waliPenghasilan = inputWaliPenghasilan.value;
      
      if (!ayahNama || !ayahNik || !ayahTahunLahir || !ayahPendidikan || !ayahPekerjaan || !ayahPenghasilan ||
          !ibuNama || !ibuNik || !ibuTahunLahir || !ibuPendidikan || !ibuPekerjaan || !ibuPenghasilan) {
        showModalAlert('Seluruh isian data wajib Ayah Kandung dan Ibu Kandung harus dilengkapi.');
        return;
      }
      
      if (!/^\d{16}$/.test(ayahNik) || !/^\d{16}$/.test(ibuNik)) {
        showModalAlert('NIK Ayah dan Ibu harus berisi 16 digit angka.');
        return;
      }
      
      if (waliNama) {
        if (!waliNik || !waliTahunLahir || !waliPendidikan || !waliPekerjaan || !waliPenghasilan) {
          showModalAlert('Jika mengisi data Wali, maka seluruh detail data Wali wajib dilengkapi.');
          return;
        }
        if (!/^\d{16}$/.test(waliNik)) {
          showModalAlert('NIK Wali harus berisi 16 digit angka.');
          return;
        }
      }
      
      hideModalAlert();
      goToStep(4);
    });
  }
  
  // STEP 4 Actions: Rincian & Registrasi
  if (btnStep4Prev) {
    btnStep4Prev.addEventListener('click', () => {
      goToStep(3);
    });
  }
  
  if (btnStep4Submit) {
    btnStep4Submit.addEventListener('click', async () => {
      const tb = inputTinggiBadan.value;
      const bb = inputBeratBadan.value;
      const lk = inputLingkarKepala.value;
      const saudara = inputJumlahSaudara.value;
      const jarak = inputJarakSekolah.value;
      const jarakKm = inputJarakSekolahKm.value;
      
      const pendaftaran = inputJenisPendaftaran.value;
      const tglMasuk = inputTanggalMasuk.value;
      const sekolahAsal = inputSekolahAsal.value.trim();
      const un = inputNomorPesertaUn.value.trim();
      const ijazah = inputNoSeriIjazah.value.trim();
      
      if (!tb || !bb || !lk || !saudara || !jarak || !pendaftaran || !tglMasuk || !sekolahAsal) {
        showModalAlert('Seluruh isian data periodik dan registrasi wajib harus dilengkapi.');
        return;
      }
      
      if (jarak === 'Lebih dari 1 km' && !jarakKm) {
        showModalAlert('Harap sebutkan jarak tempat tinggal dalam kilometer.');
        return;
      }
      
      hideModalAlert();

      btnStep4Submit.disabled = true;
      const originalBtnText = btnStep4Submit.innerHTML;
      btnStep4Submit.innerHTML = 'Mengirim data pendaftaran... <i class="spinner"></i>';

      const payload = {
        nisn: verifiedNisn,
        name: inputName.value,
        gender: inputGender.value,
        nik: inputNik.value.trim(),
        no_kk: inputNoKk.value.trim(),
        tempat_lahir: inputTempatLahir.value.trim(),
        tanggal_lahir: inputTanggalLahir.value,
        no_akta: inputNoAkta.value.trim(),
        agama: inputAgama.value,
        kewarganegaraan: inputKewarganegaraan.value,
        kewarganegaraan_negara: inputKewarganegaraanNegara.value.trim(),
        kebutuhan_khusus: inputKebutuhanKhusus.value,
        
        alamat_jalan: inputAlamatJalan.value.trim(),
        rt: inputRt.value.trim(),
        rw: inputRw.value.trim(),
        dusun: inputDusun.value.trim(),
        kelurahan: inputKelurahan.value.trim(),
        kecamatan: inputKecamatan.value.trim(),
        kode_pos: inputKodePos.value.trim(),
        lintang: inputLintang.value.trim(),
        bujur: inputBujur.value.trim(),
        tempat_tinggal: inputTempatTinggal.value,
        transportasi: inputTransportasi.value,
        anak_ke: inputAnakKe.value,
        penerima_kip: inputPenerimaKip.value,
        tetap_kip: inputTetapKip.value,
        alasan_tolak_pip: inputAlasanTolakPip.value,
        email: inputEmail.value.trim(),
        phone: inputPhone.value.trim(),
        telepon_rumah: inputTeleponRumah.value.trim(),
        uniform_size: inputUniform.value,
        address: inputAddress.value.trim(),
        
        // Father
        ayah_nama: inputAyahNama.value.trim(),
        ayah_nik: inputAyahNik.value.trim(),
        ayah_tahun_lahir: inputAyahTahunLahir.value,
        ayah_pendidikan: inputAyahPendidikan.value,
        ayah_pekerjaan: inputAyahPekerjaan.value,
        ayah_penghasilan: inputAyahPenghasilan.value,
        ayah_kebutuhan_khusus: inputAyahKebutuhanKhusus.value,
        
        // Mother
        ibu_nama: inputIbuNama.value.trim(),
        ibu_nik: inputIbuNik.value.trim(),
        ibu_tahun_lahir: inputIbuTahunLahir.value,
        ibu_pendidikan: inputIbuPendidikan.value,
        ibu_pekerjaan: inputIbuPekerjaan.value,
        ibu_penghasilan: inputIbuPenghasilan.value,
        ibu_kebutuhan_khusus: inputIbuKebutuhanKhusus.value,
        
        // Wali
        wali_nama: inputWaliNama.value.trim(),
        wali_nik: inputWaliNik.value.trim(),
        wali_tahun_lahir: inputWaliTahunLahir.value,
        wali_pendidikan: inputWaliPendidikan.value,
        wali_pekerjaan: inputWaliPekerjaan.value,
        wali_penghasilan: inputWaliPenghasilan.value,
        
        // Periodik & Registrasi
        tinggi_badan: inputTinggiBadan.value,
        berat_badan: inputBeratBadan.value,
        lingkar_kepala: inputLingkarKepala.value,
        jumlah_saudara: inputJumlahSaudara.value,
        jarak_sekolah: inputJarakSekolah.value,
        jarak_sekolah_km: inputJarakSekolahKm.value,
        waktu_tempuh_jam: inputWaktuTempuhJam.value || '0',
        waktu_tempuh_menit: inputWaktuTempuhMenit.value || '0',
        
        jenis_pendaftaran: inputJenisPendaftaran.value,
        nis: inputNis.value.trim(),
        tanggal_masuk: inputTanggalMasuk.value,
        sekolah_asal: inputSekolahAsal.value.trim(),
        nomor_peserta_un: inputNomorPesertaUn.value.trim(),
        no_seri_ijazah: inputNoSeriIjazah.value.trim(),
        no_skhun: inputNoSkhun.value.trim(),
        
        kesejahteraan_jenis: inputKesejahteraanJenis.value,
        kesejahteraan_no_kartu: inputKesejahteraanNoKartu.value.trim(),
        kesejahteraan_nama_kartu: inputKesejahteraanNamaKartu.value.trim(),
        
        // Prestasi 1-3
        prestasi_1_jenis: document.getElementById('du-prestasi-1-jenis').value,
        prestasi_1_tingkat: document.getElementById('du-prestasi-1-tingkat').value,
        prestasi_1_nama: document.getElementById('du-prestasi-1-nama').value.trim(),
        prestasi_1_tahun: document.getElementById('du-prestasi-1-tahun').value,
        prestasi_1_penyelenggara: document.getElementById('du-prestasi-1-penyelenggara').value.trim(),
        prestasi_1_peringkat: document.getElementById('du-prestasi-1-peringkat').value.trim(),
        
        prestasi_2_jenis: document.getElementById('du-prestasi-2-jenis').value,
        prestasi_2_tingkat: document.getElementById('du-prestasi-2-tingkat').value,
        prestasi_2_nama: document.getElementById('du-prestasi-2-nama').value.trim(),
        prestasi_2_tahun: document.getElementById('du-prestasi-2-tahun').value,
        prestasi_2_penyelenggara: document.getElementById('du-prestasi-2-penyelenggara').value.trim(),
        prestasi_2_peringkat: document.getElementById('du-prestasi-2-peringkat').value.trim(),
        
        prestasi_3_jenis: document.getElementById('du-prestasi-3-jenis').value,
        prestasi_3_tingkat: document.getElementById('du-prestasi-3-tingkat').value,
        prestasi_3_nama: document.getElementById('du-prestasi-3-nama').value.trim(),
        prestasi_3_tahun: document.getElementById('du-prestasi-3-tahun').value,
        prestasi_3_penyelenggara: document.getElementById('du-prestasi-3-penyelenggara').value.trim(),
        prestasi_3_peringkat: document.getElementById('du-prestasi-3-peringkat').value.trim(),
        
        // Beasiswa 1-2
        beasiswa_1_jenis: document.getElementById('du-beasiswa-1-jenis').value,
        beasiswa_1_keterangan: document.getElementById('du-beasiswa-1-keterangan').value.trim(),
        beasiswa_1_tahun_mulai: document.getElementById('du-beasiswa-1-tahun-mulai').value,
        beasiswa_1_tahun_selesai: document.getElementById('du-beasiswa-1-tahun-selesai').value,
        
        beasiswa_2_jenis: document.getElementById('du-beasiswa-2-jenis').value,
        beasiswa_2_keterangan: document.getElementById('du-beasiswa-2-keterangan').value.trim(),
        beasiswa_2_tahun_mulai: document.getElementById('du-beasiswa-2-tahun-mulai').value,
        beasiswa_2_tahun_selesai: document.getElementById('du-beasiswa-2-tahun-selesai').value
      };

      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          showModalAlert(result.error || 'Gagal mengirim berkas pendaftaran ulang.');
        } else {
          // Display Step 5 Receipt
          const reg = result.data;
          document.getElementById('receipt-name').textContent = reg.name;
          document.getElementById('receipt-nisn').textContent = reg.nisn;
          document.getElementById('receipt-reg-number').textContent = reg.registration_number || `SMANDA-PPDB-2026-${reg.nisn}`;
          
          const formattedDate = new Date(reg.registration_date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          document.getElementById('receipt-titimangsa').textContent = `Bandung, ${formattedDate}`;
          
          goToStep(5);
        }
      } catch (err) {
        console.error(err);
        showModalAlert('Terjadi kesalahan jaringan dalam mengirim berkas.');
      } finally {
        btnStep4Submit.disabled = false;
        btnStep4Submit.innerHTML = originalBtnText;
        if (window.lucide) lucide.createIcons();
      }
    });
  }

  // Save receipt as image
  if (btnPrintReceipt) {
    btnPrintReceipt.addEventListener('click', () => {
      const nisn = document.getElementById('receipt-nisn').textContent || 'Siswa';
      downloadCardAsImage('print-receipt-area', `Tiket_DaftarUlang_${nisn}.png`);
    });
  }

  // Close receipt modal
  if (btnCloseReceipt) {
    btnCloseReceipt.addEventListener('click', closeModalDU);
  }

  // === 15. HERO VIDEO SOUND TOGGLE ===
  const heroVideo = document.querySelector('.hero-image-frame video');
  const soundToggleBtn = document.getElementById('hero-video-sound-toggle');
  
  if (heroVideo && soundToggleBtn) {
    // Try to play unmuted by default
    heroVideo.muted = false;
    
    const playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Autoplay unmuted succeeded
        soundToggleBtn.innerHTML = '<i data-lucide="volume-2"></i>';
        soundToggleBtn.setAttribute('aria-label', 'Matikan Suara');
        if (window.lucide) window.lucide.createIcons();
      }).catch(err => {
        // Autoplay unmuted blocked: fallback to muted autoplay
        console.log("Browser policy blocked unmuted autoplay. Playing muted.");
        heroVideo.muted = true;
        heroVideo.play().catch(console.error);
        soundToggleBtn.innerHTML = '<i data-lucide="volume-x"></i>';
        soundToggleBtn.setAttribute('aria-label', 'Aktifkan Suara');
        if (window.lucide) window.lucide.createIcons();
      });
    }

    soundToggleBtn.addEventListener('click', () => {
      heroVideo.muted = !heroVideo.muted;
      if (heroVideo.muted) {
        soundToggleBtn.innerHTML = '<i data-lucide="volume-x"></i>';
        soundToggleBtn.setAttribute('aria-label', 'Aktifkan Suara');
      } else {
        soundToggleBtn.innerHTML = '<i data-lucide="volume-2"></i>';
        soundToggleBtn.setAttribute('aria-label', 'Matikan Suara');
      }
      if (window.lucide) {
        window.lucide.createIcons();
      }
    });
  }

  // === 16. DETAILED REQUIREMENTS MODAL LOGIC ===
  const openBerkasModalBtn = document.getElementById('btn-berkas-modal');
  const berkasModal = document.getElementById('berkas-modal');
  const closeBerkasModalBtn = document.getElementById('close-berkas-modal');
  
  if (openBerkasModalBtn && berkasModal) {
    openBerkasModalBtn.addEventListener('click', (e) => {
      e.preventDefault();
      berkasModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    
    const closeBerkasModal = () => {
      berkasModal.classList.remove('active');
      document.body.style.overflow = '';
    };
    
    if (closeBerkasModalBtn) {
      closeBerkasModalBtn.addEventListener('click', closeBerkasModal);
    }
    
    berkasModal.addEventListener('click', (e) => {
      if (e.target === berkasModal) closeBerkasModal();
    });
    
    // Tab switching logic
    const tabUmumBtn = document.getElementById('tab-umum-btn');
    const tabKhususBtn = document.getElementById('tab-khusus-btn');
    const tabUmumContent = document.getElementById('tab-umum-content');
    const tabKhususContent = document.getElementById('tab-khusus-content');
    
    if (tabUmumBtn && tabKhususBtn && tabUmumContent && tabKhususContent) {
      tabUmumBtn.addEventListener('click', () => {
        tabUmumBtn.classList.add('active');
        tabKhususBtn.classList.remove('active');
        tabUmumContent.classList.add('active-content');
        tabKhususContent.classList.remove('active-content');
      });
      
      tabKhususBtn.addEventListener('click', () => {
        tabKhususBtn.classList.add('active');
        tabUmumBtn.classList.remove('active');
        tabKhususContent.classList.add('active-content');
        tabUmumContent.classList.remove('active-content');
      });
    }
  }

  // === MISSION SLIDER LOGIC ===
  const initMissionSlider = () => {
    const slides = document.querySelectorAll('.mission-slide');
    const prevBtn = document.getElementById('mission-prev');
    const nextBtn = document.getElementById('mission-next');
    const currentNumSpan = document.getElementById('current-mission-num');
    
    if (slides.length === 0) return;
    
    let currentIdx = 0;
    
    const showSlide = (idx) => {
      // Hide current slide
      slides[currentIdx].classList.remove('active');
      
      // Update index
      currentIdx = (idx + slides.length) % slides.length;
      
      // Show new slide
      slides[currentIdx].classList.add('active');
      
      // Update number in author text
      if (currentNumSpan) {
        currentNumSpan.textContent = currentIdx + 1;
      }
    };
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        showSlide(currentIdx - 1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        showSlide(currentIdx + 1);
      });
    }
  };
  initMissionSlider();

  // === INSTAGRAM LIVE FEED LOADER ===
  initInstagramFeed();

  // === 17. PPID CONSULTATION (ANTREAN KONSULTASI) LOGIC ===
  const btnsOpenPpid = document.querySelectorAll('.btn-open-ppid');
  const ppidModal = document.getElementById('ppid-modal');
  const btnClosePpidModal = document.getElementById('close-ppid-modal');
  const btnClosePpidForm = document.getElementById('btn-close-ppid-form');
  const btnClosePpidReceipt = document.getElementById('btn-close-ppid-receipt');
  const ppidFormStep = document.getElementById('ppid-form-step');
  const ppidReceiptStep = document.getElementById('ppid-receipt-step');
  const ppidRegistrationForm = document.getElementById('ppid-registration-form');
  const ppidAlert = document.getElementById('ppid-alert');
  
  const ppidInputDate = document.getElementById('ppid-date');
  const ppidSelectSession = document.getElementById('ppid-session');
  const ppidOptPagi = document.getElementById('ppid-opt-pagi');
  const ppidOptSiang = document.getElementById('ppid-opt-siang');
  const btnPrintPpid = document.getElementById('btn-print-ppid');
  const ppidSelectTopic = document.getElementById('ppid-topic');
  const ppidVerifikatorGroup = document.getElementById('ppid-verifikator-group');
  const ppidSelectVerifikator = document.getElementById('ppid-verifikator');

  function showPpidAlert(message, type = 'error') {
    if (!ppidAlert) return;
    ppidAlert.textContent = message;
    ppidAlert.className = `modal-alert ${type}`;
    ppidAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hidePpidAlert() {
    if (ppidAlert) {
      ppidAlert.className = 'modal-alert hidden';
      ppidAlert.textContent = '';
    }
  }

  // Setup Date Constraints (Only weekdays, today to +14 calendar days)
  function setupPpidDateConstraints() {
    if (!ppidInputDate) return;
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    ppidInputDate.min = todayStr;

    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 14); // Limit to 14 days ahead
    ppidInputDate.max = maxDate.toISOString().split('T')[0];
  }

  // Check density of sessions on date change
  if (ppidInputDate) {
    ppidInputDate.addEventListener('change', async () => {
      const selectedDateStr = ppidInputDate.value;
      if (!selectedDateStr) return;

      const selectedDate = new Date(selectedDateStr);
      const day = selectedDate.getDay();

      // Check if it's a Sunday (Sunday=0)
      if (day === 0) {
        showPpidAlert('Mohon maaf, layanan konsultasi PPID libur pada hari Minggu. Silakan pilih hari pelayanan (Senin - Sabtu).');
        ppidInputDate.value = '';
        ppidSelectSession.disabled = true;
        ppidSelectSession.selectedIndex = 0;
        return;
      }

      hidePpidAlert();
      ppidSelectSession.disabled = true;
      ppidOptPagi.textContent = 'Memuat status antrean...';
      ppidOptSiang.textContent = 'Memuat status antrean...';

      try {
        const response = await fetch(`/api/ppid/session-count?date=${selectedDateStr}`);
        const result = await response.json();

        if (response.ok && result.success) {
          if (result.pagi >= 500) {
            ppidOptPagi.disabled = true;
            ppidOptPagi.textContent = `Sesi Pagi (08:00 - 12:00 WIB) [PENUH / 500 Antrean]`;
          } else {
            ppidOptPagi.disabled = false;
            ppidOptPagi.textContent = `Sesi Pagi (08:00 - 12:00 WIB) [${result.pagi}/500 Terdaftar]`;
          }

          if (result.siang >= 500) {
            ppidOptSiang.disabled = true;
            ppidOptSiang.textContent = `Sesi Siang (13:00 - 14:30 WIB) [PENUH / 500 Antrean]`;
          } else {
            ppidOptSiang.disabled = false;
            ppidOptSiang.textContent = `Sesi Siang (13:00 - 14:30 WIB) [${result.siang}/500 Terdaftar]`;
          }
          
          ppidSelectSession.disabled = false;
          ppidSelectSession.selectedIndex = 0;

          if (result.pagi >= 500 && result.siang >= 500) {
            showPpidAlert('Mohon maaf, semua sesi antrean pada tanggal ini sudah penuh. Silakan pilih tanggal lain.', 'warning');
          }
        } else {
          showPpidAlert('Gagal memuat status antrean untuk tanggal ini.');
        }
      } catch (err) {
        console.error('Error fetching session counts:', err);
        showPpidAlert('Gagal terhubung ke server untuk mengecek ketersediaan antrean.');
      }
    });
  }

  // Reset form state
  function resetPpidForm() {
    if (ppidRegistrationForm) ppidRegistrationForm.reset();
    if (ppidSelectSession) {
      ppidSelectSession.disabled = true;
      ppidSelectSession.selectedIndex = 0;
    }
    if (ppidVerifikatorGroup) ppidVerifikatorGroup.style.display = 'none';
    if (ppidSelectVerifikator) {
      ppidSelectVerifikator.required = false;
      ppidSelectVerifikator.selectedIndex = 0;
    }
    if (ppidOptPagi) {
      ppidOptPagi.disabled = false;
      ppidOptPagi.textContent = 'Sesi Pagi (08:00 - 12:00 WIB)';
    }
    if (ppidOptSiang) {
      ppidOptSiang.disabled = false;
      ppidOptSiang.textContent = 'Sesi Siang (13:00 - 14:30 WIB)';
    }
    if (ppidFormStep) ppidFormStep.classList.add('active');
    if (ppidReceiptStep) ppidReceiptStep.classList.remove('active');
    hidePpidAlert();
  }

  // Handle Topic Change (Toggle Verifikator Dropdown)
  if (ppidSelectTopic) {
    ppidSelectTopic.addEventListener('change', () => {
      if (ppidSelectTopic.value === 'Memenuhi Panggilan Verifikator') {
        if (ppidVerifikatorGroup) ppidVerifikatorGroup.style.display = 'block';
        if (ppidSelectVerifikator) ppidSelectVerifikator.required = true;
      } else {
        if (ppidVerifikatorGroup) ppidVerifikatorGroup.style.display = 'none';
        if (ppidSelectVerifikator) {
          ppidSelectVerifikator.required = false;
          ppidSelectVerifikator.selectedIndex = 0;
        }
      }
    });
  }

  // Event Listeners for Open Modal
  if (btnsOpenPpid && ppidModal) {
    btnsOpenPpid.forEach(btn => {
      btn.addEventListener('click', () => {
        resetPpidForm();
        setupPpidDateConstraints();
        ppidModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });
  }

  // Event Listeners for Close Modal
  const closePpidModal = () => {
    if (ppidModal) {
      ppidModal.classList.remove('active');
      document.body.style.overflow = '';
      resetPpidForm();
    }
  };

  if (btnClosePpidModal) btnClosePpidModal.addEventListener('click', closePpidModal);
  if (btnClosePpidForm) btnClosePpidForm.addEventListener('click', closePpidModal);
  if (btnClosePpidReceipt) btnClosePpidReceipt.addEventListener('click', closePpidModal);
  if (ppidModal) {
    ppidModal.addEventListener('click', (e) => {
      if (e.target === ppidModal) closePpidModal();
    });
  }

  // Handle PPID Form Submit
  if (ppidRegistrationForm) {
    ppidRegistrationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const topicValue = document.getElementById('ppid-topic').value;
      const verifikatorValue = document.getElementById('ppid-verifikator').value;
      let topic = topicValue;
      if (topicValue === 'Memenuhi Panggilan Verifikator') {
        if (!verifikatorValue) {
          showPpidAlert('Nama verifikator wajib dipilih.');
          return;
        }
        topic = `Panggilan Verifikator: ${verifikatorValue}`;
      }

      const name = document.getElementById('ppid-name').value;
      const role = document.getElementById('ppid-role').value;
      const phone = document.getElementById('ppid-phone').value;
      const date = document.getElementById('ppid-date').value;
      const session = document.getElementById('ppid-session').value;

      if (!name || !role || !phone || !topic || !date || !session) {
        showPpidAlert('Semua isian formulir wajib diisi.');
        return;
      }

      if (!/^\+?\d{9,15}$/.test(phone)) {
        showPpidAlert('Format nomor WhatsApp tidak valid. Gunakan minimal 9-15 digit angka.');
        return;
      }

      const submitBtn = document.getElementById('btn-submit-ppid');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Mendaftarkan...';
      hidePpidAlert();

      try {
        const response = await fetch('/api/ppid/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, role, phone, topic, consultation_date: date, session })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          const reg = result.data;
          
          // Render Ticket
          document.getElementById('ppid-receipt-number').textContent = reg.queue_number;
          document.getElementById('ppid-receipt-name').textContent = reg.name;
          
          // Format date to local Indonesian format
          const formattedDate = new Date(reg.consultation_date).toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          document.getElementById('ppid-receipt-date').textContent = formattedDate;
          document.getElementById('ppid-receipt-session').textContent = reg.session;
          document.getElementById('ppid-receipt-qr-img').src = reg.qr_code;

          // Switch steps
          ppidFormStep.classList.remove('active');
          ppidReceiptStep.classList.add('active');
        } else {
          showPpidAlert(result.error || 'Gagal mendaftar antrean.');
        }
      } catch (err) {
        console.error('PPID Register Submit Error:', err);
        showPpidAlert('Koneksi server gagal. Silakan coba kembali.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  // Ticket Preview Modal DOM elements
  const ticketPreviewModal = document.getElementById('ticket-preview-modal');
  const ticketPreviewImg = document.getElementById('ticket-preview-img');
  const btnClosePreviewModal = document.getElementById('close-preview-modal');
  const btnFallbackDownload = document.getElementById('btn-fallback-download');

  let currentDownloadDataUrl = '';
  let currentDownloadFilename = '';

  // Setup Preview Modal Closing
  const closePreviewModal = () => {
    if (ticketPreviewModal) {
      ticketPreviewModal.classList.remove('active');
    }
  };

  if (btnClosePreviewModal) btnClosePreviewModal.addEventListener('click', closePreviewModal);
  if (ticketPreviewModal) {
    ticketPreviewModal.addEventListener('click', (e) => {
      if (e.target === ticketPreviewModal) closePreviewModal();
    });
  }

  // Fallback Download Button
  if (btnFallbackDownload) {
    btnFallbackDownload.addEventListener('click', () => {
      if (currentDownloadDataUrl && currentDownloadFilename) {
        const link = document.createElement('a');
        link.download = currentDownloadFilename;
        link.href = currentDownloadDataUrl;
        document.body.appendChild(link); // Append to body for better browser support
        link.click();
        document.body.removeChild(link);
      }
    });
  }

  // Helper to save a card as an image using html2canvas
  function downloadCardAsImage(elementId, filename) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    if (typeof html2canvas === 'undefined') {
      alert('Library html2canvas belum termuat. Silakan screenshot layar HP Anda.');
      return;
    }

    // Show loading indicator on button if possible
    const activeBtn = document.activeElement;
    let prevBtnContent = '';
    if (activeBtn && activeBtn.classList.contains('btn')) {
      prevBtnContent = activeBtn.innerHTML;
      activeBtn.disabled = true;
      activeBtn.innerHTML = 'Memproses... <i style="width: 12px; height: 12px; display: inline-block; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 0.75s linear infinite; vertical-align: middle; margin-left: 6px;"></i>';
    }

    // Temporarily remove shadow for clean image export
    const prevBoxShadow = element.style.boxShadow;
    element.style.boxShadow = 'none';

    // Wait a tiny bit for UI update
    setTimeout(() => {
      html2canvas(element, {
        scale: 2.5, // 2.5x resolution for crystal clear capture
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc' // Light gray ticket background
      }).then(canvas => {
        // Restore style
        element.style.boxShadow = prevBoxShadow;
        
        // Restore button state
        if (activeBtn && prevBtnContent) {
          activeBtn.disabled = false;
          activeBtn.innerHTML = prevBtnContent;
        }

        const dataUrl = canvas.toDataURL('image/png');
        currentDownloadDataUrl = dataUrl;
        currentDownloadFilename = filename;

        // 1. Try to download automatically (might be blocked on mobile/webview)
        const link = document.createElement('a');
        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 2. Always show preview modal as fallback and visual confirmation
        if (ticketPreviewImg && ticketPreviewModal) {
          ticketPreviewImg.src = dataUrl;
          ticketPreviewModal.classList.add('active');
          if (window.lucide) window.lucide.createIcons();
        }

      }).catch(err => {
        element.style.boxShadow = prevBoxShadow;
        if (activeBtn && prevBtnContent) {
          activeBtn.disabled = false;
          activeBtn.innerHTML = prevBtnContent;
        }
        console.error('Error html2canvas capture:', err);
        alert('Gagal membuat gambar tiket. Silakan tangkap layar (screenshot) HP Anda.');
      });
    }, 150);
  }

  // Save PPID ticket as image
  if (btnPrintPpid) {
    btnPrintPpid.addEventListener('click', () => {
      const queueNum = document.getElementById('ppid-receipt-number').textContent || 'Antrean';
      downloadCardAsImage('print-ppid-area', `Tiket_Antrean_PPID_${queueNum}.png`);
    });
  }
});

/**
 * Loads Instagram embed posts from the backend API and renders them
 * as official Instagram blockquote embeds with carousel navigation.
 */
async function initInstagramFeed() {
  const track = document.getElementById('ig-feed-track');
  const prevBtn = document.getElementById('ig-prev');
  const nextBtn = document.getElementById('ig-next');

  if (!track) return;

  function escapeHtmlHelper(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  try {
    const res = await fetch('/api/instagram-posts');
    const data = await res.json();

    if (!data.success || !data.posts || data.posts.length === 0) {
      track.innerHTML = `
        <div style="text-align:center; padding: 48px; color: var(--text-muted); width:100%;">
          <i style="font-size:48px; opacity:0.3;">📷</i>
          <p style="margin-top:16px; font-size:15px;">Belum ada postingan yang ditambahkan.<br>
          Silakan tambahkan URL postingan Instagram di panel Admin.</p>
          <a href="/admin.html" style="color:var(--secondary); font-weight:600; text-decoration:none; font-size:14px;">
            → Buka Panel Admin
          </a>
        </div>`;
      return;
    }

    const posts = data.posts;

    // Build embed HTML for each post
    track.innerHTML = posts.map(post => {
      // Normalize URL: ensure trailing slash and no query params
      const cleanUrl = post.post_url.split('?')[0].replace(/\/?$/, '/');
      return `
        <div class="ig-embed-card">
          <blockquote
            class="instagram-media"
            data-instgrm-permalink="${cleanUrl}"
            data-instgrm-version="14"
            style="background:var(--bg-card); border:0; border-radius:var(--radius-lg); box-shadow:var(--shadow-md);
                   margin: 0; max-width: 100%; width: 100%;
                   padding: 0; overflow: hidden;">
            <div style="padding: 16px; display:flex; align-items:center; gap:12px;">
              <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);"></div>
              <div>
                <div style="height:12px;width:100px;background:#eee;border-radius:4px;margin-bottom:6px;"></div>
                <div style="height:10px;width:70px;background:#eee;border-radius:4px;"></div>
              </div>
            </div>
            <div style="aspect-ratio:1;background:linear-gradient(135deg,#e0e0e0 25%,#f5f5f5 50%,#e0e0e0 75%);background-size:200% 200%;animation:igSkeleton 1.4s ease infinite;"></div>
            <div style="padding:12px 16px;">
              <div style="height:12px;width:90%;background:#eee;border-radius:4px;margin-bottom:8px;"></div>
              <div style="height:12px;width:70%;background:#eee;border-radius:4px;"></div>
            </div>
          </blockquote>
        </div>`;
    }).join('');

    // Add CSS for skeleton animation if not present
    if (!document.getElementById('ig-skeleton-style')) {
      const style = document.createElement('style');
      style.id = 'ig-skeleton-style';
      style.textContent = `
        @keyframes igSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .ig-embed-card { flex: 0 0 auto; width: 328px; }
        @media (max-width: 480px) { .ig-embed-card { width: 280px; } }
      `;
      document.head.appendChild(style);
    }

    // Show carousel nav buttons
    if (prevBtn) prevBtn.style.display = '';
    if (nextBtn) nextBtn.style.display = '';

    // Load Instagram embed.js and process embeds
    loadInstagramEmbedScript(() => {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
    });

    // Timeout fallback if Instagram script fails to load, process, or the iframe is blocked/collapsed
    setTimeout(() => {
      const cards = track.querySelectorAll('.ig-embed-card');
      let fallbackTriggered = false;

      cards.forEach((card, index) => {
        const blockquote = card.querySelector('blockquote.instagram-media');
        const iframe = card.querySelector('iframe');
        
        let needsFallback = false;
        let reason = "";

        if (blockquote) {
          needsFallback = true;
          reason = "blockquote not processed (script blocked)";
        } else if (iframe) {
          // If the iframe exists, check if it's collapsed or hidden (blocked by adblocker/incognito)
          const rect = iframe.getBoundingClientRect();
          const style = window.getComputedStyle(iframe);
          const isHidden = style.display === 'none' || style.visibility === 'hidden';
          if (rect.height < 100 || isHidden) {
            needsFallback = true;
            reason = `iframe collapsed or hidden (height: ${rect.height}px, display: ${style.display})`;
          }
        } else {
          // No embed found inside card
          needsFallback = true;
          reason = "no embed element found";
        }

        if (needsFallback) {
          fallbackTriggered = true;
          console.warn(`Instagram post ${index + 1} fallback triggered: ${reason}`);
          
          const post = posts[index] || {};
          const postUrl = post.post_url;
          const captionText = post.caption || "Lihat postingan terbaru @smandabandung di Instagram.";
          
          card.innerHTML = `
            <div class="instagram-fallback-card" style="padding: 20px; background: var(--bg-card); 
                        border: 1px solid var(--border-color); border-radius: var(--radius-lg); 
                        box-shadow: var(--shadow-md); display: flex; flex-direction: column; 
                        gap: 14px; height: 380px; justify-content: space-between; text-align: left; 
                        box-sizing: border-box; position: relative; overflow: hidden;">
              <!-- Instagram Gradient Accent Line at the top -->
              <div style="position: absolute; top: 0; left: 0; right: 0; height: 4px; 
                          background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);"></div>
              
              <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px;">
                <div style="width: 36px; height: 36px; border-radius: 50%; 
                            background: linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); 
                            display: flex; align-items: center; justify-content: center; color: white; 
                            font-size: 16px; box-shadow: var(--shadow-sm);">
                  <i data-lucide="instagram" style="width: 18px; height: 18px; stroke-width: 2.5;"></i>
                </div>
                <div>
                  <h5 style="margin: 0; font-size: 13px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display);">@smandabandung</h5>
                  <span style="font-size: 10px; color: var(--text-muted);">Postingan Ke-${index+1}</span>
                </div>
              </div>
              
              <!-- Placeholder Graphic for Instagram Post -->
              <div style="background: var(--bg-body); border-radius: var(--radius-md); border: 1px dashed var(--border-color);
                          display: flex; flex-direction: column; align-items: center; justify-content: center; 
                          flex-grow: 1; padding: 12px; text-align: center; gap: 6px; margin: 2px 0;">
                <i data-lucide="image-off" style="width: 24px; height: 24px; color: var(--text-muted); opacity: 0.6;"></i>
                <span style="font-size: 11px; color: var(--text-muted); max-width: 90%;">
                  Konten terblokir oleh browser/adblocker Anda
                </span>
              </div>

              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; 
                        overflow: hidden; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; 
                        margin: 0; min-height: 72px; font-family: var(--font-sans);">
                ${escapeHtmlHelper(captionText)}
              </p>
              
              <a href="${postUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-gold" 
                 style="padding: 10px 16px; font-size: 12px; width: 100%; border-radius: var(--radius-md); 
                        text-align: center; text-decoration: none; display: inline-flex; align-items: center; 
                        justify-content: center; gap: 8px; box-sizing: border-box; font-weight: 600;">
                Buka di Instagram <i data-lucide="external-link" style="width:14px;height:14px;"></i>
              </a>
            </div>
          `;
        }
      });

      // Re-initialize Lucide icons if fallback was rendered
      if (fallbackTriggered && window.lucide) {
        window.lucide.createIcons();
      }
    }, 3500);

    // Setup carousel navigation
    setupIgCarousel(track, prevBtn, nextBtn, 328 + 20);

  } catch (err) {
    console.error('Gagal memuat feed Instagram:', err);
    track.innerHTML = `
      <div style="text-align:center; padding: 48px; color: var(--text-muted); width:100%;">
        <p>Gagal memuat feed Instagram. Coba refresh halaman.</p>
      </div>`;
  }
}

/**
 * Dynamically loads Instagram embed.js script (idempotent).
 * @param {Function} callback - Called after script loads
 */
function loadInstagramEmbedScript(callback) {
  if (window.instgrm) {
    callback();
    return;
  }
  const existing = document.getElementById('instagram-embed-script');
  if (existing) {
    existing.addEventListener('load', callback);
    return;
  }
  const script = document.createElement('script');
  script.id = 'instagram-embed-script';
  script.src = 'https://www.instagram.com/embed.js';
  script.async = true;
  script.defer = true;
  script.onload = callback;
  document.body.appendChild(script);
}

/**
 * Sets up prev/next carousel navigation for the Instagram feed track.
 */
function setupIgCarousel(track, prevBtn, nextBtn, cardWidth) {
  let currentIndex = 0;
  const cards = track.querySelectorAll('.ig-embed-card');
  const visibleCount = () => Math.max(1, Math.floor(track.offsetWidth / cardWidth));
  const maxIndex = () => Math.max(0, cards.length - visibleCount());

  const updateNav = () => {
    if (prevBtn) prevBtn.style.opacity = currentIndex === 0 ? '0.3' : '1';
    if (nextBtn) nextBtn.style.opacity = currentIndex >= maxIndex() ? '0.3' : '1';
  };

  const scrollTo = (idx) => {
    currentIndex = Math.max(0, Math.min(idx, maxIndex()));
    track.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
    updateNav();
  };

  if (prevBtn) prevBtn.addEventListener('click', () => scrollTo(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => scrollTo(currentIndex + 1));

  // Sync index on manual scroll
  track.addEventListener('scroll', () => {
    currentIndex = Math.round(track.scrollLeft / cardWidth);
    updateNav();
  });

  updateNav();
}


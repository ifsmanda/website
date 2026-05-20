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

  // === 14. DAFTAR ULANG ONLINE MODAL & MULTI-STEP LOGIC ===
  const btnOpenDaftarUlang = document.getElementById('btn-open-daftar-ulang');
  const daftarUlangModal = document.getElementById('daftar-ulang-modal');
  const btnCloseDaftarUlang = document.getElementById('close-daftar-ulang-modal');
  const duAlert = document.getElementById('daftar-ulang-alert');
  
  // Steps and Indicators
  const formSteps = document.querySelectorAll('.form-step-content');
  const indicators = document.querySelectorAll('.step-indicator-item');
  
  // Form Inputs
  const inputNisn = document.getElementById('du-nisn');
  const inputName = document.getElementById('du-name');
  const inputEmail = document.getElementById('du-email');
  const inputPhone = document.getElementById('du-phone');
  const inputUniform = document.getElementById('du-uniform');
  const inputAddress = document.getElementById('du-address');
  
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
  const btnStep3Submit = document.getElementById('btn-step3-submit');
  const btnPrintReceipt = document.getElementById('btn-print-receipt');
  const btnCloseReceipt = document.getElementById('btn-close-receipt');
  
  let currentStep = 1;
  let verifiedNisn = '';
  
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
    if (inputName) inputName.value = '';
    if (inputEmail) inputEmail.value = '';
    if (inputPhone) inputPhone.value = '';
    if (inputUniform) inputUniform.selectedIndex = 0;
    if (inputAddress) inputAddress.value = '';
    if (fileKk) fileKk.value = '';
    if (filePpdb) filePpdb.value = '';
    if (nameKk) nameKk.textContent = 'Belum ada file terpilih';
    if (namePpdb) namePpdb.textContent = 'Belum ada file terpilih';
  }

  // Open modal
  if (btnOpenDaftarUlang && daftarUlangModal) {
    btnOpenDaftarUlang.addEventListener('click', () => {
      resetDaftarUlangForm();
      daftarUlangModal.classList.add('active');
      document.body.style.overflow = 'hidden';
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

  // STEP 1 Action: Verify NISN
  if (btnStep1Next) {
    btnStep1Next.addEventListener('click', async () => {
      const nisnVal = inputNisn.value.trim();
      if (!nisnVal) {
        showModalAlert('Silakan masukkan NISN Anda terlebih dahulu.');
        return;
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
          // If already registered, fetch receipt data and display Step 4 directly!
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
                goToStep(4);
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

  // STEP 2 Actions
  if (btnStep2Prev) {
    btnStep2Prev.addEventListener('click', () => {
      goToStep(1);
    });
  }

  if (btnStep2Next) {
    btnStep2Next.addEventListener('click', () => {
      const email = inputEmail.value.trim();
      const phone = inputPhone.value.trim();
      const uniform = inputUniform.value;
      const address = inputAddress.value.trim();

      if (!email || !phone || !uniform || !address) {
        showModalAlert('Semua isian formulir biodata wajib diisi.');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showModalAlert('Format alamat email tidak valid.');
        return;
      }

      if (!/^\+?\d{9,15}$/.test(phone)) {
        showModalAlert('Format nomor WhatsApp tidak valid. Masukkan minimal 9-15 digit angka.');
        return;
      }

      hideModalAlert();
      goToStep(3);
    });
  }

  // STEP 3 Actions
  if (btnStep3Prev) {
    btnStep3Prev.addEventListener('click', () => {
      goToStep(2);
    });
  }

  if (btnStep3Submit) {
    btnStep3Submit.addEventListener('click', async () => {
      if (!fileKk.files.length || !filePpdb.files.length) {
        showModalAlert('Unggahan dokumen Kartu Keluarga dan Bukti Kelulusan PPDB wajib diunggah.');
        return;
      }

      btnStep3Submit.disabled = true;
      btnStep3Submit.innerHTML = 'Mengirim berkas...';

      const formData = new FormData();
      formData.append('nisn', verifiedNisn);
      formData.append('name', inputName.value);
      formData.append('email', inputEmail.value.trim());
      formData.append('phone', inputPhone.value.trim());
      formData.append('uniform_size', inputUniform.value);
      formData.append('address', inputAddress.value.trim());
      formData.append('kk_file', fileKk.files[0]);
      formData.append('ppdb_file', filePpdb.files[0]);

      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (!response.ok) {
          showModalAlert(result.error || 'Gagal mengirim berkas pendaftaran ulang.');
        } else {
          // Display Step 4 Receipt
          const reg = result.data;
          document.getElementById('receipt-name').textContent = reg.name;
          document.getElementById('receipt-nisn').textContent = reg.nisn;
          document.getElementById('receipt-session').textContent = reg.queue_session;
          document.getElementById('receipt-qr-img').src = reg.qr_code;
          goToStep(4);
        }
      } catch (err) {
        console.error(err);
        showModalAlert('Terjadi kesalahan jaringan dalam mengirim berkas.');
      } finally {
        btnStep3Submit.disabled = false;
        btnStep3Submit.innerHTML = 'Kirim Pendaftaran Ulang <i data-lucide="send"></i>';
        if (window.lucide) lucide.createIcons();
      }
    });
  }

  // Print receipt
  if (btnPrintReceipt) {
    btnPrintReceipt.addEventListener('click', () => {
      window.print();
    });
  }

  // Close receipt modal
  if (btnCloseReceipt) {
    btnCloseReceipt.addEventListener('click', closeModalDU);
  }
});

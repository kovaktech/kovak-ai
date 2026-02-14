// ===== Demo Banner =====
document.addEventListener('DOMContentLoaded', () => {
    const banner = document.getElementById('demoBanner');
    const closeBtn = document.getElementById('bannerClose');
    const navbar = document.querySelector('.navbar');
    
    // Hide banner if already closed this session
    if (sessionStorage.getItem('bannerClosed') === 'true' && banner) {
        banner.classList.add('hidden');
        if (navbar) navbar.style.top = '0';
    }
    
    // Close button click
    closeBtn?.addEventListener('click', () => {
        if (banner) {
            banner.classList.add('hidden');
            if (navbar) navbar.style.top = '0';
            sessionStorage.setItem('bannerClosed', 'true');
        }
    });
});

// ===== Theme Toggle =====
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'dark';
if (savedTheme === 'light') {
    body.setAttribute('data-theme', 'light');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}

themeToggle?.addEventListener('click', () => {
    const isLight = body.getAttribute('data-theme') === 'light';
    if (isLight) {
        body.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        body.setAttribute('data-theme', 'light');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'light');
    }
});

// ===== Animate Stats Counter =====
function animateCounter(element, target, suffix = '') {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + suffix;
            clearInterval(timer);
        } else {
            element.textContent = current.toFixed(1) + suffix;
        }
    }, duration / steps);
}

// Observe stats and animate when visible
const statValues = document.querySelectorAll('.stat-value[data-count]');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseFloat(entry.target.dataset.count);
            animateCounter(entry.target, target);
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

statValues.forEach(stat => observer.observe(stat));

// ===== File Upload Handling =====
const uploadZone = document.getElementById('uploadZone');
const fileInput = document.getElementById('fileInput');
const uploadContent = document.getElementById('uploadContent');
const previewSection = document.getElementById('previewSection');
const resultSection = document.getElementById('resultSection');

if (uploadZone && fileInput) {
    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, () => {
            uploadZone.classList.remove('drag-over');
        });
    });

    uploadZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length) handleFile(files[0]);
    });

    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length) handleFile(fileInput.files[0]);
    });
}

function handleFile(file) {
    const validTypes = {
        audio: ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg'],
        video: ['video/mp4', 'video/webm', 'video/quicktime'],
        image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    };

    let fileType = null;
    for (const [type, mimes] of Object.entries(validTypes)) {
        if (mimes.includes(file.type) || file.type.startsWith(type)) {
            fileType = type;
            break;
        }
    }

    if (!fileType) {
        alert('Desteklenmeyen dosya türü. Lütfen ses, video veya görsel dosyası yükleyin.');
        return;
    }

    showPreview(file, fileType);
    simulateAnalysis(file, fileType);
}

function showPreview(file, fileType) {
    const previewContent = document.getElementById('previewContent');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileTypeEl = document.getElementById('fileType');

    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileTypeEl.textContent = fileType.charAt(0).toUpperCase() + fileType.slice(1);

    const url = URL.createObjectURL(file);

    if (fileType === 'audio') {
        previewContent.innerHTML = `
            <div class="audio-preview">
                <audio id="audioPlayer" src="${url}"></audio>
                <div class="waveform-container">
                    <canvas id="waveformCanvas"></canvas>
                    <div class="playhead" id="playhead"></div>
                </div>
                <div class="audio-controls">
                    <button class="play-btn" id="playBtn">
                        <i class="fas fa-play"></i>
                    </button>
                    <span class="time-display">
                        <span id="currentTime">0:00</span> / <span id="duration">0:00</span>
                    </span>
                </div>
            </div>
        `;
        setupAudioPlayer(url);
    } else if (fileType === 'video') {
        previewContent.innerHTML = `
            <div class="video-preview">
                <video id="videoPlayer" src="${url}"></video>
                <div class="video-overlay" id="videoOverlay">
                    <button class="play-btn-large" id="videoPlayBtn">
                        <i class="fas fa-play"></i>
                    </button>
                </div>
                <div class="video-timeline">
                    <div class="timeline-track">
                        <div class="timeline-progress" id="videoProgress"></div>
                        <div class="timeline-heatmap" id="videoHeatmap"></div>
                    </div>
                </div>
            </div>
        `;
        setupVideoPlayer();
    } else if (fileType === 'image') {
        previewContent.innerHTML = `
            <div class="image-preview">
                <div class="image-container">
                    <img src="${url}" alt="Uploaded image" id="previewImage">
                    <canvas id="heatmapOverlay" class="heatmap-overlay"></canvas>
                </div>
                <div class="image-controls">
                    <button class="img-btn" id="toggleHeatmap">
                        <i class="fas fa-eye"></i> Toggle Heatmap
                    </button>
                    <button class="img-btn" id="zoomBtn">
                        <i class="fas fa-search-plus"></i> Zoom
                    </button>
                </div>
            </div>
        `;
        setupImagePreview();
    }

    uploadZone.style.display = 'none';
    previewSection.style.display = 'block';
}

function setupAudioPlayer(url) {
    const audio = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');
    const canvas = document.getElementById('waveformCanvas');
    const playhead = document.getElementById('playhead');

    // Draw fake waveform
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    
    drawWaveform(ctx, canvas.offsetWidth, canvas.offsetHeight);

    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
        currentTimeEl.textContent = formatTime(audio.currentTime);
        const progress = (audio.currentTime / audio.duration) * 100;
        playhead.style.left = `${progress}%`;
    });

    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            audio.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });

    // Click on waveform to seek
    const waveformContainer = document.querySelector('.waveform-container');
    waveformContainer.addEventListener('click', (e) => {
        const rect = waveformContainer.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
    });
}

function drawWaveform(ctx, width, height) {
    const bars = 100;
    const barWidth = width / bars - 2;
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(0.5, '#8b5cf6');
    gradient.addColorStop(1, '#a855f7');

    ctx.fillStyle = gradient;

    for (let i = 0; i < bars; i++) {
        const barHeight = Math.random() * (height * 0.8) + height * 0.1;
        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;
        ctx.fillRect(x, y, barWidth, barHeight);
    }
}

function setupVideoPlayer() {
    const video = document.getElementById('videoPlayer');
    const playBtn = document.getElementById('videoPlayBtn');
    const overlay = document.getElementById('videoOverlay');
    const progress = document.getElementById('videoProgress');

    playBtn.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            overlay.style.opacity = '0';
        } else {
            video.pause();
            overlay.style.opacity = '1';
        }
    });

    video.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            overlay.style.opacity = '0';
        } else {
            video.pause();
            overlay.style.opacity = '1';
        }
    });

    video.addEventListener('timeupdate', () => {
        const percent = (video.currentTime / video.duration) * 100;
        progress.style.width = `${percent}%`;
    });

    video.addEventListener('ended', () => {
        overlay.style.opacity = '1';
    });
}

function setupImagePreview() {
    const img = document.getElementById('previewImage');
    const canvas = document.getElementById('heatmapOverlay');
    const toggleBtn = document.getElementById('toggleHeatmap');
    
    img.onload = () => {
        canvas.width = img.offsetWidth;
        canvas.height = img.offsetHeight;
        drawImageHeatmap(canvas);
    };

    let heatmapVisible = false;
    toggleBtn.addEventListener('click', () => {
        heatmapVisible = !heatmapVisible;
        canvas.style.opacity = heatmapVisible ? '0.6' : '0';
    });
}

function drawImageHeatmap(canvas) {
    const ctx = canvas.getContext('2d');
    
    // Draw random "detection" regions
    const regions = [
        { x: 0.3, y: 0.2, w: 0.4, h: 0.5 },
        { x: 0.35, y: 0.4, w: 0.3, h: 0.15 }
    ];

    regions.forEach(r => {
        const gradient = ctx.createRadialGradient(
            (r.x + r.w/2) * canvas.width, (r.y + r.h/2) * canvas.height, 0,
            (r.x + r.w/2) * canvas.width, (r.y + r.h/2) * canvas.height, r.w * canvas.width
        );
        gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
        gradient.addColorStop(0.5, 'rgba(249, 115, 22, 0.5)');
        gradient.addColorStop(1, 'rgba(234, 179, 8, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(r.x * canvas.width, r.y * canvas.height, r.w * canvas.width, r.h * canvas.height);
    });
}

function simulateAnalysis(file, fileType) {
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressStatus = document.getElementById('progressStatus');

    progressSection.style.display = 'block';
    resultSection.style.display = 'none';

    const stages = [
        { percent: 15, status: 'Dosya yükleniyor...' },
        { percent: 30, status: 'Özellikler çıkarılıyor...' },
        { percent: 50, status: 'Yapay zeka modelleri çalıştırılıyor...' },
        { percent: 70, status: 'Örüntüler analiz ediliyor...' },
        { percent: 85, status: 'Rapor oluşturuluyor...' },
        { percent: 100, status: 'Tamamlandı!' }
    ];

    let currentStage = 0;

    const interval = setInterval(() => {
        if (currentStage < stages.length) {
            const stage = stages[currentStage];
            progressFill.style.width = `${stage.percent}%`;
            progressPercent.textContent = `${stage.percent}%`;
            progressStatus.textContent = stage.status;
            currentStage++;
        } else {
            clearInterval(interval);
            setTimeout(() => showResults(file, fileType), 500);
        }
    }, 600);
}

function showResults(file, fileType) {
    const progressSection = document.getElementById('progressSection');
    progressSection.style.display = 'none';
    resultSection.style.display = 'block';

    // Generate random but plausible results
    const isDeepfake = Math.random() > 0.4;
    const riskScore = isDeepfake ? Math.floor(Math.random() * 35) + 65 : Math.floor(Math.random() * 40) + 5;
    
    const signals = generateSignals(fileType, riskScore);
    
    // Animate risk score
    const riskScoreEl = document.getElementById('riskScore');
    const riskGauge = document.getElementById('riskGauge');
    const riskLabel = document.getElementById('riskLabel');
    const signalsList = document.getElementById('signalsList');
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceValue = document.getElementById('confidenceValue');

    // Set colors based on risk
    let color, label;
    if (riskScore <= 30) {
        color = '#22c55e';
        label = 'MUHTEMELEN ORIJINAL';
    } else if (riskScore <= 60) {
        color = '#eab308';
        label = 'ŞÜPHELİ';
    } else if (riskScore <= 85) {
        color = '#f97316';
        label = 'MUHTEMELEN MANİPÜLE';
    } else {
        color = '#ef4444';
        label = 'YÜKSEK RİSK - MUHTEMELEN SAHTE';
    }

    riskGauge.style.background = `conic-gradient(${color} 0deg, ${color} ${riskScore * 3.6}deg, rgba(255,255,255,0.1) ${riskScore * 3.6}deg)`;
    riskLabel.textContent = label;
    riskLabel.style.color = color;

    // Animate counter
    animateRiskScore(riskScoreEl, riskScore);

    // Show signals
    signalsList.innerHTML = signals.map(s => `
        <div class="signal-item ${s.severity}">
            <div class="signal-icon">
                <i class="fas ${s.severity === 'high' ? 'fa-exclamation-circle' : s.severity === 'medium' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
            </div>
            <div class="signal-content">
                <span class="signal-title">${s.title}</span>
                <span class="signal-desc">${s.description}</span>
            </div>
            <span class="signal-badge ${s.severity}">${s.severity.toUpperCase()}</span>
        </div>
    `).join('');

    // Confidence
    const confidence = Math.floor(Math.random() * 15) + 80;
    confidenceBar.style.width = `${confidence}%`;
    confidenceValue.textContent = `${confidence}%`;

    // Save to history
    saveToHistory(file, fileType, riskScore, label, signals);
}

function animateRiskScore(element, target) {
    let current = 0;
    const duration = 1500;
    const steps = 60;
    const increment = target / steps;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

function generateSignals(fileType, riskScore) {
    const signalsByType = {
        audio: [
            { title: 'Spektral Anomali', description: 'Ses bandında olağandışı frekans örüntüleri tespit edildi (2.3-4.1kHz)', severity: 'high' },
            { title: 'Ses Tutarlılığı', description: 'Perde ve ton varyansları doğal konuşma kalıplarıyla uyumsuz', severity: 'medium' },
            { title: 'Arka Plan Artifaktları', description: 'Ses arka planında sentetik gürültü örüntüsü tespit edildi', severity: 'low' },
            { title: 'Zamansal Boşluklar', description: 'Fonemler arasındaki mikro boşluklar birleştirme olduğunu gösteriyor', severity: 'high' },
            { title: 'Formant Analizi', description: 'Formant frekansları sentetik üretim işaretleri gösteriyor', severity: 'medium' }
        ],
        video: [
            { title: 'Yüz Manipülasyonu', description: 'Ana öznede yüz değiştirme veya değişim tespit edildi', severity: 'high' },
            { title: 'Zamansal Tutarsızlık', description: '245-260 kareler arasında doğal olmayan hareket bulanıklığı', severity: 'medium' },
            { title: 'Göz Kırpma Oranı', description: 'Kırpma örüntüleri doğal insan davranışından sapma gösteriyor', severity: 'high' },
            { title: 'Sınır Artifaktları', description: 'Yüz bölgesinde kenar tutarsızlıkları', severity: 'medium' },
            { title: 'Sıkıştırma Kalıntıları', description: 'Manipüle edilmiş alanlarda yerel yeniden kodlama tespit edildi', severity: 'low' }
        ],
        image: [
            { title: 'Diffusion İmzası', description: 'Frekans alanında Stable Diffusion model imzası tespit edildi', severity: 'high' },
            { title: 'Doku Anomalisi', description: 'Cilt dokusunda doğal mikro detay örüntüleri eksik', severity: 'high' },
            { title: 'Simetri Artifaktları', description: 'Yüz özelliklerinde doğal olmayan iki taraflı simetri', severity: 'medium' },
            { title: 'Aydınlatma Tutarsızlığı', description: 'Işık kaynağı yönleri görsel genelinde tutarsız', severity: 'medium' },
            { title: 'JPEG Hayalet Analizi', description: 'Çoklu sıkıştırma katmanları tespit edildi', severity: 'low' }
        ]
    };

    const available = signalsByType[fileType] || signalsByType.image;
    const count = riskScore > 60 ? 4 : riskScore > 30 ? 3 : 2;
    
    return available.slice(0, count).map(s => ({
        ...s,
        severity: riskScore > 70 ? s.severity : (s.severity === 'high' ? 'medium' : s.severity)
    }));
}

function saveToHistory(file, fileType, riskScore, label, signals) {
    const history = JSON.parse(localStorage.getItem('kovakHistory') || '[]');
    
    history.unshift({
        id: Date.now(),
        fileName: file.name,
        fileType: fileType,
        fileSize: file.size,
        riskScore: riskScore,
        label: label,
        signals: signals.length,
        timestamp: new Date().toISOString()
    });

    // Keep only last 50
    if (history.length > 50) history.pop();
    
    localStorage.setItem('kovakHistory', JSON.stringify(history));
}

function resetAnalysis() {
    uploadZone.style.display = 'block';
    previewSection.style.display = 'none';
    resultSection.style.display = 'none';
    document.getElementById('progressSection').style.display = 'none';
    fileInput.value = '';
}

// ===== History Page =====
function loadHistory() {
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');
    
    if (!historyList) return;

    const history = JSON.parse(localStorage.getItem('kovakHistory') || '[]');

    if (history.length === 0) {
        emptyState.style.display = 'block';
        historyList.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    historyList.style.display = 'block';

    historyList.innerHTML = history.map(item => `
        <div class="history-item">
            <div class="history-icon ${item.fileType}">
                <i class="fas ${item.fileType === 'audio' ? 'fa-waveform-lines' : item.fileType === 'video' ? 'fa-video' : 'fa-image'}"></i>
            </div>
            <div class="history-info">
                <span class="history-name">${item.fileName}</span>
                <span class="history-meta">${formatFileSize(item.fileSize)} • ${formatDate(item.timestamp)}</span>
            </div>
            <div class="history-score ${getScoreClass(item.riskScore)}">
                <span class="score-value">${item.riskScore}</span>
                <span class="score-label">Risk</span>
            </div>
            <div class="history-label ${getScoreClass(item.riskScore)}">
                ${item.label}
            </div>
            <div class="history-actions">
                <button class="action-btn" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn" title="Download Report">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getScoreClass(score) {
    if (score <= 30) return 'low';
    if (score <= 60) return 'medium';
    if (score <= 85) return 'high';
    return 'critical';
}

function clearHistory() {
    if (confirm('Tüm geçmişi silmek istediğinizden emin misiniz?')) {
        localStorage.removeItem('kovakHistory');
        loadHistory();
    }
}

// ===== Text Analysis =====
function analyzeText() {
    const textInput = document.getElementById('textInput');
    const textResult = document.getElementById('textResult');
    
    if (!textInput || !textInput.value.trim()) {
        alert('Lütfen analiz edilecek bir metin girin');
        return;
    }

    const text = textInput.value;
    textResult.style.display = 'block';
    
    // Simulate analysis
    setTimeout(() => {
        const score = Math.floor(Math.random() * 60) + 20;
        document.getElementById('textRiskScore').textContent = score;
        document.getElementById('textRiskScore').className = `score-value ${getScoreClass(score)}`;
        
        const perplexity = (Math.random() * 20 + 5).toFixed(1);
        const burstiness = (Math.random() * 0.5 + 0.1).toFixed(2);
        
        document.getElementById('textPerplexity').textContent = perplexity;
        document.getElementById('textBurstiness').textContent = burstiness;
        
        // Highlight sentences
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const highlighted = sentences.map(s => {
            const prob = Math.random();
            const cls = prob > 0.7 ? 'ai-high' : prob > 0.4 ? 'ai-medium' : 'ai-low';
            return `<span class="sentence ${cls}" title="${Math.floor(prob * 100)}% AI probability">${s}</span>`;
        }).join(' ');
        
        document.getElementById('highlightedText').innerHTML = highlighted;
    }, 1500);
}

// ===== Utilities =====
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Az önce';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}dk önce`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}sa önce`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}g önce`;
    
    return date.toLocaleDateString();
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    
    // Add some demo history if empty
    const history = JSON.parse(localStorage.getItem('kovakHistory') || '[]');
    if (history.length === 0 && window.location.pathname.includes('history')) {
        // Add demo data
        const demoData = [
            { fileName: 'roportaj_klibi.mp4', fileType: 'video', fileSize: 15728640, riskScore: 73, label: 'MUHTEMELEN MANİPÜLE', signals: 4 },
            { fileName: 'ses_mesaji.mp3', fileType: 'audio', fileSize: 2458624, riskScore: 87, label: 'YÜKSEK RİSK - MUHTEMELEN SAHTE', signals: 5 },
            { fileName: 'profil_foto.jpg', fileType: 'image', fileSize: 524288, riskScore: 12, label: 'MUHTEMELEN ORIJINAL', signals: 2 },
            { fileName: 'podcast_kesiti.wav', fileType: 'audio', fileSize: 8945621, riskScore: 45, label: 'ŞÜPHELİ', signals: 3 },
            { fileName: 'haber_gorseli.png', fileType: 'image', fileSize: 1245678, riskScore: 91, label: 'YÜKSEK RİSK - MUHTEMELEN SAHTE', signals: 5 }
        ];
        
        demoData.forEach((item, i) => {
            history.push({
                ...item,
                id: Date.now() - i * 86400000,
                timestamp: new Date(Date.now() - i * 86400000 * Math.random()).toISOString()
            });
        });
        
        localStorage.setItem('kovakHistory', JSON.stringify(history));
        loadHistory();
    }
});

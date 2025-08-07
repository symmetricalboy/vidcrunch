document.addEventListener('DOMContentLoaded', () => {
    // Initialize PostHog analytics
    console.log('DOM Content Loaded - checking PostHog...');
    
    // Wait a bit for PostHog to load if it's async
    setTimeout(() => {
        if (typeof posthog !== 'undefined') {
            console.log('PostHog detected, initializing...');
            posthog.init('phc_wkBw055GhlFSV6HrBWr2J6hBtfeqZ58vshMEk1WyG9W', {
                api_host: 'https://us.i.posthog.com',
                person_profiles: 'identified_only',
                debug: true, // Enable debug mode to see what's happening
                loaded: function(posthog) {
                    console.log('PostHog loaded successfully!');
                    // Track page view
                    posthog.capture('page_view', {
                        page: 'vidcrunch_home',
                        timestamp: new Date().toISOString()
                    });
                }
            });
            console.log('PostHog init called');
        } else {
            console.warn('PostHog library not loaded after timeout');
            console.log('Window keys containing "posthog":', Object.keys(window).filter(k => k.toLowerCase().includes('posthog')));
        }
    }, 1000);
    
    // Also try immediate initialization
    if (typeof posthog !== 'undefined') {
        console.log('PostHog available immediately');
        posthog.init('phc_wkBw055GhlFSV6HrBWr2J6hBtfeqZ58vshMEk1WyG9W', {
            api_host: 'https://us.i.posthog.com',
            person_profiles: 'identified_only',
            debug: true
        });
    }

    // Configuration for VidCrunch
    const FFMPEG_WASM_SIZE_LIMIT = 2 * 1024 * 1024 * 1024; // 2GB hard FFmpeg.wasm limit
const MEMORY_WARNING_SIZE = 1 * 1024 * 1024 * 1024; // 1GB warning threshold
    let COMPRESSION_TARGET_SIZE = 25 * 1024 * 1024; // Default 25MB target (adjustable via slider)


    // DOM Elements for VidCrunch
    const fileInput = document.getElementById('file-input');
    const dropArea = document.getElementById('drop-area');
    const targetSizeSlider = document.getElementById('target-size-slider');
    const targetSizeDisplay = document.getElementById('target-size-display');
    
    // Sections
    const uploadSection = document.getElementById('upload-section');
    const previewSection = document.getElementById('preview-section');
    const processingSection = document.getElementById('processing-section');
    const resultsSection = document.getElementById('results-section');
    
    // Preview elements
    const previewContent = document.getElementById('preview');
    const fileNameDisplay = document.getElementById('file-name-display');
    
    // Buttons
    const uploadButton = document.getElementById('upload-button');
    const compressBtn = document.getElementById('compress-btn');
    const clearBtn = document.getElementById('clear-btn');
    const downloadCompressedBtn = document.getElementById('download-compressed-btn');
    const startOverBtn = document.getElementById('start-over-btn');
    
    // Status and progress elements
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    
    // Results elements
    const compressionStats = document.getElementById('compression-stats');
    
    // VidCrunch doesn't need modal elements
    
    // VidCrunch doesn't need settings elements
    
    // PWA Install Button & Link
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    const pwaInstallLink = document.getElementById('pwa-install-link');
    
    // Privacy Modal
    const privacyLink = document.getElementById('privacy-link');
    const privacyModal = document.getElementById('privacy-modal');
    const privacyClose = document.getElementById('privacy-close');
    


    // Current file data
    let originalFile = null;
    let currentMediaElement = null;
    let compressionPromiseResolve = null;
    let compressionPromiseReject = null;
    let generatedResults = null;
    let compressionResults = null;
    
    // FFmpeg instance for compression
    let ffmpeg = null;
    let ffmpegLoaded = false;
    
    // PWA Install prompt
    let deferredPrompt = null;
    
    // App version
    let appVersion = null;

    // ===== LOGGING FUNCTION =====
    
    function logToUI(message) {
        console.log(message);
        // VidCrunch doesn't have a separate log UI, just console logging
    }

    // ===== TARGET SIZE MANAGEMENT =====
    
    function updateTargetSize(shouldLog = false) {
        const targetMB = parseInt(targetSizeSlider.value);
        targetSizeDisplay.textContent = `${targetMB}MB`;
        COMPRESSION_TARGET_SIZE = targetMB * 1024 * 1024; // Convert to bytes
        if (shouldLog) {
            logToUI(`🎯 Target size updated to ${targetMB}MB`);
        }
    }
    
    // Initialize target size (silent)
    updateTargetSize(false);

    // ===== SECTION MANAGEMENT =====
    
    function showSection(sectionToShow) {
        const sections = [uploadSection, previewSection, processingSection, resultsSection];
        sections.forEach(section => {
            section.style.display = 'none';
        });
        sectionToShow.style.display = 'flex';
    }

    function resetToUpload() {
        originalFile = null;
        currentMediaElement = null;
        compressionResults = null;
        
        // Reset file input
        fileInput.value = '';
        
        // Clear preview
        if (previewContent) {
            previewContent.innerHTML = '';
        }
        fileNameDisplay.textContent = 'No file selected';
        
        // Clean up any video elements created
        if (currentMediaElement) {
            if (currentMediaElement.src) {
                URL.revokeObjectURL(currentMediaElement.src);
            }
            if (currentMediaElement.parentNode) {
                currentMediaElement.parentNode.removeChild(currentMediaElement);
            }
            currentMediaElement = null;
        }
        
        // Show upload section
        showSection(uploadSection);
    }

    // ===== STATUS MANAGEMENT =====
    
    function updateStatus(message, type = 'normal') {
        // Status functionality removed - VidCrunch uses simpler approach
    }

    function updateProgress(percent, text) {
        progressFill.style.width = `${percent}%`;
        progressText.textContent = text;
    }

    // ===== PWA INSTALLATION MANAGEMENT =====
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        pwaInstallBtn.style.display = 'flex';
        // PWA install prompt available
    });

    // Handle PWA install button click
    pwaInstallBtn.addEventListener('click', async () => {
        if (!deferredPrompt) {
            // PWA install prompt not available
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            // PWA install accepted
            showToast('App installed successfully!', 'success');
        } else {
            // PWA install dismissed
            showToast('App installation cancelled', 'warning');
        }
        
        deferredPrompt = null;
        pwaInstallBtn.style.display = 'none';
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', (e) => {
        logToUI('✅ PWA installed successfully');
        showToast('Welcome to VidCrunch app!', 'success');
        pwaInstallBtn.style.display = 'none';
        pwaInstallLink.style.display = 'none';
        document.body.classList.add('pwa-installed');
        deferredPrompt = null;
    });

    // Check if app is already installed (running in standalone mode)
    function checkIfInstalled() {
        if (window.matchMedia('(display-mode: standalone)').matches || 
            window.navigator.standalone === true) {
            pwaInstallBtn.style.display = 'none';
            pwaInstallLink.style.display = 'none';
            document.body.classList.add('pwa-installed');
            logToUI('📱 App is running in standalone mode');
        }
    }

    // ===== THEME MANAGEMENT =====
    let themeTransitionInProgress = false;
    
    window.handleThemeToggle = function(checkbox) {
        if (themeTransitionInProgress) return; // Prevent interruption during transition
        
        themeTransitionInProgress = true;
        const targetTheme = checkbox.checked ? 'dark' : 'light';
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        
        if (currentTheme === targetTheme) {
            themeTransitionInProgress = false;
            return;
        }
        
        // Check if sunlight effect is enabled in settings
        const settings = loadSettings();
        if (settings.sunlightEffect) {
            // Create natural sunset/dawn transition sequence
            if (targetTheme === 'dark') {
                // Day to night: light → sunset → dusk → twilight → dark
                transitionThroughPhases(['light', 'sunset', 'dusk', 'twilight', 'dark'], targetTheme);
            } else {
                // Night to day: dark → twilight → dusk → sunset → light  
                transitionThroughPhases(['dark', 'twilight', 'dusk', 'sunset', 'light'], targetTheme);
            }
        } else {
            // Direct transition without sunset/sunrise effect
            document.documentElement.setAttribute('data-theme', targetTheme);
            localStorage.setItem('theme', targetTheme);
            logToUI(`🎨 Switched directly to ${targetTheme} mode (sunlight effect disabled)`);
            themeTransitionInProgress = false;
        }
    };
    
    async function transitionThroughPhases(phases, finalTheme) {
        const totalDuration = 800; // 0.8 seconds total - back to original speed
        const phaseDelay = totalDuration / (phases.length - 1); // Evenly distribute phases
        
        logToUI(`🌅 Beginning ${finalTheme === 'dark' ? 'sunset' : 'dawn'} transition...`);
        
        for (let i = 0; i < phases.length; i++) {
            const phase = phases[i];
            document.documentElement.setAttribute('data-theme', phase);
            
            // Log intermediate phases with nature emojis
            if (phase === 'sunset') logToUI('🌅 Sunset colors emerging...');
            else if (phase === 'dusk') logToUI('🌆 Dusk settling in...');  
            else if (phase === 'twilight') logToUI('🌌 Twilight deepening...');
            else if (phase === 'light') logToUI('🌄 Dawn breaking...');
            
            // Wait for next phase unless this is the last one
            if (i < phases.length - 1) {
                await new Promise(resolve => setTimeout(resolve, phaseDelay));
            }
        }
        
        // Store final theme and reset transition flag
        localStorage.setItem('theme', finalTheme);
        logToUI(`🎨 Completed transition to ${finalTheme} mode`);
        
        // Add a small delay before allowing next transition
        setTimeout(() => {
            themeTransitionInProgress = false;
        }, 300);
    }

    function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
        const checkbox = document.getElementById('theme-toggle-checkbox');
        
        // Only set final saved theme, no intermediate phases on page load
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (checkbox) {
            checkbox.checked = savedTheme === 'dark';
        }
    }

    // ===== SETTINGS MANAGEMENT =====
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('altTextSettings') || '{}');
        return {
            sunlightEffect: settings.sunlightEffect === true, // Default to false
            useDevServer: settings.useDevServer === true, // Default to false (production)
            dismissWarning: settings.dismissWarning === true, // Default to false
            preferCompression: settings.preferCompression === true, // Default to false (prefer Files API)
            ...settings
        };
    }

    function saveSettings(newSettings) {
        const currentSettings = loadSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        localStorage.setItem('altTextSettings', JSON.stringify(updatedSettings));
        // Settings saved
    }
    
    function initializeSettings() {
        // VidCrunch doesn't need complex settings - just load basic settings
        const settings = loadSettings();
    }
    
    function showSettings() {
        // Ensure settings are up to date when opening
        initializeSettings();
        settingsOverlay.style.display = 'flex';
        // Settings panel opened
    }
    
    function hideSettings() {
        settingsOverlay.style.display = 'none';
        // Settings panel closed
    }
    
    function syncWarningCheckboxes() {
        const settings = loadSettings();
        const modalCheckbox = document.getElementById('dont-show-again');
        
        // Sync both checkboxes to current setting
        dismissWarningCheckbox.checked = settings.dismissWarning;
        if (modalCheckbox) {
            modalCheckbox.checked = settings.dismissWarning;
        }
        
        logToUI(`🔄 Warning checkboxes synced: ${settings.dismissWarning}`);
    }
    
    function initializeSettingsEvents() {
        // VidCrunch doesn't need complex settings UI - simplified
    }

    // ===== COMPRESSION MODAL MANAGEMENT =====
    function shouldShowCompressionWarning() {
        const settings = loadSettings();
        return !settings.dismissWarning && !getCookie('hideCompressionWarning');
    }

    function setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function showCompressionWarning() {
        logToUI('📋 Setting up compression warning modal...');
        return new Promise((resolve, reject) => {
            logToUI('📋 Creating promise for compression modal');
            compressionPromiseResolve = resolve;
            compressionPromiseReject = reject;
            logToUI('📋 Promise handlers set, showing modal');
            compressionModal.style.display = 'flex';
            logToUI('📋 Modal should now be visible');
        });
    }

    function hideCompressionWarning() {
        logToUI('📋 Hiding compression modal...');
        compressionModal.style.display = 'none';
        logToUI('📋 Clearing promise handlers');
        compressionPromiseResolve = null;
        compressionPromiseReject = null;
        logToUI('📋 Modal cleanup completed');
    }

    // ===== LOGS MANAGEMENT =====
    
    function logToUI(message) {
        // Simple console logging for VidCrunch
        console.log(message);
    }
    
    function initializeLogs() {
        // VidCrunch doesn't need logs initialization
    }

    function showLogsOverlay() {
        logsOverlay.style.display = 'flex';
    }

    function hideLogsOverlay() {
        logsOverlay.style.display = 'none';
    }

    function emailLogs() {
        const logs = Array.from(logContainer.children).map(p => p.textContent).join('\n');
        const subject = encodeURIComponent('Alt Text Generator - Support Request');
        const body = encodeURIComponent(`Hello,

I need help with the Alt Text Generator. Here are my logs:

${logs}

Please help me resolve this issue.

Thank you!`);
        
        const mailtoLink = `mailto:dylangregoriis+alttextgenapp@gmail.com?subject=${subject}&body=${body}`;
        
        try {
            window.open(mailtoLink, '_blank');
            logToUI('📧 Email client opened with logs');
            showToast('Email client opened with logs attached', 'success');
        } catch (error) {
            logToUI(`❌ Could not open email client: ${error.message}`);
            showToast('Could not open email client', 'error');
            
            // Fallback: copy logs to clipboard
            navigator.clipboard.writeText(logs).then(() => {
                showToast('Logs copied to clipboard instead', 'warning');
            }).catch(() => {
                showToast('Could not copy logs to clipboard', 'error');
            });
        }
    }

    // ===== FILE HANDLING =====
    
    function initializeClipboardPaste() {
        document.addEventListener('paste', handlePaste);
        // Clipboard paste support enabled
    }

    async function handlePaste(e) {
        const items = e.clipboardData.items;
        
        for (let item of items) {
            if (item.type.indexOf('video') !== -1) {
                e.preventDefault();
                const file = item.getAsFile();
                
                if (file) {
                    logToUI(`📋 Pasted ${file.type} video from clipboard (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
                    handleFile(file);
                    return;
                }
            }
        }
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    function handleDrop(e) {
        preventDefaults(e);
        unhighlight();
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }

    function handleFileSelect() {
        const file = fileInput.files[0];
        if (file) {
            handleFile(file);
        }
    }

    async function handleFile(file) {
        updateStatus('Processing file...', 'processing');
        
        // Track file upload event
        if (typeof posthog !== 'undefined') {
            posthog.capture('file_uploaded', {
                file_type: file.type,
                file_size_mb: (file.size / 1024 / 1024).toFixed(2),
                file_name_extension: file.name.split('.').pop()
            });
        }
        
        // Validate file type - video only for VidCrunch
        const validTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/mkv', 'video/m4v', 'video/3gp', 'video/flv'];
        if (!validTypes.includes(file.type)) {
            updateStatus('Unsupported file type', 'error');
            showToast('Please upload a supported video file', 'error');
            
            // Track error
            if (typeof posthog !== 'undefined') {
                posthog.capture('file_upload_error', {
                    error_type: 'unsupported_file_type',
                    file_type: file.type
                });
            }
            return;
        }

        // Validate file size - FFmpeg.wasm has a 2GB hard limit
        if (file.size > FFMPEG_WASM_SIZE_LIMIT) {
            updateStatus('File too large for web processing', 'error');
            showToast(`File size (${(file.size / 1024 / 1024 / 1024).toFixed(1)}GB) exceeds FFmpeg.wasm's 2GB limit. This is a WebAssembly limitation that cannot be bypassed in web browsers.`, 'error');
            logToUI(`❌ File rejected: ${(file.size / 1024 / 1024 / 1024).toFixed(1)}GB exceeds 2GB FFmpeg.wasm limit`);
            logToUI('💡 Suggestion: Use desktop video editing software for files this large');
            return;
        }

        // Warning for large files that might cause memory issues
        if (file.size > MEMORY_WARNING_SIZE) {
            logToUI(`⚠️ Large file detected: ${(file.size / 1024 / 1024 / 1024).toFixed(1)}GB`);
            logToUI('⚠️ Processing may be slow and consume significant memory');
            showToast(`Large file (${(file.size / 1024 / 1024 / 1024).toFixed(1)}GB) may cause performance issues`, 'warning');
        }

        originalFile = file;

        // Display preview and check for video sound
        await displayPreview(file);
        
        updateStatus('File ready for processing', 'ready');
        showSection(previewSection);
    }

    async function displayPreview(file) {
        // Just display the file name instead of video preview
        fileNameDisplay.textContent = file.name;
        
        // Create a dummy video element for compatibility (but don't show it)
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.muted = true;
        video.style.display = 'none';
        document.body.appendChild(video);
        currentMediaElement = video;
        
        logToUI(`📹 Video loaded: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    }



    // ===== PROCESSING =====
    
    let isProcessing = false;
    
    async function processVideoCompression() {
        // Prevent multiple simultaneous compression attempts
        if (isProcessing) {
            logToUI('⚠️ Compression already in progress, please wait...');
            return;
        }
        
        // Validate that we have a valid file
        if (!originalFile) {
            logToUI('❌ No file selected for compression');
            updateStatus('No file selected', 'error');
            return;
        }

        // Additional memory check for very large files
        const fileSizeGB = originalFile.size / (1024 * 1024 * 1024);
        if (fileSizeGB > 1.5) {
            logToUI(`⚠️ Large file processing: ${fileSizeGB.toFixed(1)}GB`);
            logToUI('⚠️ This may take several minutes and use significant memory');
            
            // Estimate memory usage (rough calculation)
            const estimatedMemoryUsageGB = fileSizeGB * 2.5; // File + processing overhead
            logToUI(`📊 Estimated memory usage: ~${estimatedMemoryUsageGB.toFixed(1)}GB`);
            
            if (estimatedMemoryUsageGB > 8) {
                logToUI('⚠️ WARNING: This file may exceed available browser memory');
                logToUI('💡 Consider using a smaller file or desktop software');
            }
        }
        
        try {
            isProcessing = true;
            compressBtn.disabled = true;
            compressBtn.textContent = 'Processing...';
            
            // Track compression start
            if (typeof posthog !== 'undefined') {
                posthog.capture('compression_started', {
                    file_size_mb: (originalFile.size / 1024 / 1024).toFixed(2),
                    target_size_mb: (COMPRESSION_TARGET_SIZE / 1024 / 1024),
                    file_type: originalFile.type
                });
            }
            
            showSection(processingSection);
            updateStatus('Starting video compression...', 'processing');
            
            updateProgress(5, 'Preparing video...');
            document.getElementById('compression-pass-status').textContent = '';
            
            // Debug original file
            logToUI(`🔍 Original file check: ${originalFile ? 'Present' : 'Missing'}`);
            if (originalFile) {
                logToUI(`📹 Video details: ${originalFile.name}, ${(originalFile.size / 1024 / 1024).toFixed(2)}MB, ${originalFile.type}`);
            }
            
            // VidCrunch: Two-pass compression logic
            updateProgress(10, 'Starting first compression pass...');
            logToUI('🔄 Converting video to array buffer...');
            
            // Validate file is still accessible before reading
            let arrayBuffer;
            try {
                updateProgress(15, 'Loading file into memory...');
                
                // Add timeout for very large files to prevent browser hanging
                const timeoutMs = Math.max(30000, fileSizeGB * 10000); // 30s minimum, +10s per GB
                logToUI(`⏱️ Timeout set to ${(timeoutMs / 1000).toFixed(0)} seconds for ${fileSizeGB.toFixed(1)}GB file`);
                
                const arrayBufferPromise = originalFile.arrayBuffer();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('File loading timed out - file may be too large for browser memory')), timeoutMs)
                );
                
                arrayBuffer = await Promise.race([arrayBufferPromise, timeoutPromise]);
                logToUI(`✅ Video converted to buffer (${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB)`);
                
                // Memory usage check after loading
                if (performance.memory) {
                    const memUsedMB = performance.memory.usedJSHeapSize / 1024 / 1024;
                    logToUI(`📊 Current memory usage: ${memUsedMB.toFixed(0)}MB`);
                }
                
            } catch (fileError) {
                if (fileError.message.includes('timed out')) {
                    throw new Error(`File too large to load into browser memory (${fileSizeGB.toFixed(1)}GB). Try a smaller file or use desktop software.`);
                }
                throw new Error(`Unable to read the selected file. Please try selecting the file again. (${fileError.message})`);
            }
            
            // First pass: Light compression
            updateProgress(20, 'Applying light compression...');
            logToUI('🎞️ First pass: Light compression settings');
            
            const firstPassResults = await handleCompression({
                buffer: arrayBuffer,
                name: originalFile.name,
                size: originalFile.size,
                type: originalFile.type
            });
            
            logToUI(`✅ First pass complete: ${(firstPassResults.blob.size / 1024 / 1024).toFixed(2)}MB`);
            
            let finalResults = firstPassResults;
            
            if (firstPassResults.blob.size > COMPRESSION_TARGET_SIZE) {
                updateProgress(50, 'File still too large, applying aggressive compression...');
                logToUI(`⚠️ First pass result (${(firstPassResults.blob.size / 1024 / 1024).toFixed(2)}MB) exceeds target`);
                logToUI('🎞️ Second pass: Aggressive compression settings');
                
                const compressionPassStatus = document.getElementById('compression-pass-status');
                compressionPassStatus.textContent = '2nd pass...';

                const secondPassResults = await handleAggressiveCompression({
                    buffer: await firstPassResults.blob.arrayBuffer(),
                    name: originalFile.name,
                    size: firstPassResults.blob.size,
                    type: originalFile.type
                });
                
                logToUI(`✅ Second pass complete: ${(secondPassResults.blob.size / 1024 / 1024).toFixed(2)}MB`);
                finalResults = secondPassResults;
                finalResults.passCount = 2;
                compressionPassStatus.textContent = ''; // Clear on completion
            } else {
                logToUI('✅ First pass achieved target size!');
                finalResults.passCount = 1;
            }
            
            compressionResults = finalResults;

            updateProgress(90, 'Finalizing compression...');
            
            // Calculate compression statistics
            const originalSizeMB = originalFile.size / 1024 / 1024;
            const compressedSizeMB = compressionResults.blob.size / 1024 / 1024;
            const compressionRatio = ((originalFile.size - compressionResults.blob.size) / originalFile.size * 100);
            
            logToUI(`📊 Compression complete!`);
            logToUI(`📊 Original: ${originalSizeMB.toFixed(2)}MB`);
            logToUI(`📊 Compressed: ${compressedSizeMB.toFixed(2)}MB`);
            logToUI(`📊 Saved: ${compressionRatio.toFixed(1)}% (${(originalSizeMB - compressedSizeMB).toFixed(2)}MB)`);
            logToUI(`📊 Passes: ${compressionResults.passCount}`);
            
            updateProgress(100, 'Complete!');
            
            // Display compression results and auto-return to upload
            displayCompressionResults(compressionResults);
            
            // Also show a visible button to return immediately if user wants
            setTimeout(() => {
                const returnBtn = document.createElement('button');
                returnBtn.textContent = 'Compress Another Video';
                returnBtn.className = 'start-over-btn';
                returnBtn.style.cssText = `
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1000;
                    background: var(--primary-pink);
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                `;
                returnBtn.onclick = () => {
                    document.body.removeChild(returnBtn);
                    // Reset processing state before calling resetToUpload
                    isProcessing = false;
                    compressBtn.disabled = false;
                    compressBtn.textContent = 'Compress Video';
                    resetToUpload();
                };
                document.body.appendChild(returnBtn);
                
                // Auto-remove button and return to upload after 5 seconds
                setTimeout(() => {
                    if (document.body.contains(returnBtn)) {
                        document.body.removeChild(returnBtn);
                        // Reset processing state before calling resetToUpload
                        isProcessing = false;
                        compressBtn.disabled = false;
                        compressBtn.textContent = 'Compress Video';
                        resetToUpload();
                    }
                }, 5000);
            }, 1000);
            
        } catch (error) {
            logToUI(`❌ Compression error: ${error.message}`);
            updateStatus('Compression failed', 'error');
            showToast(`Compression failed: ${error.message}`, 'error');
            showSection(previewSection);
        } finally {
            // Reset processing state and re-enable button
            isProcessing = false;
            compressBtn.disabled = false;
            compressBtn.textContent = 'Compress Video';
        }
    }

    function displayCompressionResults(results) {
        const originalSizeMB = originalFile.size / 1024 / 1024;
        const compressedSizeMB = results.blob.size / 1024 / 1024;
        const compressionRatio = ((originalFile.size - results.blob.size) / originalFile.size * 100);
        const spaceSavedMB = originalSizeMB - compressedSizeMB;
        
        logToUI(`📦 Auto-downloading compressed video...`);
        
        // Auto-download the compressed video
        const blob = results.blob;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${originalFile.name.split('.')[0]}_compressed.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        logToUI('✅ Compressed video auto-downloaded');
        
        // Show success animation
        showSuccessAnimation(spaceSavedMB, compressionRatio);
        
        // Return to upload section after animation
        setTimeout(() => {
            hideSuccessAnimation();
            // Reset processing state before calling resetToUpload
            isProcessing = false;
            compressBtn.disabled = false;
            compressBtn.textContent = 'Compress Video';
            resetToUpload();
        }, 3000);
    }
    
    function showSuccessAnimation(spaceSavedMB, compressionRatio) {
        const animation = document.createElement('div');
        animation.className = 'success-animation';
        animation.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>Video Compressed!</h3>
            <p>Saved ${spaceSavedMB.toFixed(2)} MB (${compressionRatio.toFixed(1)}%)</p>
            <p>Download started automatically</p>
            <p style="font-size: 0.9em; opacity: 0.8; margin-top: 15px;">Click anywhere to continue...</p>
        `;
        
        // Click anywhere to return to upload
        animation.onclick = () => {
            hideSuccessAnimation();
            // Reset processing state before calling resetToUpload
            isProcessing = false;
            compressBtn.disabled = false;
            compressBtn.textContent = 'Compress Video';
            resetToUpload();
        };
        
        animation.style.cursor = 'pointer';
        document.body.appendChild(animation);
    }
    
    function hideSuccessAnimation() {
        const animation = document.querySelector('.success-animation');
        if (animation) {
            animation.remove();
        }
    }

    // ===== COMPRESSION FUNCTIONS =====
    
    async function handleCompression(fileData) {
        const { buffer, name, size, type } = fileData;
        
        updateProgress(25, 'Loading compression engine...');
        if (!ffmpegLoaded) {
            await loadFFmpeg();
        }
        
        updateProgress(30, 'Processing video - light compression...');
        logToUI(`🎞️ Starting light compression of ${name}`);
        
        try {
            const inputFileName = `input.${getFileExtension(name)}`;
            ffmpeg.FS('writeFile', inputFileName, new Uint8Array(buffer));
            
            // Light compression settings (H.264, CRF 23, medium preset)
            await ffmpeg.run(
                '-i', inputFileName,
                '-c:v', 'libx264',
                '-crf', '23',
                '-preset', 'medium',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-movflags', '+faststart',
                '-threads', '1',
                '-x264-params', 'threads=1:sliced-threads=0',
                'output.mp4'
            );
            
            updateProgress(80, 'Finalizing compression...');
            const data = ffmpeg.FS('readFile', 'output.mp4');
            const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });
            
            // Cleanup
            ffmpeg.FS('unlink', inputFileName);
            ffmpeg.FS('unlink', 'output.mp4');
            
            return {
                blob: compressedBlob,
                originalSize: size
            };
        } catch (error) {
            logToUI(`❌ Light compression error: ${error.message}`);
            throw error;
        }
    }
    
    async function handleAggressiveCompression(fileData) {
        const { buffer, name, size, type } = fileData;
        
        updateProgress(60, 'Processing video - aggressive compression...');
        logToUI(`🎞️ Starting aggressive compression of ${name}`);
        
        try {
            const inputFileName = `input_pass2.${getFileExtension(name)}`;
            ffmpeg.FS('writeFile', inputFileName, new Uint8Array(buffer));
            
            // Aggressive compression settings (H.264, CRF 28, faster preset, scaled down)
            await ffmpeg.run(
                '-i', inputFileName,
                '-c:v', 'libx264',
                '-crf', '28',
                '-preset', 'faster',
                '-vf', 'scale=min(1280\\,iw):min(720\\,ih):force_original_aspect_ratio=decrease,fps=30',
                '-c:a', 'aac',
                '-b:a', '96k',
                '-movflags', '+faststart',
                '-threads', '1',
                '-x264-params', 'threads=1:sliced-threads=0',
                'output_pass2.mp4'
            );
            
            updateProgress(85, 'Finalizing aggressive compression...');
            const data = ffmpeg.FS('readFile', 'output_pass2.mp4');
            const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });
            
            // Cleanup
            ffmpeg.FS('unlink', inputFileName);
            ffmpeg.FS('unlink', 'output_pass2.mp4');
            
            return {
                blob: compressedBlob,
                originalSize: size
            };
        } catch (error) {
            logToUI(`❌ Aggressive compression error: ${error.message}`);
            throw error;
        }
    }
    
    async function loadFFmpeg() {
        if (ffmpegLoaded) return;
        
        try {
            logToUI('🔧 Loading FFmpeg...');
            if (!ffmpeg) {
                ffmpeg = window.FFmpeg.createFFmpeg({ 
                    log: true,
                    corePath: `${window.location.origin}/assets/ffmpeg/ffmpeg-core.js`
                });
            }
            
            if (!ffmpeg.isLoaded()) {
                await ffmpeg.load();
            }
            
            ffmpegLoaded = true;
            logToUI('✅ FFmpeg loaded successfully');
        } catch (error) {
            logToUI(`❌ FFmpeg loading failed: ${error.message}`);
            throw error;
        }
    }
    
    function getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    // Video compression utilities

    // Duplicate function removed - using the auto-download version above



    // ===== EVENT LISTENERS =====
    
    // File handling
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight);
    });

    dropArea.addEventListener('drop', handleDrop);
    
    // Handle upload button click (prevent bubbling to dropArea)
    uploadButton.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
    });
    
    // Handle drop area click (only if not clicking the button or its children)
    dropArea.addEventListener('click', (e) => {
        if (!uploadButton.contains(e.target)) {
            fileInput.click();
        }
    });
    
    fileInput.addEventListener('change', handleFileSelect);

    // Buttons
    compressBtn.addEventListener('click', processVideoCompression);
    
    // Target size slider
    targetSizeSlider.addEventListener('input', () => updateTargetSize(true));
    clearBtn.addEventListener('click', resetToUpload);
    startOverBtn.addEventListener('click', resetToUpload);
    
    // PWA Install link
    pwaInstallLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        if (!deferredPrompt) {
            // If no install prompt available, show a message about browser compatibility
            alert('This app can be installed! Look for the install icon in your browser\'s address bar, or check your browser menu for "Install VidCrunch" or "Add to Home Screen".');
            return;
        }
        
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            // PWA install accepted
            showToast('App installed successfully!', 'success');
            pwaInstallLink.style.display = 'none';
        } else {
            // PWA install dismissed
            showToast('App installation cancelled', 'warning');
        }
        
        deferredPrompt = null;
        pwaInstallBtn.style.display = 'none';
    });



    // Download handled automatically on completion

    // VidCrunch: No logs needed

    // Privacy Modal
    privacyLink.addEventListener('click', (e) => {
        e.preventDefault();
        privacyModal.style.display = 'flex';
    });
    
    privacyClose.addEventListener('click', () => {
        privacyModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    privacyModal.addEventListener('click', (e) => {
        if (e.target === privacyModal) {
            privacyModal.style.display = 'none';
        }
    });



    // ===== UTILITY FUNCTIONS =====
    
    async function fetchAppVersion() {
        try {
            const response = await fetch('/api/version');
            const data = await response.json();
            appVersion = data.version;
            // App version fetched successfully
            
            // Update footer version display
            const versionElement = document.getElementById('app-version');
            if (versionElement) {
                versionElement.textContent = `v${appVersion}`;
            }
        } catch (error) {
            // Could not fetch app version
            appVersion = 'unknown';
            
            // Update footer with unknown version
            const versionElement = document.getElementById('app-version');
            if (versionElement) {
                versionElement.textContent = 'v?.?.?';
            }
        }
    }
    
    // Logging removed for VidCrunch

    async function loadFFmpeg() {
        if (ffmpegLoaded) {
            // FFmpeg is already loaded
            return { ffmpeg, fetchFile: FFmpeg.fetchFile };
        }
        
        try {
            // Loading FFmpeg
            
            // Check if FFmpeg is available
            if (typeof FFmpeg === 'undefined') {
                throw new Error('FFmpeg library not loaded. Please refresh the page and try again.');
            }
            
            const { createFFmpeg, fetchFile } = FFmpeg;
            
            // Creating FFmpeg instance
            ffmpeg = createFFmpeg({
                corePath: `${window.location.origin}/assets/ffmpeg/ffmpeg-core.js`,
                log: true,
                // Logger removed for VidCrunch
                progress: (progress) => {
                    const percent = Math.round(progress.ratio * 100);
                    if (percent < 100) {
                        updateProgress(20 + (percent * 0.4), `Compressing video... ${percent}%`);
                    }
                },
            });
            
            // Loading FFmpeg core
            
            // Add a timeout to prevent indefinite hanging
            const loadPromise = ffmpeg.load();
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error('FFmpeg loading timed out after 30 seconds. Please refresh the page and try again.'));
                }, 30000);
            });
            
            await Promise.race([loadPromise, timeoutPromise]);
            ffmpegLoaded = true;
            // FFmpeg loaded successfully
            return { ffmpeg, fetchFile };
        } catch (error) {
            // Error loading FFmpeg
            // User should try refreshing the page
            throw error;
        }
    }
    
    async function handleCompression(fileData) {
        try {
            // File received for compression
            updateProgress(16, 'Loading FFmpeg...');
            
            const { ffmpeg, fetchFile } = await loadFFmpeg();
            // FFmpeg loaded, starting compression
            
            const { buffer, name, size, type } = fileData;
            const originalSizeMB = (size / 1024 / 1024).toFixed(2);
            logToUI(`🔄 Starting compression of ${name} (${originalSizeMB}MB)`);
            
            updateProgress(17, 'Writing file to FFmpeg filesystem...');
            const fileBytes = new Uint8Array(buffer);
            ffmpeg.FS('writeFile', name, fileBytes);
            logToUI('✅ File written to FFmpeg filesystem');
            
            // Multi-tier compression strategy
            return await attemptMultiTierCompression({ ffmpeg, name, size, originalSizeMB });
        } catch (error) {
            logToUI(`❌ Compression error: ${error.message}`);
            throw error;
        }
    }

    // ===== MULTI-TIER COMPRESSION SYSTEM =====
    
    async function attemptMultiTierCompression({ ffmpeg, name, size, originalSizeMB }) {
        const targetSizeMB = COMPRESSION_TARGET_SIZE / (1024 * 1024);
        logToUI(`🎯 Target: ${targetSizeMB}MB | Starting multi-tier compression`);
        
        // Check if file is already smaller than target - skip compression
        if (originalSizeMB <= targetSizeMB) {
            logToUI(`✅ File already smaller than target (${originalSizeMB}MB ≤ ${targetSizeMB}MB) - skipping compression`);
            const originalBuffer = ffmpeg.FS('readFile', name);
            return {
                success: true,
                blob: new Blob([originalBuffer], { type: 'video/mp4' }),
                compressionRatio: 0,
                sizeSaved: 0,
                finalSizeMB: originalSizeMB,
                skipped: true
            };
        }
        
        // Try to detect video resolution and apply memory-safe scaling for very high-res videos
        let hasHighResolution = false;
        try {
            // Probe the video to get basic info
            await ffmpeg.run('-i', name, '-t', '1', '-f', 'null', '-');
        } catch (probeError) {
            // Check the error output for resolution info
            const errorOutput = probeError.message || '';
            const resolutionMatch = errorOutput.match(/(\d{3,4})x(\d{3,4})/);
            if (resolutionMatch) {
                const width = parseInt(resolutionMatch[1]);
                const height = parseInt(resolutionMatch[2]);
                hasHighResolution = width > 2000 || height > 1500; // 2K+ resolution
                logToUI(`📐 Detected resolution: ${width}x${height} ${hasHighResolution ? '(High-res)' : '(Standard)'}`);
            }
        }
        
        // Detect if this is a large/high-res video that needs aggressive compression from start
        const isLargeVideo = originalSizeMB > 30 || size > 100 * 1024 * 1024 || hasHighResolution;
        
        if (isLargeVideo) {
            logToUI(`🎬 Large video detected (${originalSizeMB}MB) - using aggressive compression tiers`);
        } else {
            logToUI(`📹 Standard video (${originalSizeMB}MB) - using gentle compression tiers`);
        }
        
        // Define compression tiers - much more aggressive for large videos
        const compressionTiers = isLargeVideo ? [
            {
                name: "Tier 1: Fast (4K Safe)",
                crf: 30,
                preset: "ultrafast",
                scale: "min(iw\\,1920):min(ih\\,1080):force_original_aspect_ratio=decrease",
                fps: 30,
                description: "4K downscale, fast compression"
            },
            {
                name: "Tier 2: Aggressive",
                crf: 32,
                preset: "ultrafast",
                scale: "min(iw\\,1280):min(ih\\,720):force_original_aspect_ratio=decrease",
                fps: 30,
                description: "720p downscale, aggressive compression"
            },
            {
                name: "Tier 3: Maximum",
                crf: 35,
                preset: "ultrafast",
                scale: "min(iw\\,960):min(ih\\,540):force_original_aspect_ratio=decrease",
                fps: 25,
                description: "540p downscale, maximum compression"
            },
            {
                name: "Tier 4: Emergency",
                crf: 38,
                preset: "ultrafast",
                scale: "min(iw\\,640):min(ih\\,360):force_original_aspect_ratio=decrease",
                fps: 20,
                description: "360p emergency compression"
            }
        ] : [
            {
                name: "Tier 1: Gentle",
                crf: 25,
                preset: "fast",
                scale: null,
                fps: null,
                description: "High quality, minimal compression"
            },
            {
                name: "Tier 2: Light",
                crf: 28,
                preset: "fast", 
                scale: "min(iw\\,1920):min(ih\\,1080):force_original_aspect_ratio=decrease",
                fps: null,
                description: "Good quality, light compression"
            },
            {
                name: "Tier 3: Moderate",
                crf: 31,
                preset: "fast",
                scale: "min(iw\\,1920):min(ih\\,1080):force_original_aspect_ratio=decrease",
                fps: 30,
                description: "Balanced quality/size"
            },
            {
                name: "Tier 4: Strong",
                crf: 34,
                preset: "fast",
                scale: "min(iw\\,1280):min(ih\\,720):force_original_aspect_ratio=decrease",
                fps: 30,
                description: "Lower quality, strong compression"
            }
        ];
        
        let currentTier = 0;
        let finalResult = null;
        let currentBuffer = ffmpeg.FS('readFile', name);
        
        // Try each tier until we hit the target size or run out of options
        while (currentTier < compressionTiers.length) {
            const tier = compressionTiers[currentTier];
            
            try {
                logToUI(`🔄 Attempting ${tier.name}: ${tier.description}`);
                updateProgress(18 + (currentTier * 10), `${tier.name}...`);
                
                const compressionPassStatus = document.getElementById('compression-pass-status');
                compressionPassStatus.textContent = `${currentTier + 1} pass...`;

                const result = await runCompressionTier({ 
                    ffmpeg, 
                    name, 
                    tier, 
                    tierIndex: currentTier,
                    inputBuffer: currentBuffer 
                });

                const resultSizeMB = result.blob.size / (1024 * 1024);
                
                logToUI(`📊 ${tier.name} result: ${resultSizeMB.toFixed(2)}MB`);
                
                // Check if we hit the target
                if (result.blob.size <= COMPRESSION_TARGET_SIZE) {
                    logToUI(`🎯 Target achieved! ${resultSizeMB.toFixed(2)}MB ≤ ${targetSizeMB}MB`);
                    finalResult = result;
                    break;
                } else {
                    logToUI(`📈 Still too large: ${resultSizeMB.toFixed(2)}MB > ${targetSizeMB}MB`);
                    finalResult = result; // Keep as fallback
                    currentBuffer = await result.blob.arrayBuffer();
                }
                
                currentTier++;
                
            } catch (error) {
                logToUI(`❌ ${tier.name} failed: ${error.message}`);
                currentTier++;
                
                if (currentTier >= compressionTiers.length) {
                    throw new Error(`All compression tiers failed. Last error: ${error.message}`);
                }
            } finally {
                const compressionPassStatus = document.getElementById('compression-pass-status');
                compressionPassStatus.textContent = ''; // Clear on completion
            }
        }
        
        if (!finalResult) {
            throw new Error('No compression tier succeeded');
        }
        
        const finalSizeMB = finalResult.blob.size / (1024 * 1024);
        const compressionRatio = ((size - finalResult.blob.size) / size * 100).toFixed(1);
        
        logToUI(`✅ Compression complete! ${originalSizeMB}MB → ${finalSizeMB.toFixed(2)}MB (${compressionRatio}% reduction)`);
        
        updateProgress(95, 'Finalizing...');
        
        return {
            blob: finalResult.blob,
            originalSize: size,
            tiersAttempted: currentTier + 1,
            finalTier: compressionTiers[Math.min(currentTier, compressionTiers.length - 1)].name
        };
    }
    
    async function runCompressionTier({ ffmpeg, name, tier, tierIndex, inputBuffer }) {
        const inputName = `input_tier${tierIndex}.${getFileExtension(name)}`;
        const outputName = `output_tier${tierIndex}.mp4`;
        
        ffmpeg.FS('writeFile', inputName, new Uint8Array(inputBuffer));
        
        // Build video filter chain
        const vf = [];
        
        if (tier.fps) {
            vf.push(`fps=${tier.fps}`);
        }
        
        if (tier.scale) {
            vf.push(`scale=${tier.scale}`);
        }
        
        // Always add dimension correction for H.264
        vf.push('scale=trunc(iw/2)*2:trunc(ih/2)*2');
        
        // Build FFmpeg command
            const ffmpegArgs = [
                '-i', inputName,
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-crf', tier.crf.toString(),
            '-preset', tier.preset,
                '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart'
            ];
            
        if (vf.length > 0) {
            ffmpegArgs.push('-vf', vf.join(','));
            }
            
        ffmpegArgs.push(outputName);
            
        logToUI(`⚙️ ${tier.name} command: ffmpeg ${ffmpegArgs.join(' ')}`);
            
        // Run compression
            await ffmpeg.run(...ffmpegArgs);
            
        // Read result
        const data = ffmpeg.FS('readFile', outputName);
            const compressedBlob = new Blob([data.buffer], { type: 'video/mp4' });
            
        // Clean up
        try {
            ffmpeg.FS('unlink', inputName);
            ffmpeg.FS('unlink', outputName);
        } catch (e) {
            // Ignore cleanup errors
        }
            
            return {
                blob: compressedBlob,
            tier: tier.name
            };
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }

    async function uploadWithFilesAPI(file, action, isAnimatedImage = false) {
        try {
            logToUI(`📤 Starting Files API upload for ${action}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            
            // Create FormData for multipart upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('action', action);
            formData.append('mimeType', file.type);
            formData.append('isVideo', isAnimatedImage.toString());
            
            logToUI(`📡 Uploading to server via Files API...`);
            
            const response = await fetch(`${getServerUrl()}/upload`, {
                method: 'POST',
                body: formData
                // Note: Don't set Content-Type header - let browser set it with boundary
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Files API upload failed: ${response.status} - ${errorText}`);
            }
            
            logToUI(`✅ Files API upload successful for ${action}`);
            return response;
            
        } catch (error) {
            logToUI(`❌ Files API upload failed for ${action}: ${error.message}`);
            throw error;
        }
    }

    function showToast(message, type = 'success', duration = 3000) {
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // ===== INITIALIZATION =====
    
    async function initialize() {
        initializeTheme();
        initializeSettings();
        initializeSettingsEvents();
        checkIfInstalled();
        initializeLogs();
        initializeClipboardPaste();
        
        // Fetch app version first
        await fetchAppVersion();
        
        // Start with upload section
        showSection(uploadSection);
        
        // Application initialized successfully
    }

    // Initialize the application
    initialize();
}); 
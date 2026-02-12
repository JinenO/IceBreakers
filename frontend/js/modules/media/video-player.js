/* frontend/js/modules/media/video-player.js */

const LOCAL_VIDEOS = [
  {
    id: "vid-1",
    title: "Family Picnic",
    sub: "12 Mins",
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: "vid-2",
    title: "Grandson Bday",
    sub: "5 Mins",
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    id: "vid-3",
    title: "Old Movie",
    sub: "1 Hr 20 Mins",
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
];

export class VideoPlayer {
  constructor() {
    this.currentVideoId = null;
  }

  renderLibrary(gridUI) {
    const playerContainer = document.getElementById("video-player-container");
    const libraryGrid = document.getElementById("video-library-grid");

    if (!playerContainer || !libraryGrid) {
      console.warn("VideoPlayer: Required HTML elements not found.");
      return;
    }

    playerContainer.classList.add("hidden");
    libraryGrid.classList.remove("hidden");

    libraryGrid.innerHTML = "";

    if (Array.isArray(LOCAL_VIDEOS) && LOCAL_VIDEOS.length > 0) {
      LOCAL_VIDEOS.forEach((video) => {
        const card = document.createElement("article");
        card.className = "card";
        card.id = video.id;
        card.innerHTML = `
                <div class="scan-bar"></div>
                <div class="icon" style="font-size: 2.5rem; margin-bottom: 10px;">🎬</div>
                <div class="label">${video.title}</div>
                <div class="sub-label">${video.sub}</div>
                <div class="confirm-bar"></div>
            `;
        libraryGrid.appendChild(card);
      });
    } else {
      const emptyMsg = document.createElement("div");
      emptyMsg.textContent = "No videos available";
      emptyMsg.style.color = "#999";
      emptyMsg.style.textAlign = "center";
      emptyMsg.style.padding = "2rem";
      libraryGrid.appendChild(emptyMsg);
    }

    const backCard = document.createElement("article");
    backCard.className = "card";
    backCard.id = "media-lib-back";
    backCard.innerHTML = `
            <div class="scan-bar"></div>
            <div class="icon" style="font-size: 2.5rem; margin-bottom: 10px;">↩️</div>
            <div class="label">BACK</div>
            <div class="sub-label">Media Menu</div>
            <div class="confirm-bar"></div>
        `;
    libraryGrid.appendChild(backCard);

    gridUI.refreshCards("#video-library-grid .card");
  }

  playVideo(videoId) {
    const videoEl = document.getElementById("main-video");
    const iframeEl = document.getElementById("youtube-iframe");
    const container = document.getElementById("video-player-container");

    document.getElementById("video-library-grid").classList.add("hidden");
    container.classList.remove("hidden");
    document.getElementById("video-control-overlay").classList.add("hidden");

    if (videoId.startsWith("yt-")) {
      const realId = videoId.replace("yt-", "");

      if (videoEl) {
        videoEl.classList.add("hidden");
        videoEl.pause();
        videoEl.src = "";
      }

      if (iframeEl) {
        iframeEl.classList.remove("hidden");
        iframeEl.src = `https://www.youtube.com/embed/${realId}?autoplay=1&controls=0&rel=0&enablejsapi=1`;
      }

      console.log(`🎬 YouTube Playing: ${realId}`);
      return;
    }

    if (iframeEl) {
      iframeEl.classList.add("hidden");
      iframeEl.src = "";
    }

    if (!videoEl) return;

    const videoData = LOCAL_VIDEOS.find((v) => v.id === videoId);
    if (!videoData) return;

    videoEl.classList.remove("hidden");
    videoEl.src = videoData.src;
    videoEl.play();

    console.log(`▶️ Local Playing: ${videoData.title}`);
  }

  showControlPanel(gridUI) {
    const overlay = document.getElementById("video-control-overlay");
    const grid = document.getElementById("video-control-grid");

    // Auto-pause logic
    const videoEl = document.getElementById("main-video");
    const iframeEl = document.getElementById("youtube-iframe");
    const isYouTube = !iframeEl.classList.contains("hidden");

    if (isYouTube) {
      if (iframeEl.contentWindow) {
        iframeEl.contentWindow.postMessage(
          JSON.stringify({
            event: "command",
            func: "pauseVideo",
            args: [],
          }),
          "*"
        );
      }
    } else {
      videoEl.pause();
    }

    // New button order: most-used first
    const controls = [
      {
        id: "vc-resume",
        label: "RESUME",
        sub: "Play Video",
        type: "send",
        icon: "play.png",
      },
      {
        id: "vc-exit",
        label: "EXIT",
        sub: "To Library",
        type: "delete",
        icon: "log-out.png",
      },
      {
        id: "vc-volup",
        label: "VOL +",
        sub: "Louder",
        type: "group",
        icon: "vol-up.png",
      },
      {
        id: "vc-voldown",
        label: "VOL -",
        sub: "Softer",
        type: "group",
        icon: "vol-down.png",
      },
      {
        id: "vc-mute",
        label: "MUTE",
        sub: "Silence",
        type: "tool",
        icon: "mute.png",
      },
      {
        id: "vc-rewind",
        label: "-10 SEC",
        sub: "Rewind",
        type: "tool",
        icon: "rewind.png",
      },
      {
        id: "vc-forward",
        label: "+10 SEC",
        sub: "Skip",
        type: "tool",
        icon: "forward.png",
      },
      {
        id: "vc-restart",
        label: "RESTART",
        sub: "From Start",
        type: "tool",
        icon: "restart.png",
      },
    ];

    grid.innerHTML = "";
    controls.forEach((item) => {
      const card = document.createElement("article");
      card.className = `card ${item.type}`;
      card.id = item.id;
      card.innerHTML = `
                <div class="scan-bar"></div>
                <div class="icon"><img src="assets/icons/${item.icon}"></div>
                <div class="label">${item.label}</div>
                <div class="sub-label">${item.sub}</div>
                <div class="confirm-bar"></div>
            `;
      grid.appendChild(card);
    });

    overlay.classList.remove("hidden");
    gridUI.refreshCards("#video-control-grid .card");
  }

  handleCommand(cmdId, gridUI, onExitCallback) {
    const videoEl = document.getElementById("main-video");
    const iframeEl = document.getElementById("youtube-iframe");
    const overlay = document.getElementById("video-control-overlay");
    const isYouTube = !iframeEl.classList.contains("hidden");
    let toastHTML = "";

    const sendYoutubeCmd = (command, args = []) => {
      if (iframeEl.contentWindow) {
        const message = JSON.stringify({
          event: "command",
          func: command,
          args: args,
        });
        iframeEl.contentWindow.postMessage(message, "*");
      }
    };

    const makeToast = (iconName, text) => {
      return `<div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
                        <img src="assets/icons/${iconName}" style="width: 45px; height: 45px; object-fit: contain;">
                        <span>${text}</span>
                    </div>`;
    };

    // Special: EXIT (direct exit, no auto-play)
    if (cmdId === "vc-exit") {
      videoEl.pause();
      videoEl.src = "";
      iframeEl.src = "";
      iframeEl.classList.add("hidden");
      overlay.classList.add("hidden");

      if (onExitCallback) onExitCallback();
      return "EXITED";
    }

    // Handle all other commands
    if (cmdId === "vc-resume") {
      toastHTML = makeToast("play.png", "RESUMING...");
    } else if (cmdId === "vc-restart") {
      toastHTML = makeToast("restart.png", "RESTARTED");
      if (isYouTube) {
        sendYoutubeCmd("seekTo", [0, true]);
      } else {
        videoEl.currentTime = 0;
      }
    } else if (cmdId === "vc-rewind") {
      toastHTML = makeToast("rewind.png", "-10 SEC");
      if (!isYouTube) {
        videoEl.currentTime = Math.max(0, videoEl.currentTime - 10);
      }
    } else if (cmdId === "vc-forward") {
      toastHTML = makeToast("forward.png", "+10 SEC");
      if (!isYouTube) {
        videoEl.currentTime += 10;
      }
    } else if (cmdId === "vc-volup") {
      toastHTML = makeToast("vol-up.png", "VOL UP");
      if (isYouTube) {
        sendYoutubeCmd("unMute");
        sendYoutubeCmd("setVolume", [100]);
      } else {
        videoEl.volume = Math.min(1, videoEl.volume + 0.2);
        videoEl.muted = false;
      }
    } else if (cmdId === "vc-voldown") {
      toastHTML = makeToast("vol-down.png", "VOL DOWN");
      if (isYouTube) {
        sendYoutubeCmd("setVolume", [50]);
      } else {
        videoEl.volume = Math.max(0, videoEl.volume - 0.2);
      }
    } else if (cmdId === "vc-mute") {
      toastHTML = makeToast("mute.png", "TOGGLE MUTE");
      if (isYouTube) {
        sendYoutubeCmd("mute");
      } else {
        videoEl.muted = !videoEl.muted;
      }
    }

    // Auto-play after command
    overlay.classList.add("hidden");

    if (isYouTube) {
      sendYoutubeCmd("playVideo");
    } else {
      videoEl.play();
    }

    this.showToast(toastHTML);

    return "RESUMED";
  }

  showToast(message) {
    const toast = document.getElementById("video-toast");
    if (!toast) return;

    toast.innerHTML = message;
    toast.classList.remove("hidden");
    toast.style.opacity = "1";

    if (this.toastTimer) clearTimeout(this.toastTimer);

    this.toastTimer = setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.classList.add("hidden"), 300);
    }, 2000);
  }
}

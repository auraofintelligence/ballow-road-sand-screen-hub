(function () {
  const points = window.BALLOW_SITE_360_POINTS || [];
  const map = document.querySelector("[data-photo-map]");
  const viewer = document.querySelector("[data-pano-viewer]");
  const thumbs = document.querySelector("[data-photo-thumbs]");
  const preview = document.querySelector("[data-photo-preview]");
  const downloadButton = document.querySelector("[data-download-current]");
  const copyButton = document.querySelector("[data-copy-prompt]");
  const randomButton = document.querySelector("[data-random-idea]");
  const promptOutput = document.querySelector("[data-generated-prompt]");
  const ideaFields = document.querySelectorAll("[data-idea-option], [data-idea-custom], [data-idea-users], [data-idea-look], [data-idea-practical]");
  let activePoint = points[0];
  let sphereViewer = null;

  if (!points.length || !map || !viewer || !thumbs || !preview) return;

  const starterIdeas = [
    "a shaded sand-court terrace with sunset seats, BBQ smoke and a tiny stage for local music",
    "a quiet morning sport zone for retirees, school groups and first-timers, with big shade and easy seats",
    "a moonlight cinema lawn with sand volleyball beside it and a small night-market lane near the road edge",
    "a giant sand chess board, beach tennis nets and a ridiculous but useful crab-shaped climbing net for kids",
    "a bay-lookout picnic edge with low lights, local story signs, a digital noticeboard and one flexible court",
    "a maker-market test day with repair benches, screen demos, sand games and ferry-delay information on a big display"
  ];

  const manualMapPositions = {
    1: [76.0, 30.3], 2: [73.9, 32.8], 3: [70.5, 39.3], 4: [67.7, 46.0],
    5: [67.0, 51.4], 6: [63.9, 53.2], 7: [63.8, 58.3], 8: [59.7, 58.2],
    9: [54.0, 55.6], 10: [50.0, 54.1], 11: [45.0, 57.0], 12: [41.5, 61.0],
    13: [59.5, 55.5], 14: [59.0, 58.8], 15: [63.1, 52.6], 16: [60.3, 52.0],
    17: [58.8, 49.0], 18: [55.3, 49.0], 19: [56.0, 46.8], 20: [56.2, 48.3],
    21: [52.2, 44.5], 22: [51.0, 43.8], 23: [51.5, 40.4], 24: [49.3, 37.4],
    25: [50.6, 33.8], 26: [52.0, 29.8], 27: [54.7, 26.1], 28: [58.2, 19.9],
    29: [61.5, 16.0], 30: [63.3, 17.0], 31: [66.5, 20.2], 32: [67.7, 23.5],
    33: [65.8, 27.0], 34: [61.7, 32.5], 35: [58.7, 35.7], 36: [56.2, 39.7],
    37: [59.4, 42.3], 38: [61.5, 42.7], 39: [62.0, 40.4], 40: [64.5, 38.0],
    41: [66.0, 35.0], 42: [68.4, 33.5], 43: [70.4, 30.0], 44: [75.2, 26.2]
  };

  function siteZone(point) {
    if (point.sequence >= 7 && point.sequence <= 12) {
      return {
        className: "waterfront",
        label: "Beach / waterfront low-tide edge",
        prompt: "This point sits along the beach and waterfront low-tide edge of the site walk."
      };
    }
    if ((point.sequence >= 29 && point.sequence <= 32) || point.sequence === 44) {
      return {
        className: "ballow-road",
        label: "Ballow Road grass edge",
        prompt: "This point sits along the grass edge beside Ballow Road."
      };
    }
    if (point.sequence <= 6) {
      return {
        className: "upper-east",
        label: "Upper eastern entry side",
        prompt: "This point sits on the upper eastern entry side near QUAMPI and the road-side edge."
      };
    }
    if (point.sequence >= 13 && point.sequence <= 28) {
      return {
        className: "middle-slope",
        label: "Middle slope and bay-view ground",
        prompt: "This point sits on the middle slope and bay-view ground."
      };
    }
    return {
      className: "return-walk",
      label: "Cross-site return walk",
      prompt: "This point sits on the cross-site return walk."
    };
  }

  function setStatus(message) {
    const status = document.querySelector("[data-workflow-status]");
    if (status) status.textContent = message;
  }

  function supportsWebGl() {
    try {
      const canvas = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")));
    } catch (error) {
      return false;
    }
  }

  function project(point) {
    const [x, y] = manualMapPositions[point.sequence] || [50, 50];
    return { x, y };
  }

  function downloadFile(url, filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "";
    document.body.append(link);
    link.click();
    link.remove();
  }

  function currentViewLabel() {
    if (!sphereViewer) return "selected viewer angle";
    return `yaw ${Math.round(sphereViewer.getYaw())}, pitch ${Math.round(sphereViewer.getPitch())}, field of view ${Math.round(sphereViewer.getHfov())}`;
  }

  function selectedUses() {
    return Array.from(document.querySelectorAll("[data-idea-option]:checked"))
      .map((input) => input.value.trim())
      .filter(Boolean);
  }

  function fieldValue(selector) {
    return document.querySelector(selector)?.value.trim() || "";
  }

  function syncPrompt() {
    if (!promptOutput || !activePoint) return;
    const uses = selectedUses();
    const custom = fieldValue("[data-idea-custom]");
    const users = fieldValue("[data-idea-users]") || "locals, visitors, young people, Elders, clubs, traders and tourists";
    const look = fieldValue("[data-idea-look]") || "sand, shade, seating, trees, simple lighting, clear signs and the bay outlook";
    const practical = fieldValue("[data-idea-practical]") || "walking access, toilets, setup, pack-down, neighbours, traffic, cleaning and calm everyday use";
    const idea = [custom, ...uses].filter(Boolean).join("; ") || "a practical public use for the site that locals and visitors can understand quickly";
    const zone = siteZone(activePoint);

    promptOutput.value = [
      `Use the attached 360 view from 10-12 Ballow Road, Dunwich / Goompi, photo ${activePoint.sequence}.`,
      `Site-walk position: ${zone.prompt}`,
      `Design idea: ${idea}.`,
      `Users: ${users}.`,
      `Visible details: ${look}.`,
      `Keep practical: ${practical}.`,
      "Show the sloping open land, existing trees, bay outlook, road-side access and village-scale setting beside QUAMPI.",
      "Make it feel like a confident Straddie public place: sport, culture, shade, food, music, notices, neighbour sense and room to change after local feedback.",
      `Viewer angle: ${currentViewLabel()}.`
    ].join("\n");
  }

  function renderMap() {
    map.innerHTML = points.map((point) => {
      const position = project(point);
      const zone = siteZone(point);
      return `
        <button class="map-point ${zone.className}" type="button" data-point-id="${point.id}" style="left:${position.x}%;top:${position.y}%" title="${point.publicName}: ${zone.label}">
          <span>${point.sequence}</span>
        </button>
      `;
    }).join("");

    map.querySelectorAll("[data-point-id]").forEach((button) => {
      button.addEventListener("click", () => setActive(button.dataset.pointId));
    });
  }

  function renderThumbs() {
    thumbs.innerHTML = points.map((point) => `
      <button class="thumb-button" type="button" data-thumb-id="${point.id}">
        <img src="${point.thumb}" alt="${point.publicName}">
        <span>${point.sequence}</span>
      </button>
    `).join("");

    thumbs.querySelectorAll("[data-thumb-id]").forEach((button) => {
      button.addEventListener("click", () => setActive(button.dataset.thumbId));
    });
  }

  function renderPreview(point) {
    const zone = siteZone(point);
    preview.innerHTML = `
      <img src="${point.thumb}" alt="${point.publicName}">
      <div>
        <span class="preview-label">Selected point</span>
        <strong>${point.publicName}</strong>
        <span>${zone.label}</span>
        <span>${point.captureLabel}</span>
        <span>${typeof point.altitude === "number" ? `${point.altitude} m GPS altitude` : "GPS point loaded"}</span>
        <a href="${point.pano}" target="_blank" rel="noopener noreferrer">Open flat pano fallback</a>
      </div>
    `;
  }

  function renderViewer(point) {
    const zone = siteZone(point);
    viewer.innerHTML = `
      <section class="pano-viewer main-pano-viewer" aria-label="${point.publicName} interactive 360 viewer">
        <div class="pano-header">
          <div>
            <span class="eyebrow">Interactive 360 view</span>
            <h3>${point.publicName}</h3>
            <p>${zone.label}. Drag inside the photo, frame the angle that matters, then use it with the prompt below.</p>
          </div>
          <span class="pano-tag">360 viewer</span>
        </div>
        <div class="sphere-viewer main-sphere-viewer" data-sphere-stage aria-label="${point.publicName} interactive 360 sphere"></div>
        <div class="button-row viewer-buttons">
          <button class="button primary small-button" type="button" data-save-view>Save current view</button>
          <a class="button secondary small-button" href="${point.pano}" download="${point.downloadName}">Download full 360</a>
        </div>
        <details class="raw-pano-details">
          <summary>Open raw flattened panorama strip</summary>
          <div class="pano-scroll"><img src="${point.pano}" alt="${point.publicName} equirectangular panorama"></div>
        </details>
        <p class="viewer-note" data-workflow-status>Loading the 360 viewer...</p>
      </section>
    `;
    setupSphereViewer(point);
    viewer.querySelectorAll("[data-save-view]").forEach((button) => {
      button.addEventListener("click", () => saveCurrentView(point));
    });
  }

  function setupSphereViewer(point) {
    const stage = viewer.querySelector("[data-sphere-stage]");
    if (!stage) return;

    if (sphereViewer?.destroy) {
      sphereViewer.destroy();
      sphereViewer = null;
    }

    if (!supportsWebGl()) {
      stage.innerHTML = `
        <div class="viewer-fallback">
          <h4>360 viewer unavailable on this device</h4>
          <p>Use the thumbnail, the raw flattened panorama strip, or download the full 360 photo.</p>
        </div>
      `;
      setStatus("WebGL is not available here. Use the fallback image or download link.");
      return;
    }

    if (!window.pannellum?.viewer) {
      stage.innerHTML = `<img class="pano-fallback" src="${point.pano}" alt="${point.publicName}">`;
      setStatus("The 360 viewer did not load. Use the flat pano fallback.");
      return;
    }

    sphereViewer = window.pannellum.viewer(stage, {
      type: "equirectangular",
      panorama: point.pano,
      autoLoad: true,
      showControls: true,
      showFullscreenCtrl: true,
      pitch: -4,
      yaw: 0,
      hfov: 95,
      minHfov: 35,
      maxHfov: 120,
      keyboardZoom: true,
      compass: false,
      preview: point.thumb,
      previewTitle: point.publicName,
      previewAuthor: "Ballow Road Sand & Screen Hub"
    });

    sphereViewer.on("load", () => {
      setStatus("Drag inside the 360 sphere, then save a useful angle or copy the prompt below.");
      syncPrompt();
    });

    sphereViewer.on("error", () => {
      setStatus("This photo did not load in the 360 sphere. Use the flat pano fallback.");
    });
  }

  function setActive(id) {
    const point = points.find((item) => item.id === id) || points[0];
    activePoint = point;
    document.querySelectorAll("[data-point-id], [data-thumb-id]").forEach((element) => {
      element.classList.toggle("is-active", element.dataset.pointId === point.id || element.dataset.thumbId === point.id);
    });
    renderPreview(point);
    renderViewer(point);
    syncPrompt();
  }

  function saveCurrentView(point = activePoint) {
    if (!sphereViewer || !sphereViewer.isLoaded?.()) {
      setStatus("The 360 viewer is still loading. Try again once the image is visible.");
      return;
    }

    try {
      sphereViewer.stopMovement?.();
      const canvas = sphereViewer.getRenderer?.()?.getCanvas?.() || viewer.querySelector("canvas");
      if (!canvas || !canvas.toBlob) throw new Error("Viewer canvas is not available.");
      canvas.toBlob((blob) => {
        if (!blob) {
          setStatus("This browser could not export the view. Use a browser screenshot, then copy the prompt below.");
          return;
        }
        const label = currentViewLabel().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
        const url = URL.createObjectURL(blob);
        downloadFile(url, `${point.id}-${label}.png`);
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
        setStatus(`Saved the current view from ${currentViewLabel()}. Use that image with the prompt below.`);
      }, "image/png");
    } catch (error) {
      setStatus("This browser could not export the view. Use a browser screenshot, then copy the prompt below.");
    }
  }

  renderMap();
  renderThumbs();
  setActive(activePoint.id);

  ideaFields.forEach((field) => {
    field.addEventListener("input", syncPrompt);
    field.addEventListener("change", syncPrompt);
  });

  document.querySelectorAll("[data-save-view]").forEach((button) => {
    button.addEventListener("click", () => saveCurrentView(activePoint));
  });

  downloadButton?.addEventListener("click", () => downloadFile(activePoint.pano, activePoint.downloadName));

  copyButton?.addEventListener("click", async () => {
    syncPrompt();
    try {
      await navigator.clipboard.writeText(promptOutput.value);
      setStatus("Prompt copied. Attach a saved view or screenshot and test the idea.");
    } catch (error) {
      promptOutput.select();
      setStatus("Prompt selected. Copy it manually and attach a saved view or screenshot.");
    }
  });

  randomButton?.addEventListener("click", () => {
    const custom = document.querySelector("[data-idea-custom]");
    if (custom) {
      custom.value = starterIdeas[Math.floor(Math.random() * starterIdeas.length)];
      syncPrompt();
      setStatus("Starter loaded. Tweak it until it sounds like a real local idea.");
    }
  });
})();

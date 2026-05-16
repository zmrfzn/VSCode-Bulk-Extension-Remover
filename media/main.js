(function () {
  const vscode = acquireVsCodeApi();
  const state = {
    extensions: [],
    pendingRestartRemovals: [],
    filter: "",
    selected: new Set(),
    failedRemovals: [],
    dryRun: false,
    protectedCount: 0,
    isBusy: false,
    statusMessage: "Loading installed extensions..."
  };

  const searchInput = document.getElementById("search");
  const list = document.getElementById("list");
  const counter = document.getElementById("counter");
  const progress = document.getElementById("progress");
  const removeButton = document.getElementById("remove");
  const dryRunToggle = document.getElementById("dryRun");
  const retryFailedButton = document.getElementById("retryFailed");
  const refreshButton = document.getElementById("refresh");
  const selectVisibleButton = document.getElementById("selectVisible");
  const clearSelectionButton = document.getElementById("clearSelection");

  function getVisibleExtensions() {
    const query = state.filter.trim().toLowerCase();
    if (!query) {
      return state.extensions;
    }

    return state.extensions.filter((extension) => {
      const haystack = [
        extension.displayName,
        extension.publisher,
        extension.id,
        extension.description
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }

  function getVisiblePendingRemovals() {
    const query = state.filter.trim().toLowerCase();
    if (!query) {
      return state.pendingRestartRemovals;
    }

    return state.pendingRestartRemovals.filter((extension) => {
      const haystack = [extension.label, extension.id].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }

  function render() {
    const visible = getVisibleExtensions();
    const visiblePending = getVisiblePendingRemovals();
    const selectedCount = state.selected.size;
    counter.textContent =
      selectedCount === 1 ? "1 selected" : selectedCount + " selected";
    progress.textContent = state.statusMessage;
    removeButton.disabled = selectedCount === 0 || state.isBusy;
    retryFailedButton.hidden = state.failedRemovals.length === 0;
    retryFailedButton.disabled = state.isBusy;
    dryRunToggle.checked = state.dryRun;
    dryRunToggle.disabled = state.isBusy;
    refreshButton.disabled = state.isBusy;
    selectVisibleButton.disabled = state.isBusy;
    clearSelectionButton.disabled = state.isBusy;

    if (!visible.length && !visiblePending.length) {
      list.innerHTML =
        '<div class="empty">No extensions match the current filter.</div>';
      return;
    }

    const installedMarkup = visible
      .map((extension) => {
        const checked =
          !extension.isProtected && state.selected.has(extension.id)
            ? "checked"
            : "";
        const disabled = extension.isProtected ? "disabled" : "";
        const protectedClass = extension.isProtected ? " protected" : "";
        const protectedBadge = extension.isProtected
          ? '<span class="badge">Protected</span>'
          : "";
        const protectLabel = extension.isProtected ? "Unprotect" : "Protect";
        const nextProtectedState = extension.isProtected ? "false" : "true";
        const protectHelp =
          "Protected extensions stay installed. They are skipped by Select Visible, dry runs, normal uninstalls, and retries until you unprotect them.";

        return `
          <div class="item${protectedClass}">
            <input type="checkbox" data-id="${escapeHtml(extension.id)}" ${checked} ${disabled} />
            <div class="meta">
              <div class="nameRow">
                <div class="name">${escapeHtml(extension.displayName)}</div>
                <div class="rowActions">
                  ${protectedBadge}
                  <span class="infoIcon" title="${escapeHtml(protectHelp)}" aria-label="${escapeHtml(protectHelp)}">i</span>
                  <button class="ghost protectButton" type="button" data-protect-id="${escapeHtml(extension.id)}" data-protected="${nextProtectedState}">${protectLabel}</button>
                </div>
              </div>
              <div class="id">${escapeHtml(extension.publisher)} &bull; ${escapeHtml(extension.version)} &bull; ${escapeHtml(extension.id)}</div>
              <div class="description">${escapeHtml(extension.description || "No description provided.")}</div>
              ${
                extension.isProtected
                  ? '<div class="description">Protected extensions are skipped during dry runs, normal uninstalls, and retries.</div>'
                  : ""
              }
            </div>
          </div>
        `;
      })
      .join("");

    const pendingMarkup = visiblePending
      .map(
        (extension) => `
          <div class="pendingItem">
            <div class="pendingName">${escapeHtml(extension.label)}</div>
            <div class="pendingMeta">${escapeHtml(extension.id)}</div>
            <div class="pendingMeta">Open VS Code's Extensions view and click its native Restart Extensions button to complete removal.</div>
          </div>
        `
      )
      .join("");

    const pendingHeader = pendingMarkup
      ? `
          <div class="sectionTitle">
            <div class="sectionHeader">
              <span>Pending Restart</span>
              <button id="openRestartScreen" class="ghost sectionAction" type="button">Open Restart Screen</button>
              <button id="reloadWindow" class="ghost sectionAction" type="button">Reload Window</button>
            </div>
          </div>
        `
      : "";

    list.innerHTML =
      (installedMarkup
        ? '<div class="sectionTitle">Installed</div>' + installedMarkup
        : "") + (pendingMarkup ? pendingHeader + pendingMarkup : "");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  searchInput.addEventListener("input", (event) => {
    state.filter = event.target.value;
    render();
  });

  refreshButton.addEventListener("click", () => {
    state.statusMessage = "Refreshing installed extensions...";
    render();
    vscode.postMessage({ type: "refresh" });
  });

  selectVisibleButton.addEventListener("click", () => {
    for (const extension of getVisibleExtensions()) {
      if (!extension.isProtected) {
        state.selected.add(extension.id);
      }
    }
    render();
  });

  clearSelectionButton.addEventListener("click", () => {
    state.selected.clear();
    render();
  });

  dryRunToggle.addEventListener("change", (event) => {
    state.dryRun = event.target.checked;
    state.statusMessage = state.dryRun
      ? "Dry run is on. Uninstall will preview removals only."
      : "Dry run is off. Uninstall will remove selected extensions after confirmation.";
    render();
  });

  removeButton.addEventListener("click", () => {
    state.isBusy = true;
    state.failedRemovals = [];
    state.statusMessage = state.dryRun
      ? "Preparing dry run..."
      : "Preparing uninstall...";
    render();
    vscode.postMessage({
      type: "uninstall",
      extensionIds: Array.from(state.selected),
      dryRun: state.dryRun
    });
  });

  retryFailedButton.addEventListener("click", () => {
    state.isBusy = true;
    state.statusMessage =
      "Retrying " + state.failedRemovals.length + " failed removal(s)...";
    render();
    vscode.postMessage({
      type: "retryFailed",
      extensionIds: state.failedRemovals.map((failure) => failure.id)
    });
  });

  list.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "checkbox") {
      return;
    }

    const extensionId = target.dataset.id;
    if (!extensionId) {
      return;
    }

    if (target.checked) {
      state.selected.add(extensionId);
    } else {
      state.selected.delete(extensionId);
    }

    render();
  });

  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const restartScreenButton = target.closest("#openRestartScreen");
    const reloadButton = target.closest("#reloadWindow");
    const protectButton = target.closest("[data-protect-id]");

    if (protectButton) {
      const extensionId = protectButton.dataset.protectId;
      const shouldProtect = protectButton.dataset.protected === "true";

      if (extensionId) {
        if (shouldProtect) {
          state.selected.delete(extensionId);
        }

        state.statusMessage = shouldProtect
          ? "Protecting extension..."
          : "Removing protection...";
        render();
        vscode.postMessage({
          type: "toggleProtected",
          extensionId,
          protected: shouldProtect
        });
      }
      return;
    }

    if (restartScreenButton) {
      state.statusMessage = "Opening VS Code's native restart screen...";
      render();
      vscode.postMessage({ type: "openRestartScreen" });
      return;
    }

    if (reloadButton) {
      state.statusMessage = "Reloading window...";
      render();
      vscode.postMessage({ type: "reloadWindow" });
    }
  });

  window.addEventListener("message", (event) => {
    const message = event.data;

    if (message.type === "extensions") {
      const knownIds = new Set(
        message.extensions.map((extension) => extension.id)
      );
      const protectedIds = new Set(
        message.extensions
          .filter((extension) => extension.isProtected)
          .map((extension) => extension.id)
      );
      state.selected = new Set(
        Array.from(state.selected).filter(
          (extensionId) => knownIds.has(extensionId) && !protectedIds.has(extensionId)
        )
      );
      state.extensions = message.extensions;
      state.pendingRestartRemovals = message.pendingRestartRemovals || [];
      state.protectedCount = message.protectedCount || 0;
      if (
        !state.isBusy &&
        (state.statusMessage === "Loading installed extensions..." ||
          state.statusMessage === "Refreshing installed extensions..." ||
          state.statusMessage === "Protecting extension..." ||
          state.statusMessage === "Removing protection...")
      ) {
        state.statusMessage = "Ready.";
      }
      render();
    }

    if (message.type === "progress") {
      handleProgressMessage(message);
    }
  });

  function handleProgressMessage(message) {
    if (message.phase === "running") {
      state.isBusy = true;
      state.statusMessage = message.message;
      render();
    } else if (message.phase === "itemComplete") {
      state.statusMessage =
        message.status === "failed"
          ? "Failed: " + message.label + ". " + message.message
          : message.status === "dryRun"
            ? "Dry run: would remove " + message.label + "."
            : "Finished: " + message.label + ".";
      render();
    } else if (message.phase === "cancelled") {
      state.isBusy = false;
      state.statusMessage = message.message;
      render();
    } else if (message.phase === "complete") {
      state.isBusy = false;
      if (!message.dryRun) {
        state.selected.clear();
      }
      state.failedRemovals = message.failures || [];
      if (message.dryRun && message.skippedCount > 0) {
        state.statusMessage =
          "Dry run cancelled. Previewed " +
          message.successCount +
          " extension(s); " +
          message.skippedCount +
          " were not previewed; would skip " +
          (message.protectedSkippedCount || 0) +
          " protected.";
      } else if (message.dryRun) {
        state.statusMessage =
          "Dry run complete. Would remove " +
          message.successCount +
          " extension(s); would skip " +
          (message.protectedSkippedCount || 0) +
          " protected.";
      } else if (message.protectedSkippedCount > 0 && message.successCount === 0) {
        state.statusMessage =
          "No extensions removed. " +
          message.protectedSkippedCount +
          " protected extension(s) were skipped.";
      } else if (message.skippedCount > 0) {
        state.statusMessage =
          "Cancelled. Removed " +
          message.successCount +
          " extension(s); " +
          message.skippedCount +
          " were not attempted.";
      } else if (message.failureCount > 0) {
        state.statusMessage =
          "Finished with " +
          message.successCount +
          " removed and " +
          message.failureCount +
          " failed. " +
          message.failures
            .slice(0, 2)
            .map((failure) => failure.label + ": " + failure.reason)
            .join(" | ");
      } else if (message.pendingRestartCount > 0) {
        state.statusMessage =
          "Removed " +
          message.successCount +
          " extension(s). " +
          message.pendingRestartCount +
          " are pending restart. Open the native restart screen to finish removal.";
      } else {
        state.statusMessage =
          "Finished. Removed " +
          message.successCount +
          " extension(s)." +
          (message.protectedSkippedCount > 0
            ? " Skipped " + message.protectedSkippedCount + " protected."
            : "");
      }
      render();
    }
  }

  vscode.postMessage({ type: "ready" });
})();

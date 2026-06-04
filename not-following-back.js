/**
 * Instagram — Not Following Back
 * --------------------------------
 * Paste this into the browser console while logged into instagram.com.
 * It finds everyone you follow who doesn't follow you back and lets you
 * view or unfollow them one by one from a floating overlay UI.
 *
 * Usage:
 *   1. Go to https://www.instagram.com
 *   2. Open DevTools → Console
 *   3. Type:  allow pasting
 *   4. Paste this entire script and press Enter
 */

(async () => {
  // ─── Config ────────────────────────────────────────────────────────────────
  const APP_ID = '936619743392459';
  const PAGE_SIZE = 200;
  const BASE = 'https://www.instagram.com/api/v1/friendships';

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Extract a cookie value by name */
  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  /** Resolve the logged-in user's numeric ID from the page or cookies */
  function getMyUserId() {
    // Try window.__additionalDataLoaded or sharedData first
    try {
      const shared = window._sharedData || JSON.parse(
        document.getElementById('react-root')?.closest('body')
          ?.querySelector('script[type="application/json"]')?.textContent || '{}'
      );
      const id = shared?.config?.viewer?.id;
      if (id) return id;
    } catch (_) { /* ignore */ }

    // Fallback: ds_user_id cookie set by Instagram
    const fromCookie = getCookie('ds_user_id');
    if (fromCookie) return fromCookie;

    return null;
  }

  /** Paginate through a friendships endpoint (following or followers) */
  async function fetchAll(userId, type) {
    const users = [];
    let nextMaxId = null;
    let page = 1;

    while (true) {
      const url = new URL(`${BASE}/${userId}/${type}/`);
      url.searchParams.set('count', PAGE_SIZE);
      if (nextMaxId) url.searchParams.set('max_id', nextMaxId);

      const resp = await fetch(url.toString(), {
        headers: {
          'x-ig-app-id': APP_ID,
          'x-csrftoken': getCookie('csrftoken') || '',
          'x-requested-with': 'XMLHttpRequest',
        },
        credentials: 'include',
      });

      if (!resp.ok) throw new Error(`${type} fetch failed (${resp.status}): ${await resp.text()}`);

      const data = await resp.json();
      users.push(...(data.users || []));

      updateStatus(`Fetching ${type}… page ${page} (${users.length} loaded)`);
      page++;

      if (data.next_max_id) {
        nextMaxId = data.next_max_id;
        // Polite delay to avoid rate limiting
        await sleep(600);
      } else {
        break;
      }
    }

    return users;
  }

  /** Call Instagram's unfollow endpoint */
  async function unfollowUser(userId) {
    const resp = await fetch(`${BASE}/${userId}/unfollow/`, {
      method: 'POST',
      headers: {
        'x-ig-app-id': APP_ID,
        'x-csrftoken': getCookie('csrftoken') || '',
        'x-requested-with': 'XMLHttpRequest',
        'content-type': 'application/x-www-form-urlencoded',
      },
      credentials: 'include',
    });
    if (!resp.ok) throw new Error(`Unfollow failed (${resp.status})`);
    return resp.json();
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─── Overlay UI ────────────────────────────────────────────────────────────

  const STYLES = `
    #igtools-overlay * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    #igtools-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.75); backdrop-filter: blur(4px);
      z-index: 999999; display: flex; align-items: center; justify-content: center;
    }
    #igtools-card {
      background: #1a1a1a; border: 1px solid #333; border-radius: 16px;
      width: 420px; max-width: 95vw; padding: 28px 28px 24px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6); color: #fff;
    }
    #igtools-title {
      font-size: 18px; font-weight: 700; margin: 0 0 6px;
      background: linear-gradient(90deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    #igtools-status {
      font-size: 13px; color: #888; margin: 0 0 20px;
      min-height: 18px;
    }
    #igtools-counter {
      font-size: 12px; font-weight: 600; color: #555;
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;
    }
    #igtools-user-card {
      background: #262626; border-radius: 12px; padding: 16px;
      display: flex; align-items: center; gap: 14px; margin-bottom: 18px;
    }
    #igtools-avatar {
      width: 52px; height: 52px; border-radius: 50%;
      object-fit: cover; border: 2px solid #333; flex-shrink: 0;
      background: #333;
    }
    #igtools-user-info { flex: 1; min-width: 0; }
    #igtools-username {
      font-size: 15px; font-weight: 600; color: #fff;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    #igtools-fullname {
      font-size: 13px; color: #888; margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    #igtools-actions { display: flex; gap: 10px; }
    .igtools-btn {
      flex: 1; padding: 10px 0; border-radius: 8px; border: none;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.15s;
    }
    .igtools-btn:hover { opacity: 0.85; }
    .igtools-btn:active { opacity: 0.7; }
    #igtools-btn-profile { background: #262626; border: 1px solid #444; color: #fff; }
    #igtools-btn-unfollow { background: #ed4956; color: #fff; }
    #igtools-btn-skip { background: #262626; border: 1px solid #444; color: #aaa; flex: 0 0 auto; padding: 10px 16px; }
    #igtools-progress {
      height: 3px; background: #333; border-radius: 2px; margin-top: 18px; overflow: hidden;
    }
    #igtools-progress-bar {
      height: 100%; border-radius: 2px;
      background: linear-gradient(90deg, #f09433, #dc2743, #bc1888);
      transition: width 0.3s;
    }
    #igtools-close {
      position: absolute; top: 16px; right: 20px;
      background: none; border: none; color: #555; font-size: 22px;
      cursor: pointer; line-height: 1; padding: 4px;
    }
    #igtools-close:hover { color: #fff; }
    #igtools-done {
      text-align: center; padding: 20px 0 10px;
      font-size: 15px; color: #888;
    }
    #igtools-done strong { display: block; font-size: 22px; color: #fff; margin-bottom: 6px; }
    #igtools-spinner {
      display: flex; flex-direction: column; align-items: center;
      gap: 14px; padding: 20px 0;
    }
    .igtools-spin {
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid #333;
      border-top-color: #dc2743;
      animation: igtools-rotate 0.8s linear infinite;
    }
    @keyframes igtools-rotate { to { transform: rotate(360deg); } }
  `;

  function injectStyles() {
    if (document.getElementById('igtools-styles')) return;
    const s = document.createElement('style');
    s.id = 'igtools-styles';
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  function removeOverlay() {
    document.getElementById('igtools-overlay')?.remove();
    document.getElementById('igtools-styles')?.remove();
  }

  let overlayEl, statusEl;

  function buildOverlay() {
    injectStyles();
    removeOverlay();

    overlayEl = document.createElement('div');
    overlayEl.id = 'igtools-overlay';
    overlayEl.style.position = 'fixed';

    overlayEl.innerHTML = `
      <div id="igtools-card" style="position:relative">
        <button id="igtools-close" title="Close">✕</button>
        <p id="igtools-title">Not Following Back</p>
        <p id="igtools-status">Starting…</p>
        <div id="igtools-spinner">
          <div class="igtools-spin"></div>
          <span style="font-size:13px;color:#666">Fetching your lists…</span>
        </div>
        <div id="igtools-progress" style="display:none">
          <div id="igtools-progress-bar" style="width:0%"></div>
        </div>
      </div>
    `;

    document.body.appendChild(overlayEl);
    statusEl = document.getElementById('igtools-status');
    document.getElementById('igtools-close').onclick = removeOverlay;
  }

  function updateStatus(msg) {
    if (statusEl) statusEl.textContent = msg;
  }

  function showResults(nonFollowers) {
    const card = document.getElementById('igtools-card');
    if (!card) return;

    let index = 0;
    const total = nonFollowers.length;

    if (total === 0) {
      card.innerHTML = `
        <button id="igtools-close" title="Close">✕</button>
        <p id="igtools-title">Not Following Back</p>
        <div id="igtools-done">
          <strong>All clear!</strong>
          Everyone you follow also follows you back.
        </div>`;
      document.getElementById('igtools-close').onclick = removeOverlay;
      return;
    }

    function render() {
      if (index >= nonFollowers.length) {
        card.innerHTML = `
          <button id="igtools-close" title="Close">✕</button>
          <p id="igtools-title">Not Following Back</p>
          <div id="igtools-done">
            <strong>Done!</strong>
            You reviewed all ${total} account${total !== 1 ? 's' : ''}.
          </div>`;
        document.getElementById('igtools-close').onclick = removeOverlay;
        return;
      }

      const user = nonFollowers[index];
      const remaining = nonFollowers.length - index;
      const progress = Math.round(((index) / total) * 100);

      card.innerHTML = `
        <button id="igtools-close" title="Close">✕</button>
        <p id="igtools-title">Not Following Back</p>
        <p id="igtools-status">&nbsp;</p>
        <div id="igtools-counter">${remaining} of ${total} remaining</div>
        <div id="igtools-user-card">
          <img id="igtools-avatar" src="${user.profile_pic_url || ''}" alt="" onerror="this.style.display='none'" />
          <div id="igtools-user-info">
            <div id="igtools-username">@${user.username}</div>
            <div id="igtools-fullname">${user.full_name || ''}</div>
          </div>
        </div>
        <div id="igtools-actions">
          <button class="igtools-btn" id="igtools-btn-profile">View Profile</button>
          <button class="igtools-btn" id="igtools-btn-unfollow">Unfollow</button>
          <button class="igtools-btn" id="igtools-btn-skip">Skip</button>
        </div>
        <div id="igtools-progress">
          <div id="igtools-progress-bar" style="width:${progress}%"></div>
        </div>
      `;

      statusEl = document.getElementById('igtools-status');
      document.getElementById('igtools-close').onclick = removeOverlay;

      document.getElementById('igtools-btn-profile').onclick = () => {
        window.open(`https://www.instagram.com/${user.username}/`, '_blank');
      };

      document.getElementById('igtools-btn-skip').onclick = () => {
        index++;
        render();
      };

      document.getElementById('igtools-btn-unfollow').onclick = async () => {
        const btn = document.getElementById('igtools-btn-unfollow');
        if (!btn) return;
        btn.textContent = 'Unfollowing…';
        btn.disabled = true;
        try {
          await unfollowUser(user.pk);
          nonFollowers.splice(index, 1);
          // stay at same index (next user slides in), add small delay
          await sleep(500);
          render();
        } catch (e) {
          updateStatus(`Error: ${e.message}`);
          btn.textContent = 'Unfollow';
          btn.disabled = false;
        }
      };
    }

    render();
  }

  // ─── Main ──────────────────────────────────────────────────────────────────

  buildOverlay();
  updateStatus('Resolving your account…');

  try {
    const myId = getMyUserId();
    if (!myId) {
      updateStatus('Could not find your user ID. Are you logged in?');
      return;
    }

    updateStatus(`Found user ID: ${myId}. Fetching following list…`);
    const following = await fetchAll(myId, 'following');

    updateStatus(`Fetched ${following.length} following. Now fetching followers…`);
    const followers = await fetchAll(myId, 'followers');

    updateStatus('Comparing lists…');
    const followerIds = new Set(followers.map(u => u.pk));
    const notFollowingBack = following.filter(u => !followerIds.has(u.pk));

    updateStatus(`Found ${notFollowingBack.length} accounts that don't follow you back.`);
    await sleep(600);

    showResults(notFollowingBack);
  } catch (err) {
    updateStatus(`Error: ${err.message}`);
    console.error('[instagram-tools]', err);
  }
})();

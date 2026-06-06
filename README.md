# Instagram Tools

A collection of browser console scripts for personal Instagram account management.

---

## `not-following-back.js`

Find everyone you follow who **doesn't follow you back** — and optionally unfollow them — directly from Instagram's website, with no third-party app or login required.

### What it does

1. Reads your logged-in user session from the browser
2. Fetches your full **following** and **followers** lists via Instagram's internal API
3. Compares the two lists to find accounts that don't follow you back
4. Displays a **floating overlay UI** on the Instagram page showing each non-follower one by one

For each account you can:
- **View Profile** — opens their Instagram profile in a new tab
- **Unfollow** — calls Instagram's unfollow endpoint automatically
- **Skip** — move on without taking action

A progress counter shows how many accounts are left to review.

---

### How to use

1. Go to **[https://www.instagram.com](https://www.instagram.com)** and make sure you're logged in
2. Open **DevTools**:
   - Mac: `Cmd + Option + J`
   - Windows/Linux: `Ctrl + Shift + J`
3. Open the **Sources** tab → **Snippets** → **New snippet**
4. Copy the entire contents of [`not-following-back.js`](./not-following-back.js) and paste it into the snippet
5. Press **Cmd+Enter** to run it
6. Usernames will be printed to the console

---

### Screenshot

<!-- Add a screenshot here -->
![Screenshot placeholder](https://via.placeholder.com/800x500/1a1a1a/555555?text=Screenshot+coming+soon)

---

### Notes & Warnings

> **For personal use only.**
> This script runs entirely in your browser using your own logged-in session. It does not store, transmit, or share any of your data with third parties. Use it only on your own account.

- **Instagram may update their internal API at any time**, which could break this script without warning. If it stops working, check for an updated version here.
- This script only works when you are **logged into instagram.com in a desktop browser**. It will not work in the Instagram app.
- Instagram may rate-limit or flag accounts that unfollow a large number of people in a short period. Use this tool responsibly — the script includes small delays between API calls to reduce the risk.
- Tested in **Chrome** and **Firefox**.

---

### How it works (technical)

The script uses Instagram's internal REST API (`/api/v1/friendships/`) — the same endpoints the website itself uses — with your browser's existing session cookies for authentication. No passwords or tokens are extracted. Pagination is handled automatically for accounts following 200+ people.

```
https://www.instagram.com/api/v1/friendships/{userId}/following/
https://www.instagram.com/api/v1/friendships/{userId}/followers/
https://www.instagram.com/api/v1/friendships/{userId}/unfollow/
```

Header used: `x-ig-app-id: 936619743392459`

---

### Disclaimer

This project is not affiliated with, endorsed by, or connected to Instagram or Meta in any way. Use at your own risk. Instagram's Terms of Service prohibit automated interactions with their platform — by using this script, you accept responsibility for any consequences to your account.

async function getNotFollowingBack() {
  const ds_user_id = JSON.parse(document.cookie.split('ds_user_id=')[1].split(';')[0]);

  async function fetchList(type) {
    let users = [], next = null;
    do {
      const url = `https://www.instagram.com/api/v1/friendships/${ds_user_id}/${type}/?count=200${next ? '&max_id=' + next : ''}`;
      const res = await fetch(url, { headers: { 'x-ig-app-id': '936619743392459' } });
      const json = await res.json();
      users = users.concat(json.users);
      next = json.next_max_id;
    } while (next);
    return users;
  }
  const following = await fetchList('following');
  const followers = await fetchList('followers');
  const followerIds = new Set(followers.map(u => u.pk));
  const notFollowingBack = following.filter(u => !followerIds.has(u.pk));
  notFollowingBack.forEach(u => console.log(u.username));
}
getNotFollowingBack();

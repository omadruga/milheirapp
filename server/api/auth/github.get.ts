const DEFAULT_ALLOWED_LOGINS = ["omadruga", "gustavoxadm"];

function allowedLogins() {
  const fromEnv = process.env.GITHUB_ALLOWED_LOGINS;
  const list = fromEnv ? fromEnv.split(",") : DEFAULT_ALLOWED_LOGINS;
  return list.map((login) => login.trim().toLowerCase()).filter(Boolean);
}

export default oauth.githubEventHandler({
  async onSuccess(event, { user }) {
    const login = user?.login?.toLowerCase();

    if (!login || !allowedLogins().includes(login)) {
      await clearUserSession(event);
      return sendRedirect(event, "/?auth=denied");
    }

    await setUserSession(event, {
      user: {
        login: user.login,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
      },
    });
    return sendRedirect(event, "/");
  },
  async onError(event) {
    await clearUserSession(event);
    return sendRedirect(event, "/?auth=error");
  },
});

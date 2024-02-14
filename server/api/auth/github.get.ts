export default oauth.githubEventHandler({
  async onSuccess(event, { user }) {
    // hack only allow myself to login xD
    if (user?.html_url == "https://github.com/omadruga") {
      await setUserSession(event, { user });
    } else {
      await clearUserSession(event);
    }
    return sendRedirect(event, "/");
  },
});

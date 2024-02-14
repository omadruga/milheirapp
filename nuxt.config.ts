// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "dayjs-nuxt", "nuxt-auth-utils", "nuxt-gravatar"],
  dayjs: {
    locales: ["pt-br"],
    plugins: ["relativeTime", "utc", "timezone"],
    defaultLocale: [
      "pt-br",
      {
        relativeTime: {
          future: "em %s",
          past: "%s atrás",
          s: "alguns segundos atrás",
          m: "um minuto",
          mm: "%d minutos",
          h: "uma hora",
          hh: "%d horas",
          d: "um dia",
          dd: "%d dias",
          M: "um mês",
          MM: "%d meses",
          y: "um ano",
          yy: "%d anos",
        },
      },
    ],
    defaultTimezone: "America/Sao_Paulo",
  },
  app: {
    head: {
      title: "Milheirapp",
    },
  },
});

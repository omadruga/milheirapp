export default defineAppConfig({
  ui: {
    primary: "cyan",
    gray: "slate",
    table: {
      default: {
        loadingState: {
          icon: "i-heroicons-arrow-path-20-solid",
          label: "Carregando...",
        },
        emptyState: {
          icon: "i-heroicons-circle-stack-20-solid",
          label: "Nenhum item por aqui...",
        },
      },
    },
  },
});

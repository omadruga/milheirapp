<template>
  <Disclosure as="nav" class="bg-gray-900" v-slot="{ open }">
    <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
      <div class="relative flex h-16 items-center justify-between">
        <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
          <!-- Mobile menu button-->
          <DisclosureButton
            class="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          >
            <span class="absolute -inset-0.5" />
            <span class="sr-only">Abrir menu</span>
            <UIcon
              name="i-heroicons-bars-3"
              v-if="!open"
              class="block h-6 w-6"
              aria-hidden="true"
            />
            <UIcon
              name="i-heroicons-x-mark"
              v-else
              class="block h-6 w-6"
              aria-hidden="true"
            />
          </DisclosureButton>
        </div>
        <div
          class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start"
        >
          <div class="flex flex-shrink-0 items-center">
            Logo
            <!--img
              class="h-8 w-auto"
              src="https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=500"
              alt="Your Company"
            /-->
          </div>
          <div class="hidden sm:ml-6 sm:block">
            <div class="flex space-x-4">
              <a
                v-for="item in navigation"
                :key="item.name"
                :href="item.href"
                :class="[
                  item.current
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                  'rounded-md px-3 py-2 text-sm font-medium',
                ]"
                :aria-current="item.current ? 'page' : undefined"
                >{{ item.name }}</a
              >
            </div>
          </div>
        </div>
        <div
          class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0"
        >
          <!-- Profile dropdown -->
          <Menu v-if="loggedIn" as="div" class="relative ml-3">
            <div class="flex items-center gap-2">
              <span class="hidden text-sm text-gray-300 sm:block">
                {{ displayName }}
              </span>
              <MenuButton
                class="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                <span class="absolute -inset-1.5" />
                <span class="sr-only">Abrir menu do perfil</span>
                <img
                  v-if="user?.avatar_url"
                  :src="user.avatar_url"
                  :alt="displayName"
                  class="h-9 w-9 rounded-full"
                />
                <Gravatar v-else :email="user?.email || ''" size="60" />
              </MenuButton>
            </div>
            <transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="transform opacity-0 scale-95"
              enter-to-class="transform opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="transform opacity-100 scale-100"
              leave-to-class="transform opacity-0 scale-95"
            >
              <MenuItems
                class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <div class="border-b border-gray-100 px-4 py-3">
                  <p class="text-sm font-medium text-gray-900">
                    {{ user?.name || user?.login }}
                  </p>
                  <p class="truncate text-xs text-gray-500">
                    @{{ user?.login }}
                  </p>
                </div>
                <MenuItem v-slot="{ active }">
                  <a
                    :href="user?.html_url"
                    target="_blank"
                    rel="noopener"
                    :class="[
                      active ? 'bg-gray-100' : '',
                      'block px-4 py-2 text-sm text-gray-700',
                    ]"
                    >Perfil no GitHub</a
                  >
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <a
                    href="#"
                    :class="[
                      active ? 'bg-gray-100' : '',
                      'block px-4 py-2 text-sm text-gray-700',
                    ]"
                    >Configurações</a
                  >
                </MenuItem>
                <MenuItem v-slot="{ active }">
                  <button
                    type="button"
                    @click="logout"
                    :class="[
                      active ? 'bg-gray-100' : '',
                      'block w-full px-4 py-2 text-left text-sm text-gray-700',
                    ]"
                  >
                    Sair
                  </button>
                </MenuItem>
              </MenuItems>
            </transition>
          </Menu>
          <UButton
            v-else
            to="/api/auth/github"
            label="Login with GitHub"
            color="black"
            external
          />
        </div>
      </div>
    </div>

    <DisclosurePanel class="sm:hidden">
      <div class="space-y-1 px-2 pb-3 pt-2">
        <DisclosureButton
          v-for="item in navigation"
          :key="item.name"
          as="a"
          :href="item.href"
          :class="[
            item.current
              ? 'bg-gray-900 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white',
            'block rounded-md px-3 py-2 text-base font-medium',
          ]"
          :aria-current="item.current ? 'page' : undefined"
          >{{ item.name }}</DisclosureButton
        >
      </div>
    </DisclosurePanel>
  </Disclosure>
</template>
<script setup>
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
} from "@headlessui/vue";
const { loggedIn, user, session, clear } = useUserSession();
const route = useRoute();
const displayName = computed(() => user.value?.name || user.value?.login || "");
const toast = useToast();

onMounted(() => {
  const auth = route.query.auth;
  if (!auth) return;
  toast.add({
    title:
      auth === "denied"
        ? "Conta do GitHub sem permissão"
        : "Falha no login com GitHub",
    description:
      auth === "denied"
        ? "Entre com uma conta autorizada (omadruga ou gustavoxadm)."
        : "Tente novamente.",
    color: "red",
  });
  navigateTo({ query: {} }, { replace: true });
});

const logout = async () => {
  await clear();
  await navigateTo("/", { external: true });
};
const navigation = [
  { name: "DASHBOARD", href: "/", current: route.name == "" },
  { name: "CPFS", href: "/cpfs", current: route.name == "cpfs" },
  { name: "CONTAS", href: "/accounts", current: route.name == "accounts" },
  {
    name: "TRANSAÇÕES",
    href: "/transactions",
    current: route.name == "transactions",
  },
  { name: "EMPRESAS", href: "/companies", current: route.name == "companies" },
];
</script>

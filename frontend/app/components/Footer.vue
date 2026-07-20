<script setup lang="ts"></script>

<template>
  <footer class="w-full bg-white">
    <div class="w-full max-w-[1376px] mx-auto px-6 md:px-9 py-10 md:py-15">
      <div
        class="flex flex-col items-center gap-10 md:flex-row md:items-center md:justify-between"
      >
        <NuxtLink to="/">
          <NuxtImg
            src="/svgs/brand-logo-marketplace-black.svg"
            alt="dom.pl"
            class="w-[200px] h-auto md:w-40 md:h-11"
          />
        </NuxtLink>
        <nav
          class="flex flex-col items-center gap-10 md:flex-row md:gap-6 text-brand-blue-700 text-base md:text-sm font-semibold"
        >
          <NuxtLink
            to="http://localhost:3003/reklama"
            class="hover:text-brand-green-500"
          >
            Reklama
          </NuxtLink>
          <div class="hidden md:block mx-1 h-[6px] w-[1px] bg-brand-blue-700" />
          <NuxtLink
            to="https://dom.pl/polityka-prywatnosci.pdf"
            external
            class="hover:text-brand-green-500"
          >
            Polityka prywatności
          </NuxtLink>
          <!-- <div class="hidden md:block mx-1 h-[6px] w-[1px] bg-brand-blue-700" />
          <NuxtLink to="/cookies" class="hover:text-brand-green-500"
            >Polityka cookies</NuxtLink
          > -->
          <div class="hidden md:block mx-1 h-[6px] w-[1px] bg-brand-blue-700" />
          <NuxtLink
            to="http://localhost:3003/regulamin.pdf"
            external
            class="hover:text-brand-green-500"
          >
            Regulamin
          </NuxtLink>
          <div class="hidden md:block mx-1 h-[6px] w-[1px] bg-brand-blue-700" />
          <NuxtLink
            to="https://dom.pl/rodo.pdf"
            external
            class="hover:text-brand-green-500"
          >
            Rodo
          </NuxtLink>
        </nav>
      </div>
      <div class="my-10 md:my-15 h-px bg-black/10" />
      <div
        class="flex flex-col items-center gap-10 md:flex-row md:items-center md:justify-between text-sm font-semibold"
      >
        <p class="text-brand-blue-700">
          Copyright: DOM.PL 2025 Wszystkie prawa zastrzeżone.
        </p>
        <div class="flex items-center gap-2 text-brand-blue-700 font-bold">
          <span>Made with</span>
          <NuxtImg
            src="/svgs/heartfooter.svg"
            alt="love"
            class="w-[12px] h-[12px]"
          />
          <span>by:</span>
          <NuxtImg
            src="/svgs/logoWB.svg"
            alt="WayBetter"
            class="w-[23px] h-[10px]"
          />
          <NuxtLink
            to="https://waybetter.pl"
            target="_blank"
            class="hover:text-brand-green-500"
            >WayBetter</NuxtLink
          >
        </div>
      </div>
    </div>
  </footer>
</template>

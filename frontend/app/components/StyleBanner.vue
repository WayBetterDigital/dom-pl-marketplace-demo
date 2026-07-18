<template>
  <section class="px-4 md:px-[137px]">
    <div
      class="relative overflow-hidden rounded-[40px] bg-brand-blue-700 text-white min-h-[280px] flex items-center"
    >
      <NuxtImg
        src="/imgs/your-style-house.png"
        alt=""
        class="absolute inset-0 size-full object-cover object-center"
        aria-hidden="true"
      />
      <div
        class="absolute inset-0 bg-linear-to-r from-brand-blue-700 from-5% via-brand-blue-700/40 to-transparent"
        aria-hidden="true"
      />

      <div class="relative px-8 md:pl-[80px] md:pr-10 py-10">
        <h2 class="text-[28px] font-bold leading-9 mb-2">
          Twój projekt. Twój styl.
        </h2>
        <p class="text-[18px] font-medium leading-7 mb-10">
          Kup projekt i zyskaj darmowy pakiet zmian w dokumentacji.
        </p>
        <UButton
          class="rounded-[10px] border border-white/70 bg-transparent px-5 py-3 text-[14px] leading-6 font-semibold text-white hover:bg-white/10"
        >
          Poznaj więcej szczegółów
        </UButton>
      </div>
    </div>
  </section>
</template>

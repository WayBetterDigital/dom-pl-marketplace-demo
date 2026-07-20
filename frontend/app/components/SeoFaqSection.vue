<template>
  <section
    class="-mx-4 md:-mx-[137px] px-4 md:px-[137px] border-t border-[#AEB6CF] pb-20 pt-10 lg:pt-30 bg-linear-to-b from-white to-brand-page"
  >
    <div class="flex flex-col lg:flex-row gap-10">
      <aside class="w-full lg:w-[308px] shrink-0 order-0 lg:order-1">
        <SearchPromoAd />
      </aside>

      <div class="flex-1 min-w-0 mt-5 md:mt-0 order-1 lg:order-2">
        <SeoDescription />

        <hr class="my-20 border-t border-brand-blue-700/15">

        <FaqAccordion />
      </div>
    </div>
  </section>
</template>

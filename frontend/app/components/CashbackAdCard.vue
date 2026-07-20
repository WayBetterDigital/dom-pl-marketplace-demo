<template>
  <div
    class="relative overflow-hidden rounded-xl p-6 bg-brand-blue-700 text-white min-h-[220px] flex flex-col justify-end"
  >
    <NuxtImg
      src="/imgs/cashback-ad.jpg"
      alt=""
      class="absolute inset-0 size-full object-cover"
      aria-hidden="true"
    />
    <div
      class="absolute inset-0 bg-linear-to-r from-brand-blue-700 via-brand-blue-700/50 to-brand-blue-700/20"
      aria-hidden="true"
    />

    <span
      class="absolute top-6 left-4 flex items-center gap-1.5 rounded-full bg-brand-green-500 px-2.5 py-1 text-[10px] leading-4 font-semibold text-white"
    >
      <NuxtImg
        src="/svgs/shining-star.svg"
        alt=""
        class="w-3 h-3"
        aria-hidden="true"
      />
      Pewny zwrot
    </span>

    <div class="relative mt-[45px]">
      <h3 class="text-[21px] font-bold leading-7 mb-2">
        Wybierz projekt,<br>wybuduj i odbierz zwrot!
      </h3>
      <p class="text-[12px] font-medium leading-[18px] mb-6">
        Pochwal się zdjęciami z budowy, zostaw opinię i zgarnij do 2000 zł
        cashbacku.
      </p>
      <NuxtLink
        to=""
        class="text-[12px] font-bold leading-[18px] text-white underline underline-offset-2"
      >
        Zobacz zasady
      </NuxtLink>
    </div>
  </div>
</template>

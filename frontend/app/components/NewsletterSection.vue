<script setup lang="ts">
const email = ref('')
const success = ref(false)
const error = ref('')
const SendWebhook = async () => {
  error.value = ''
  success.value = false
  const value = email.value.trim()
  const isValid =
    !!value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
  if (!isValid) {
    error.value = 'Podaj poprawny adres e-mail'
    return
  }
  try {
    await $fetch('/api/newsletter/subscribe', {
      method: 'POST',
      body: { email: value },
    })
    success.value = true
    email.value = ''
  } catch {
    error.value = 'Nie udało się wysłać. Spróbuj ponownie.'
  }
}
</script>

<template>
  <section class="w-full max-w-[1324px] mx-auto md:px-0 px-2 py-8">
    <div
      class="relative rounded-lg bg-brand-blue-700 shadow-sm ring-1 ring-black/10 overflow-hidden h-[846px] md:h-[350px]"
    >
      <NuxtImg
        src="/imgs/newsletter.png"
        alt="Zapisz się do newslettera i nie przegap okazji"
        class="absolute object-cover w-full h-[350px] left-0 top-0 md:w-[569px] md:h-full"
      />

      <div
        class="absolute md:hidden w-full h-[351px] left-0 top-0"
        style="
          background: linear-gradient(
            180deg,
            rgba(32, 41, 69, 0) 0%,
            #202945 100%
          );
        "
      />

      <div
        class="hidden md:block absolute left-0 top-0 w-[570px] h-full"
        style="
          background: linear-gradient(
            90deg,
            rgba(32, 41, 69, 0) 10%,
            #202945 100%
          );
        "
      />

      <NuxtImg
        src="/svgs/yellow-mail.svg"
        alt="mail"
        class="absolute z-10 ml-[39px] mt-[87px] w-[52px] h-[47px] md:ml-[51px] md:mt-[98px] md:w-[77px] md:h-[86px]"
      />

      <div
        class="relative md:absolute md:h-full md:w-full md:pl-[448px] lg:pr-[112px] pl-[24px] pr-[24px] mt-[350px] z-20 lg:pt-0 md:mt-[0px] pt-[17px]"
      >
        <div
          class="flex items-stretch gap-4 mb-5 lg:mt-[15px] xl:mt-[63px] md:mt-[10px]"
        >
          <h3
            class="text-white text-2xl lg:text-3xl font-bold align-self-stretch"
          >
            Zapisz się do newslettera i nie przegap okazji
          </h3>
        </div>

        <div
          class="flex flex-col md:flex-row md:flex-wrap items-stretch gap-4 md:gap-6 text-white/90 mb-6"
        >
          <div class="flex items-stretch gap-2">
            <NuxtImg
              src="/svgs/newsletter-sun.svg"
              alt="newsletter-sun"
              class="w-[24px] h-[24px]"
            />
            <span class="text-base font-medium">Informacje o nowościach</span>
          </div>

          <div class="flex items-stretch gap-2">
            <NuxtImg
              src="/svgs/newsletter-fotel.svg"
              alt="newsletter-fotel"
              class="w-[24px] h-[24px]"
            />
            <span class="text-base font-medium">Najnowsze trendy</span>
          </div>

          <div class="flex items-stretch gap-2">
            <NuxtImg
              src="/svgs/newsletter-lightbulb.svg"
              alt="newsletter-lightbulb"
              class="w-[24px] h-[24px]"
            />
            <span class="text-base font-medium">Praktyczne porady</span>
          </div>
        </div>

        <div
          class="flex flex-col md:flex-row gap-4 md:gap-3 items-stretch w-full"
        >
          <input
            v-model="email"
            type="email"
            placeholder="Podaj swój adres e-mail*"
            class="flex-1 rounded-lg bg-white px-4 py-3 text-brand-blue-700 placeholder-brand-blue-200 focus:outline-none focus:ring-2 focus:ring-orange-500 h-[60px]"
          />
          <button
            class="rounded-lg bg-brand-orange-700 text-white text-base w-full md:max-w-[204px] py-3 font-semibold cursor-pointer transition-transform transform hover:scale-104"
            @click="SendWebhook"
          >
            Zapisz się
          </button>
        </div>
        <p v-if="success" class="mt-2 text-sm font-semibold text-green-300">
          Dziękujemy za zapis do newslettera.
        </p>
        <p v-if="error" class="mt-2 text-sm font-semibold text-red-300">
          {{ error }}
        </p>
        <NuxtLink to="/polityka-prywatnosci" external>
          <p
            class="mt-[40px] md:mt-4 text-xs font-semibold text-white align-self-stretch md:mr-10 md:mb-[63px]"
          >
            Administratorem danych, które wpiszesz, będzie DOM.PL z siedzibą
            przy ul. Gen. Gustawa Orlicz-Dreszera 5/lok. 6, 15-797 Białystok.
            Twoje dane będą przetwarzane w celu wysyłania Ci naszych ofert
            handlowych i naszych partnerów. ...więcej
          </p>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

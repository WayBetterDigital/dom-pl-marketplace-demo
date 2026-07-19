<script setup lang="ts">
const advantages = [
  'Projekty domów na wąską działkę – inteligentne układy funkcjonalne maksymalizujące potencjał trudnych i wąskich gruntów.',
  'Nowoczesne domy parterowe – komfortowa przestrzeń bez barier architektonicznych, idealna dla rodzin z dziećmi oraz seniorów.',
  'Domy z poddaszem użytkowym – klasyka polskiego budownictwa, zapewniająca doskonały stosunek powierzchni użytkowej do kosztów realizacji.',
  'Projekty domów z garażem (jedno- i dwustanowiskowym) oraz domy bez garażu dedykowane na mniejsze parcele.'
]
</script>

<template>
  <div class="text-[14px] leading-6 text-brand-blue-700">
    <h2 class="text-[24px] leading-8 font-bold mb-6">
      Projekty domów jednorodzinnych zgodne<br>z przepisami i WT 2026
    </h2>

    <p class="mb-4">
      Planujesz budowę i szukasz idealnego miejsca dla swojej rodziny? Nasza
      platforma to nowoczesna, ogólnopolska baza, w której znajdziesz gotowe
      projekty domów stworzone przez najlepsze pracownie architektoniczne w
      kraju. Oferujemy tysiące sprawdzonych, funkcjonalnych i bezpiecznych
      rozwiązań dopasowanych do zróżnicowanych potrzeb inwestorów, wymiarów
      działek oraz możliwości finansowych.
    </p>
    <p class="mb-10">
      Niezależnie od tego, czy interesuje Cię tani w budowie dom parterowy,
      nowoczesna stodoła z antresolą, czy klasyczny dom z poddaszem użytkowym –
      z nami bez trudu postawisz pierwszy krok na drodze do własnych czterech
      kątów. Przeglądaj, filtruj i wybierz projekt domu, który idealnie wpisuje
      się w Twoje plany i styl życia.
    </p>

    <h3 class="text-[18px] leading-7 font-semibold mb-4">
      Gotowe projekty domów
    </h3>
    <p class="mb-2">
      Wybór odpowiedniej dokumentacji architektonicznej to klucz do sprawnego
      przejścia przez proces urzędowy i budowlany. Wszystkie oferowane przez nas
      projekty domów jednorodzinnych są w pełni zgodne z aktualnymi przepisami
      prawa budowlanego oraz najnowszymi warunkami technicznymi w zakresie
      energooszczędności.
    </p>
    <p class="mb-2">
      Dzięki zaawansowanej wyszukiwarce na naszej platformie, bez problemu
      dopasujesz plany do wymogów Miejscowego Planu Zagospodarowania
      Przestrzennego (MPZP) lub Warunków Zabudowy (WZ) w Twojej gminie. W naszej
      bazie znajdziesz m.in.:
    </p>
    <ul class="list-disc pl-5 mb-10 space-y-1">
      <li
        v-for="advantage in advantages"
        :key="advantage"
      >
        {{ advantage }}
      </li>
    </ul>

    <h3 class="text-[18px] leading-7 font-semibold mb-4">
      Projekt domu / projekty domów
    </h3>
    <p class="mb-4">
      W obecnych czasach optymalizacja kosztów inwestycji to priorytet dla
      większości inwestorów. Dlatego szczególną uwagę poświęcamy kategorii, jaką
      są projekty domów tanich w budowie. Charakteryzują się one prostą bryłą,
      dwuspadowym lub płaskim dachem oraz brakiem skomplikowanych elementów
      konstrukcyjnych (takich jak wykusze czy lukarny), co pozwala na realne
      oszczędności na materiałach budowlanych i robociźnie.
    </p>
    <p>
      Nasze nowoczesne projekty domów łączą minimalistyczny, modny design z
      energooszczędnością. Każda dokumentacja jest przygotowana pod montaż
      ekologicznych systemów grzewczych i instalacji OZE – w tym pomp ciepła,
      rekuperacji (wentylacji mechanicznej) oraz paneli fotowoltaicznych, co
      gwarantuje niskie rachunki w trakcie eksploatacji budynku.
    </p>
  </div>
</template>

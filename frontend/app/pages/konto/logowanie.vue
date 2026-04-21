<template>
  <UContainer class="flex flex-1 items-center justify-center py-16">
    <div class="w-full max-w-lg space-y-8">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-default">
          Witaj w serwisie
        </h1>
        <p class="mt-1 text-sm text-muted">
          Wybierz, jako kogo chcesz się zalogować lub zarejestrować
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 items-stretch">
        <!-- Klient -->
        <UCard>
          <div class="flex flex-col h-full gap-4">
            <div class="flex items-center gap-3 min-h-14">
              <div class="rounded-lg bg-primary/10 p-2.5">
                <UIcon
                  name="i-lucide-user"
                  class="size-6 text-primary"
                />
              </div>
              <div>
                <p class="font-semibold text-default">
                  Klient
                </p>
                <p class="text-xs text-muted">
                  Przeglądaj i kupuj projekty
                </p>
              </div>
            </div>

            <div class="space-y-2 mt-auto">
              <UButton
                to="/konto/logowanie-klient"
                block
                variant="solid"
              >
                Zaloguj się
              </UButton>
              <UButton
                to="/konto/rejestracja-klient"
                block
                variant="outline"
              >
                Zarejestruj się
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Sprzedawca -->
        <UCard>
          <div class="flex flex-col h-full gap-4">
            <div class="flex items-center gap-3 min-h-14">
              <div class="rounded-lg bg-primary/10 p-2.5">
                <UIcon
                  name="i-lucide-store"
                  class="size-6 text-primary"
                />
              </div>
              <div>
                <p class="font-semibold text-default">
                  Sprzedawca
                </p>
                <p class="text-xs text-muted">
                  Zarządzaj swoimi projektami
                </p>
              </div>
            </div>

            <div class="space-y-2 mt-auto">
              <UButton
                to="/konto/logowanie-sprzedawca"
                block
                variant="solid"
              >
                Zaloguj się
              </UButton>
              <UButton
                to="/konto/rejestracja-sprzedawca"
                block
                variant="outline"
              >
                Zarejestruj się
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>

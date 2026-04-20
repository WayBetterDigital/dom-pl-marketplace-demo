<script setup lang="ts">
import { useAuthService } from '~/composables/services/useAuthService'

const { register } = useAuthService()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''

  if (!firstName.value || !lastName.value || !email.value || !password.value) {
    errorMsg.value = 'Wypełnij wszystkie pola.'
    return
  }

  if (password.value.length < 8) {
    errorMsg.value = 'Hasło musi mieć co najmniej 8 znaków.'
    return
  }

  loading.value = true
  try {
    await register(email.value, password.value, firstName.value, lastName.value)
    console.log("Udane")
    await navigateTo('/konto/klient')
  } catch {
    errorMsg.value = 'Nie udało się utworzyć konta. Sprawdź czy podany e-mail nie jest już zajęty.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UContainer class="flex flex-1 items-center justify-center py-16">
    <div class="w-full max-w-sm space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-default">
          Utwórz konto
        </h1>
        <p class="mt-1 text-sm text-muted">
          Zarejestruj się, aby móc składać zamówienia
        </p>
      </div>

      <UCard>
        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="Imię"
              name="firstName"
            >
              <UInput
                v-model="firstName"
                placeholder="Jan"
                autocomplete="given-name"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Nazwisko"
              name="lastName"
            >
              <UInput
                v-model="lastName"
                placeholder="Kowalski"
                autocomplete="family-name"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            label="E-mail"
            name="email"
          >
            <UInput
              v-model="email"
              type="email"
              placeholder="jan@example.com"
              autocomplete="email"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Hasło"
            name="password"
          >
            <UInput
              v-model="password"
              type="password"
              placeholder="Min. 8 znaków"
              autocomplete="new-password"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="errorMsg"
            color="error"
            variant="soft"
            :description="errorMsg"
            icon="i-lucide-circle-alert"
          />

          <UButton
            type="submit"
            block
            class="cursor-pointer"
            :loading="loading"
          >
            Zarejestruj się
          </UButton>
        </form>
      </UCard>

      <p class="text-center text-sm text-muted">
        Masz już konto?
        <NuxtLink
          to="/konto/logowanie"
          class="font-medium text-primary hover:underline cursor-pointer"
        >
          Zaloguj się
        </NuxtLink>
      </p>
    </div>
  </UContainer>
</template>

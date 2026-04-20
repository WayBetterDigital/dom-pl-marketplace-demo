<script setup lang="ts">
import { useAuthService } from '~/composables/services/useAuthService'

const { login } = useAuthService()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleSubmit() {
  errorMsg.value = ''

  if (!email.value || !password.value) {
    errorMsg.value = 'Wypełnij wszystkie pola.'
    return
  }

  loading.value = true
  try {
    await login(email.value, password.value)
    await navigateTo('/konto/klient')
  } catch {
    errorMsg.value = 'Nieprawidłowy e-mail lub hasło.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UContainer class="flex flex-1 items-center justify-center py-16">
    <div class="w-full max-w-sm space-y-6">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-default cursor-pointer">
          Zaloguj się
        </h1>
        <p class="mt-1 text-sm text-muted">
          Wprowadź swoje dane, aby uzyskać dostęp do konta
        </p>
      </div>

      <UCard>
        <form
          class="space-y-4"
          @submit.prevent="handleSubmit"
        >
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
              placeholder="••••••••"
              autocomplete="current-password"
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
            Zaloguj się
          </UButton>
        </form>
      </UCard>

      <p class="text-center text-sm text-muted">
        Nie masz konta?
        <NuxtLink
          to="/konto/rejestracja"
          class="font-medium text-primary hover:underline"
        >
          Zarejestruj się
        </NuxtLink>
      </p>
    </div>
  </UContainer>
</template>

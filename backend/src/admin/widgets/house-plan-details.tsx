import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Select,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import type { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { sdk } from "../lib/client"

type HousePlan = {
  id: string
  title: string
  price: number
  description: string | null
  img: string | null
  house_area: number
  boiler_room_area: number | null
  rooms: number
  bathrooms_and_wc: number
  plot_dimensions: string
  min_plot_dimensions_after_adaptation: string | null
  floors: number
  building_width: number | null
  building_length: number | null
  building_footprint: number | null
  total_area: number | null
  roof_type: string | null
  roof_angle: number | null
  garage: string | null
  architectural_style: string | null
  energy_standard: string | null
  basement: string | null
  building_height: number | null
  fireplace: boolean | null
  terrace: boolean | null
  house_type: string | null
  family: { id: string; name: string } | null
  created_at: string
  updated_at: string
}

// Pomocniki konwersji dla planToForm
const ns = (v: number | null | undefined) => v != null ? String(v) : ""
const ss = (v: string | null | undefined) => v ?? ""
const boolToForm = (v: boolean | null) => v === true ? "tak" : v === false ? "nie" : ""

const planToForm = (plan: HousePlan) => ({
  title:                               plan.title,
  price:                               String(plan.price),
  description:                         ss(plan.description),
  img:                                 ss(plan.img),
  house_area:                          String(plan.house_area),
  boiler_room_area:                    ns(plan.boiler_room_area),
  rooms:                               String(plan.rooms),
  bathrooms_and_wc:                    String(plan.bathrooms_and_wc),
  plot_dimensions:                     plan.plot_dimensions,
  min_plot_dimensions_after_adaptation: ss(plan.min_plot_dimensions_after_adaptation),
  floors:                              ns(plan.floors),
  building_width:                      ns(plan.building_width),
  building_length:                     ns(plan.building_length),
  building_footprint:                  ns(plan.building_footprint),
  total_area:                          ns(plan.total_area),
  roof_type:                           ss(plan.roof_type),
  roof_angle:                          ns(plan.roof_angle),
  garage:                              ss(plan.garage),
  architectural_style:                 ss(plan.architectural_style),
  energy_standard:                     ss(plan.energy_standard),
  basement:                            ss(plan.basement),
  building_height:                     ns(plan.building_height),
  fireplace:                           boolToForm(plan.fireplace),
  terrace:                             boolToForm(plan.terrace),
  house_type:                          ss(plan.house_type),
})

type EditForm = ReturnType<typeof planToForm>

const numOrNull = (val: string) =>
  val && !isNaN(Number(val)) ? Number(val) : null

const formToBool = (val: string) =>
  val === "tak" ? true : val === "nie" ? false : null

const formatPLN = (value: number) =>
  value.toLocaleString("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 })

const DetailRow = ({ label, value }: { label: string; value: string | number | null }) => (
  <div className="flex items-center justify-between py-2 border-b border-ui-border-base last:border-0">
    <Text size="small" leading="compact" className="text-ui-fg-subtle">
      {label}
    </Text>
    <Text size="small" leading="compact" weight="plus">
      {value ?? "—"}
    </Text>
  </div>
)

const STOREFRONT_URL = (import.meta as any).env?.VITE_STOREFRONT_URL ?? 'http://localhost:3000'
function resolveUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('/')) return STOREFRONT_URL + url
  return url
}

const HousePlanDetailsWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)
  const [errors, setErrors] = useState<Partial<EditForm>>({})
  const queryClient = useQueryClient()

  const queryKey = ["house-plan-by-product", product.id]

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      sdk.client.fetch<{ house_plan: HousePlan | null }>(
        `/admin/products/${product.id}/house-plan`
      ),
  })

  const housePlan = data?.house_plan ?? null

  const { data: familyData } = useQuery({
    queryKey: ["house-plan-family-variants", housePlan?.family?.id],
    queryFn: () =>
      sdk.client.fetch<{ house_plans: (HousePlan & { product_id: string | null })[] }>(
        `/admin/house-plans?family_id=${housePlan!.family!.id}&limit=20`
      ),
    enabled: !!housePlan?.family?.id,
  })

  const familyVariants = (familyData?.house_plans ?? []).filter(
    (p) => p.id !== housePlan?.id
  )

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      sdk.client.fetch(`/admin/products/${product.id}/house-plan`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast.success("Plan domu zaktualizowany")
      setDrawerOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || "Nie udało się zaktualizować planu")
    },
  })

  const validate = (f: EditForm): Partial<EditForm> => {
    const e: Partial<EditForm> = {}
    if (!f.title.trim()) e.title = "Tytuł jest wymagany"
    if (!f.price || isNaN(Number(f.price))) e.price = "Podaj poprawną cenę"
    if (!f.house_area || isNaN(Number(f.house_area))) e.house_area = "Podaj powierzchnię"
    if (!f.rooms || isNaN(Number(f.rooms))) e.rooms = "Podaj liczbę pokoi"
    if (!f.bathrooms_and_wc || isNaN(Number(f.bathrooms_and_wc)))
      e.bathrooms_and_wc = "Podaj liczbę łazienek"
    if (!f.plot_dimensions.trim()) e.plot_dimensions = "Wymiary działki są wymagane"
    return e
  }

  const handleSave = () => {
    if (!form) return
    const e = validate(form)
    if (Object.keys(e).length > 0) { setErrors(e); return }

    updateMutation.mutate({
      title: form.title.trim(),
      price: Number(form.price),
      house_area: Number(form.house_area),
      rooms: Number(form.rooms),
      bathrooms_and_wc: Number(form.bathrooms_and_wc),
      plot_dimensions: form.plot_dimensions.trim(),
      description: form.description.trim() || null,
      img: form.img.trim() || null,
      boiler_room_area: numOrNull(form.boiler_room_area),
      min_plot_dimensions_after_adaptation: form.min_plot_dimensions_after_adaptation.trim() || null,
      floors: numOrNull(form.floors),
      building_width: numOrNull(form.building_width),
      building_length: numOrNull(form.building_length),
      building_footprint: numOrNull(form.building_footprint),
      total_area: numOrNull(form.total_area),
      roof_type: form.roof_type || null,
      roof_angle: numOrNull(form.roof_angle),
      garage: form.garage || null,
      architectural_style: form.architectural_style || null,
      energy_standard: form.energy_standard || null,
      basement: form.basement || null,
      building_height: numOrNull(form.building_height),
      fireplace: formToBool(form.fireplace),
      terrace: formToBool(form.terrace),
      house_type: form.house_type || null,
    })
  }

  const set = (key: keyof EditForm, val: string) => {
    setForm((f) => f ? { ...f, [key]: val } : f)
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  // Pole tekstowe / numeryczne
  const field = (key: keyof EditForm, label: string, opts?: { type?: string; required?: boolean }) => {
    if (!form) return null
    return (
      <div className="flex flex-col gap-y-1">
        <Label size="small" weight="plus">
          {label}{opts?.required && " *"}
        </Label>
        <Input
          type={opts?.type ?? "text"}
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          placeholder={label}
        />
        {errors[key] && (
          <Text size="small" leading="compact" className="text-ui-fg-error">
            {errors[key]}
          </Text>
        )}
      </div>
    )
  }

  // Pole Select z predefiniowanymi opcjami
  const selectField = (
    key: keyof EditForm,
    label: string,
    options: { label: string; value: string }[]
  ) => {
    if (!form) return null
    return (
      <div className="flex flex-col gap-y-1">
        <Label size="small" weight="plus">{label}</Label>
        <Select value={form[key]} onValueChange={(val) => set(key, val)}>
          <Select.Trigger>
            <Select.Value placeholder="Wybierz..." />
          </Select.Trigger>
          <Select.Content>
            {options.map((opt) => (
              <Select.Item key={opt.value} value={opt.value}>
                {opt.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Container className="px-6 py-4">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Ładowanie danych planu...
        </Text>
      </Container>
    )
  }

  if (!housePlan) {
    return (
      <Container className="px-6 py-4">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Brak powiązanego planu domu z tym produktem.
        </Text>
      </Container>
    )
  }

  return (
    <>
      <Container className="px-6 py-4 divide-y divide-ui-border-base">
        <div className="flex items-center justify-between pb-4">
          <Heading level="h2">Plan domu</Heading>
          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              setForm(planToForm(housePlan))
              setErrors({})
              setDrawerOpen(true)
            }}
          >
            Edytuj
          </Button>
        </div>

        {housePlan.img && (
          <div className="py-4">
            <div className="aspect-video overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle flex items-center justify-center">
              <img
                src={housePlan.img}
                alt={housePlan.title}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        )}

        <div className="pt-0 space-y-0">
          <DetailRow label="Cena" value={formatPLN(housePlan.price)} />
          {housePlan.family && (
            <DetailRow label="Rodzina projektów" value={housePlan.family.name} />
          )}
          <DetailRow label="Powierzchnia użytkowa" value={`${housePlan.house_area} m²`} />
          {housePlan.boiler_room_area != null && (
            <DetailRow label="Powierzchnia kotłowni" value={`${housePlan.boiler_room_area} m²`} />
          )}
          {housePlan.total_area != null && (
            <DetailRow label="Powierzchnia całkowita" value={`${housePlan.total_area} m²`} />
          )}
          {housePlan.building_footprint != null && (
            <DetailRow label="Powierzchnia zabudowy" value={`${housePlan.building_footprint} m²`} />
          )}
          <DetailRow label="Liczba pokoi" value={housePlan.rooms} />
          <DetailRow label="Łazienki i WC" value={housePlan.bathrooms_and_wc} />
          {housePlan.floors != null && (
            <DetailRow label="Kondygnacje" value={housePlan.floors} />
          )}
          <DetailRow label="Wymiary działki" value={`${housePlan.plot_dimensions} m`} />
          {housePlan.min_plot_dimensions_after_adaptation && (
            <DetailRow label="Min. wymiary po adaptacji" value={housePlan.min_plot_dimensions_after_adaptation} />
          )}
          {(housePlan.building_width != null && housePlan.building_length != null) && (
            <DetailRow label="Wymiary budynku" value={`${housePlan.building_width} × ${housePlan.building_length} m`} />
          )}
          {housePlan.building_height != null && (
            <DetailRow label="Wysokość budynku" value={`${housePlan.building_height} m`} />
          )}
          {housePlan.roof_type && (
            <DetailRow
              label="Dach"
              value={housePlan.roof_angle ? `${housePlan.roof_type}, ${housePlan.roof_angle}°` : housePlan.roof_type}
            />
          )}
          {housePlan.house_type && (
            <DetailRow label="Typ domu" value={housePlan.house_type} />
          )}
          {housePlan.garage && (
            <DetailRow label="Garaż" value={housePlan.garage} />
          )}
          {housePlan.basement && (
            <DetailRow label="Piwnica" value={housePlan.basement} />
          )}
          {housePlan.architectural_style && (
            <DetailRow label="Styl architektoniczny" value={housePlan.architectural_style} />
          )}
          {housePlan.energy_standard && (
            <DetailRow label="Standard energetyczny" value={housePlan.energy_standard} />
          )}
          {housePlan.fireplace != null && (
            <DetailRow label="Kominek" value={housePlan.fireplace ? "Tak" : "Nie"} />
          )}
          {housePlan.terrace != null && (
            <DetailRow label="Taras" value={housePlan.terrace ? "Tak" : "Nie"} />
          )}
          {housePlan.description && (
            <div className="py-3">
              <Text size="small" leading="compact" className="text-ui-fg-subtle mb-1">Opis</Text>
              <Text size="small" leading="compact">{housePlan.description}</Text>
            </div>
          )}
        </div>

        {housePlan.family && familyVariants.length > 0 && (
          <div className="pt-4">
            <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle mb-2">
              Inne warianty z rodziny „{housePlan.family.name}"
            </Text>
            <div className="flex flex-col mt-2">
              {familyVariants.map((variant) => (
                variant.product_id ? (
                  <a
                    key={variant.id}
                    href={`/app/products/${variant.product_id}`}
                    className="flex items-center justify-between py-2 border-b border-ui-border-base last:border-0 hover:bg-ui-bg-subtle-hover rounded px-1 -mx-1 transition-colors"
                  >
                    <Text size="small" leading="compact" className="text-ui-fg-interactive">
                      {variant.title}
                    </Text>
                    <Text size="small" leading="compact" className="text-ui-fg-subtle">
                      {formatPLN(variant.price)}
                    </Text>
                  </a>
                ) : (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between py-2 border-b border-ui-border-base last:border-0"
                  >
                    <Text size="small" leading="compact">{variant.title}</Text>
                    <Text size="small" leading="compact" className="text-ui-fg-subtle">
                      {formatPLN(variant.price)}
                    </Text>
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </Container>

      <GallerySection productId={product.id} />
      <SketchSection productId={product.id} />

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edytuj plan domu</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto p-6">

            {/* Podstawowe informacje */}
            <div className="flex flex-col gap-y-4">
              <Heading level="h3">Podstawowe informacje</Heading>
              {field("title", "Tytuł", { required: true })}
              {field("price", "Cena (PLN)", { type: "number", required: true })}
              <div className="flex flex-col gap-y-1">
                <Label size="small" weight="plus">Opis</Label>
                {form && (
                  <Textarea
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Opis planu domu..."
                    rows={4}
                  />
                )}
              </div>
            </div>

            {/* Parametry techniczne */}
            <div className="flex flex-col gap-y-4">
              <Heading level="h3">Parametry techniczne</Heading>
              {field("house_area", "Powierzchnia użytkowa (m²)", { type: "number", required: true })}
              {field("boiler_room_area", "Powierzchnia kotłowni (m²)", { type: "number" })}
              {field("total_area", "Powierzchnia całkowita (m²)", { type: "number" })}
              {field("building_footprint", "Powierzchnia zabudowy (m²)", { type: "number" })}
              {field("rooms", "Liczba pokoi", { type: "number", required: true })}
              {field("bathrooms_and_wc", "Łazienki i WC", { type: "number", required: true })}
              {field("floors", "Liczba kondygnacji", { type: "number" })}
              {field("plot_dimensions", "Wymiary działki (np. 15x20)", { required: true })}
              {field("min_plot_dimensions_after_adaptation", "Min. wymiary działki po adaptacji")}
            </div>

            {/* Bryła budynku */}
            <div className="flex flex-col gap-y-4">
              <Heading level="h3">Bryła budynku</Heading>
              {field("building_width", "Szerokość budynku (m)", { type: "number" })}
              {field("building_length", "Długość budynku (m)", { type: "number" })}
              {field("building_height", "Wysokość budynku (m)", { type: "number" })}
              {selectField("roof_type", "Rodzaj dachu", [
                { label: "Dwuspadowy", value: "dwuspadowy" },
                { label: "Czterospadowy", value: "czterospadowy" },
                { label: "Płaski", value: "płaski" },
                { label: "Mansardowy", value: "mansardowy" },
                { label: "Jednospadowy", value: "jednospadowy" },
              ])}
              {field("roof_angle", "Kąt nachylenia dachu (°)", { type: "number" })}
            </div>

            {/* Wyposażenie */}
            <div className="flex flex-col gap-y-4">
              <Heading level="h3">Wyposażenie</Heading>
              {selectField("garage", "Garaż", [
                { label: "Brak", value: "brak" },
                { label: "Jednostanowiskowy", value: "jednostanowiskowy" },
                { label: "Dwustanowiskowy", value: "dwustanowiskowy" },
                { label: "Trzystanowiskowy", value: "trzystanowiskowy" },
              ])}
              {selectField("basement", "Piwnica", [
                { label: "Brak", value: "brak" },
                { label: "Częściowa", value: "częściowa" },
                { label: "Pełna", value: "pełna" },
              ])}
              {selectField("fireplace", "Kominek", [
                { label: "Tak", value: "tak" },
                { label: "Nie", value: "nie" },
              ])}
              {selectField("terrace", "Taras", [
                { label: "Tak", value: "tak" },
                { label: "Nie", value: "nie" },
              ])}
            </div>

            {/* Styl i standard */}
            <div className="flex flex-col gap-y-4">
              <Heading level="h3">Styl i standard</Heading>
              {selectField("house_type", "Typ domu", [
                { label: "Jednorodzinny", value: "jednorodzinny" },
                { label: "Bliźniak", value: "bliźniak" },
                { label: "Rekreacyjny", value: "rekreacyjny" },
              ])}
              {selectField("architectural_style", "Styl architektoniczny", [
                { label: "Tradycyjny", value: "tradycyjny" },
                { label: "Nowoczesny", value: "nowoczesny" },
                { label: "Klasyczny", value: "klasyczny" },
                { label: "Skandynawski", value: "skandynawski" },
              ])}
              {selectField("energy_standard", "Standard energetyczny", [
                { label: "Standard", value: "standard" },
                { label: "Energooszczędny", value: "energooszczędny" },
                { label: "Pasywny", value: "pasywny" },
              ])}
            </div>

          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary" disabled={updateMutation.isPending}>
                  Anuluj
                </Button>
              </Drawer.Close>
              <Button size="small" onClick={handleSave} isLoading={updateMutation.isPending}>
                Zapisz
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

// ─── Gallery section ────────────────────────────────────────────────────────

type GalleryImage = {
  id: string
  house_plan_id: string
  url: string
  description: string | null
  category: string
  sort_order: number
}

const GALLERY_CATEGORIES = [
  { value: "wizualizacje", label: "Wizualizacje" },
  { value: "strefa_dzienna", label: "Strefa dzienna" },
  { value: "kuchnia", label: "Kuchnia" },
  { value: "lazienka", label: "Łazienka" },
]

const CATEGORY_LABEL: Record<string, string> = {
  wizualizacje: "Wizualizacje",
  strefa_dzienna: "Strefa dzienna",
  kuchnia: "Kuchnia",
  lazienka: "Łazienka",
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const GallerySection = ({ productId }: { productId: string }) => {
  const queryClient = useQueryClient()
  const galleryKey = ["product-gallery", productId]
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [editImage, setEditImage] = useState<GalleryImage | null>(null)
  const [addForm, setAddForm] = useState({ description: "", category: "wizualizacje" })
  const [editForm, setEditForm] = useState({ description: "", category: "wizualizacje" })

  const { data: galleryData, isLoading } = useQuery({
    queryKey: galleryKey,
    queryFn: () =>
      sdk.client.fetch<{ gallery_images: GalleryImage[] }>(
        `/admin/products/${productId}/gallery`
      ),
  })

  const images = galleryData?.gallery_images ?? []

  const addMutation = useMutation({
    mutationFn: async (file: File) => {
      const content = await toBase64(file)
      return sdk.client.fetch(`/admin/products/${productId}/gallery`, {
        method: "POST",
        body: {
          filename: file.name,
          mimeType: file.type,
          content,
          description: addForm.description || null,
          category: addForm.category,
          sort_order: images.length,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKey })
      toast.success("Zdjęcie dodane do galerii")
      setAddOpen(false)
      setAddForm({ description: "", category: "wizualizacje" })
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    onError: () => toast.error("Nie udało się dodać zdjęcia"),
  })

  const editMutation = useMutation({
    mutationFn: (imageId: string) =>
      sdk.client.fetch(`/admin/products/${productId}/gallery/${imageId}`, {
        method: "POST",
        body: {
          description: editForm.description || null,
          category: editForm.category,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKey })
      toast.success("Zdjęcie zaktualizowane")
      setEditImage(null)
    },
    onError: () => toast.error("Nie udało się zaktualizować"),
  })

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) =>
      sdk.client.fetch(`/admin/products/${productId}/gallery/${imageId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKey })
      toast.success("Zdjęcie usunięte")
    },
    onError: () => toast.error("Nie udało się usunąć zdjęcia"),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Plik za duży — maks. 10 MB")
      return
    }
    addMutation.mutate(file)
  }

  if (isLoading) {
    return (
      <Container className="px-6 py-4">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Ładowanie galerii...
        </Text>
      </Container>
    )
  }

  return (
    <>
      <Container className="px-6 py-4 divide-y divide-ui-border-base">
        <div className="flex items-center justify-between pb-4">
          <Heading level="h2">Galeria wizualizacji</Heading>
          <Button
            size="small"
            variant="secondary"
            onClick={() => setAddOpen(true)}
          >
            Dodaj zdjęcie
          </Button>
        </div>

        {images.length === 0 ? (
          <div className="py-6 text-center">
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Brak zdjęć w galerii.
            </Text>
          </div>
        ) : (
          <div className="pt-4 grid grid-cols-3 gap-3">
            {images.map((img) => (
              <div key={img.id} className="flex flex-col gap-1.5">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-ui-border-base bg-ui-bg-subtle group">
                  <img
                    src={resolveUrl(img.url)}
                    alt={img.description ?? ""}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      className="bg-white/90 hover:bg-white text-black rounded px-2 py-1 text-xs font-medium cursor-pointer"
                      onClick={() => {
                        setEditImage(img)
                        setEditForm({
                          description: img.description ?? "",
                          category: img.category,
                        })
                      }}
                    >
                      Edytuj
                    </button>
                    <button
                      type="button"
                      className="bg-red-500/90 hover:bg-red-500 text-white rounded px-2 py-1 text-xs font-medium cursor-pointer"
                      onClick={() => {
                        if (!confirm("Usunąć to zdjęcie?")) return
                        deleteMutation.mutate(img.id)
                      }}
                    >
                      Usuń
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge size="xsmall" color="grey">
                    {CATEGORY_LABEL[img.category] ?? img.category}
                  </Badge>
                  {img.description && (
                    <Text size="xsmall" leading="compact" className="text-ui-fg-subtle truncate">
                      {img.description}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* Add image drawer */}
      <Drawer open={addOpen} onOpenChange={setAddOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Dodaj zdjęcie do galerii</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-4 p-6">
            <div className="flex flex-col gap-y-1">
              <Label size="small" weight="plus">Opis (opcjonalny)</Label>
              <Input
                value={addForm.description}
                onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="np. Salon z widokiem na ogród"
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label size="small" weight="plus">Kategoria</Label>
              <Select
                value={addForm.category}
                onValueChange={(val) => setAddForm((f) => ({ ...f, category: val }))}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {GALLERY_CATEGORIES.map((c) => (
                    <Select.Item key={c.value} value={c.value}>
                      {c.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex flex-col gap-y-1">
              <Label size="small" weight="plus">Plik zdjęcia</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="text-sm text-ui-fg-subtle file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-ui-border-base file:bg-ui-bg-subtle file:text-ui-fg-base file:cursor-pointer"
                onChange={handleFileChange}
              />
              <Text size="xsmall" leading="compact" className="text-ui-fg-subtle">
                JPG, PNG, WebP · maks. 10 MB
              </Text>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary" disabled={addMutation.isPending}>
                  Anuluj
                </Button>
              </Drawer.Close>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>

      {/* Edit image drawer */}
      <Drawer open={!!editImage} onOpenChange={(open) => !open && setEditImage(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edytuj zdjęcie</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-4 p-6">
            {editImage && (
              <div className="aspect-video rounded-lg overflow-hidden border border-ui-border-base bg-ui-bg-subtle">
                <img
                  src={resolveUrl(editImage.url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-col gap-y-1">
              <Label size="small" weight="plus">Opis</Label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Opis zdjęcia..."
              />
            </div>
            <div className="flex flex-col gap-y-1">
              <Label size="small" weight="plus">Kategoria</Label>
              <Select
                value={editForm.category}
                onValueChange={(val) => setEditForm((f) => ({ ...f, category: val }))}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {GALLERY_CATEGORIES.map((c) => (
                    <Select.Item key={c.value} value={c.value}>
                      {c.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex justify-end gap-x-2">
              <Button
                size="small"
                variant="secondary"
                onClick={() => setEditImage(null)}
                disabled={editMutation.isPending}
              >
                Anuluj
              </Button>
              <Button
                size="small"
                isLoading={editMutation.isPending}
                onClick={() => editImage && editMutation.mutate(editImage.id)}
              >
                Zapisz
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

// ─── Sketch section ─────────────────────────────────────────────────────────

type HousePlanSketch = {
  id: string
  house_plan_id: string
  url: string
  floor: number
  type: number
  sort_order: number
}

const FLOOR_LABEL = (floor: number) => {
  if (floor === 0) return "Parter"
  if (floor === -1) return "Piwnica"
  return `Piętro ${floor}`
}

// 0 = rzut, 1 = rzut z opisami
const TYPE_LABEL: Record<number, string> = {
  0: "Rzut",
  1: "Rzut z opisami",
}

const FLOOR_OPTIONS = [
  { value: "-1", label: "Piwnica" },
  { value: "0", label: "Parter" },
  { value: "1", label: "Piętro 1" },
  { value: "2", label: "Piętro 2" },
  { value: "3", label: "Piętro 3" },
]

const TYPE_OPTIONS = [
  { value: "0", label: "Rzut" },
  { value: "1", label: "Rzut z opisami pomieszczeń" },
]

const SketchSection = ({ productId }: { productId: string }) => {
  const queryClient = useQueryClient()
  const sketchKey = ["product-sketches", productId]
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [addFloor, setAddFloor] = useState("0")
  const [addType, setAddType] = useState("0")

  const [editSketch, setEditSketch] = useState<HousePlanSketch | null>(null)
  const [editFloor, setEditFloor] = useState("0")
  const [editType, setEditType] = useState("szkic")

  const { data: sketchData, isLoading } = useQuery({
    queryKey: sketchKey,
    queryFn: () =>
      sdk.client.fetch<{ sketches: HousePlanSketch[] }>(
        `/admin/products/${productId}/sketches`
      ),
  })

  const sketches = sketchData?.sketches ?? []

  const addMutation = useMutation({
    mutationFn: async (file: File) => {
      const content = await toBase64(file)
      return sdk.client.fetch(`/admin/products/${productId}/sketches`, {
        method: "POST",
        body: {
          filename: file.name,
          mimeType: file.type,
          content,
          floor: Number(addFloor),
          type: Number(addType),
          sort_order: sketches.length,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sketchKey })
      toast.success("Szkic dodany")
      setAddOpen(false)
      setAddFloor("0")
      setAddType("0")
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    onError: (err: any) => {
      const msg = err?.body?.message || err?.message
      toast.error(msg || "Nie udało się dodać szkicu")
    },
  })

  const editMutation = useMutation({
    mutationFn: (sketchId: string) =>
      sdk.client.fetch(`/admin/products/${productId}/sketches/${sketchId}`, {
        method: "POST",
        body: { floor: Number(editFloor), type: Number(editType) },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sketchKey })
      toast.success("Szkic zaktualizowany")
      setEditSketch(null)
    },
    onError: (err: any) => {
      const msg = err?.body?.message || err?.message
      toast.error(msg || "Nie udało się zaktualizować szkicu")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (sketchId: string) =>
      sdk.client.fetch(`/admin/products/${productId}/sketches/${sketchId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sketchKey })
      toast.success("Szkic usunięty")
    },
    onError: () => toast.error("Nie udało się usunąć szkicu"),
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Plik za duży — maks. 10 MB")
      return
    }
    addMutation.mutate(file)
  }

  if (isLoading) {
    return (
      <Container className="px-6 py-4">
        <Text size="small" leading="compact" className="text-ui-fg-subtle">
          Ładowanie szkiców...
        </Text>
      </Container>
    )
  }

  return (
    <>
      <Container className="px-6 py-4 divide-y divide-ui-border-base">
        <div className="flex items-center justify-between pb-4">
          <Heading level="h2">Szkice kondygnacji</Heading>
          <Button
            size="small"
            variant="secondary"
            onClick={() => setAddOpen(true)}
          >
            Dodaj szkic
          </Button>
        </div>

        {sketches.length === 0 ? (
          <div className="py-6 text-center">
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Brak szkiców kondygnacji.
            </Text>
          </div>
        ) : (
          <div className="pt-4 grid grid-cols-3 gap-3">
            {sketches.map((sketch) => (
              <div key={sketch.id} className="flex flex-col gap-1.5">
                <div className="relative aspect-video rounded-lg overflow-hidden border border-ui-border-base bg-ui-bg-subtle group">
                  <img
                    src={resolveUrl(sketch.url)}
                    alt={FLOOR_LABEL(sketch.floor)}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      className="bg-white/90 hover:bg-white text-black rounded px-2 py-1 text-xs font-medium cursor-pointer"
                      onClick={() => {
                        setEditSketch(sketch)
                        setEditFloor(String(sketch.floor))
                        setEditType(String(sketch.type ?? 0))
                      }}
                    >
                      Edytuj
                    </button>
                    <button
                      type="button"
                      className="bg-red-500/90 hover:bg-red-500 text-white rounded px-2 py-1 text-xs font-medium cursor-pointer"
                      onClick={() => {
                        if (!confirm("Usunąć ten szkic?")) return
                        deleteMutation.mutate(sketch.id)
                      }}
                    >
                      Usuń
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge size="xsmall" color="grey">
                    {FLOOR_LABEL(sketch.floor)}
                  </Badge>
                  <Badge size="xsmall" color="blue">
                    {TYPE_LABEL[sketch.type] ?? sketch.type}
                  </Badge>

                </div>
              </div>
            ))}
          </div>
        )}
      </Container>

      {/* Add sketch drawer */}
      <Drawer open={addOpen} onOpenChange={setAddOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Dodaj szkic kondygnacji</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-4 p-6">
            <div className="flex flex-col gap-y-1">
              <Label size="small" weight="plus">Kondygnacja</Label>
              <Select value={addFloor} onValueChange={setAddFloor}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {FLOOR_OPTIONS.map((o) => (
                    <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex flex-col gap-y-1">
              <Label size="small" weight="plus">Rodzaj szkicu</Label>
              <Select value={addType} onValueChange={setAddType}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {TYPE_OPTIONS.map((o) => (
                    <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex flex-col gap-y-1">
              <Label size="small" weight="plus">Plik szkicu</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="text-sm text-ui-fg-subtle file:mr-3 file:py-1 file:px-3 file:rounded file:border file:border-ui-border-base file:bg-ui-bg-subtle file:text-ui-fg-base file:cursor-pointer"
                onChange={handleFileChange}
              />
              <Text size="xsmall" leading="compact" className="text-ui-fg-subtle">
                JPG, PNG, WebP · maks. 10 MB
              </Text>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary" disabled={addMutation.isPending}>
                  Anuluj
                </Button>
              </Drawer.Close>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>

      {/* Edit sketch drawer */}
      <Drawer open={!!editSketch} onOpenChange={(open) => !open && setEditSketch(null)}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edytuj szkic</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-y-4 p-6">
            {editSketch && (
              <div className="aspect-video rounded-lg overflow-hidden border border-ui-border-base bg-ui-bg-subtle">
                <img
                  src={resolveUrl(editSketch.url)}
                  alt=""
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex flex-col gap-y-1">
              <Label size="small" weight="plus">Kondygnacja</Label>
              <Select value={editFloor} onValueChange={setEditFloor}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {FLOOR_OPTIONS.map((o) => (
                    <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex flex-col gap-y-1">
              <Label size="small" weight="plus">Rodzaj szkicu</Label>
              <Select value={editType} onValueChange={setEditType}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {TYPE_OPTIONS.map((o) => (
                    <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <div className="flex justify-end gap-x-2">
              <Button
                size="small"
                variant="secondary"
                onClick={() => setEditSketch(null)}
                disabled={editMutation.isPending}
              >
                Anuluj
              </Button>
              <Button
                size="small"
                isLoading={editMutation.isPending}
                onClick={() => editSketch && editMutation.mutate(editSketch.id)}
              >
                Zapisz
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default HousePlanDetailsWidget

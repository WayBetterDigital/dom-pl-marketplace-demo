import { MedusaService } from "@medusajs/framework/utils"
import GalleryImage from "./models/gallery_image"

class GalleryModuleService extends MedusaService({
  GalleryImage,
}) {}

export default GalleryModuleService

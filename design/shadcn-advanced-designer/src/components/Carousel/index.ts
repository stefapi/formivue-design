import { GalleryHorizontalIcon } from '@lucide/vue'
import { createMaterial, materialNode, canvasContainer } from '../shared'
import { Carousel as CarouselSchema } from '../../schemas/Carousel'
import { Carousel as CarouselLocales } from '../../locales/Carousel'
import { CarouselSlide as CarouselSlideSchema } from '../../schemas/CarouselSlide'
import { CarouselSlide as CarouselSlideLocales } from '../../locales/CarouselSlide'

export const Carousel = createMaterial({
  name: 'Carousel',
  icon: GalleryHorizontalIcon,
  component: canvasContainer({
    label: ['Carousel', 'Carrousel', 'Carrusel'],
    child: {
      name: 'CarouselSlide',
      label: ['Slide', 'Diapositive', 'Diapositiva'],
    },
    layout: 'slides',
  }),
  child: 'CarouselSlide',
  children: [
    materialNode('CarouselSlide', { title: 'Slide 1' }),
    materialNode('CarouselSlide', { title: 'Slide 2' }),
  ],
  schema: CarouselSchema,
  locales: CarouselLocales,
})

export const CarouselSlide = createMaterial({
  name: 'CarouselSlide',
  parent: 'Carousel',
  component: canvasContainer({
    label: ['Slide', 'Diapositive', 'Diapositiva'],
    heading: 'title',
  }),
  droppable: true,
  schema: CarouselSlideSchema,
  locales: CarouselSlideLocales,
})

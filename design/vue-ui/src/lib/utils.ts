// @formivue-design/vue-ui — lib/utils — utilitaire `cn` du registry shadcn-vue
// (clsx pour la composition conditionnelle + tailwind-merge pour la
// déduplication/résolution des conflits de classes Tailwind).
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

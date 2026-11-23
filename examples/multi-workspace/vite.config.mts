import { createFormivueDesignViteConfig } from '../../scripts/vite.config.base.mts'

export default createFormivueDesignViteConfig({
  port: 3001,
  root: import.meta.dirname,
})

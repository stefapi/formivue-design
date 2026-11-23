// Phase 7 (7.3, note 6.7 du suivi) — sémantique modale au niveau APP : reka
// masque le fond des dialogs via aria-hidden (hideOthers) SANS inert — les
// fonds restent focusables au clavier. C'est un comportement applicatif (la
// spec a11y des setters l'instrumentait côté test) : le playground le rend
// vivant — tout enfant direct de body masqué par aria-hidden devient inert.
// (Réciproque : le retrait d'aria-hidden rend l'élément à nouveau focusable.)
export const useInertBackground = () => {
  if (typeof document === 'undefined') return
  const sync = () => {
    document
      .querySelectorAll('body > [aria-hidden="true"]')
      .forEach((el) => el.setAttribute('inert', ''))
    document
      .querySelectorAll('body > [inert]:not([aria-hidden="true"])')
      .forEach((el) => el.removeAttribute('inert'))
  }
  const observer = new MutationObserver(sync)
  observer.observe(document.body, {
    childList: true,
    attributes: true,
    attributeFilter: ['aria-hidden'],
  })
  sync()
  return () => observer.disconnect()
}
